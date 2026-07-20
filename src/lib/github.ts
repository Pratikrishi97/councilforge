/**
 * Lightweight GitHub fetcher — no auth, uses the public REST API.
 * For low-volume public repos this is reliable enough for an MVP.
 * Falls back gracefully on rate limits / private repos.
 */

export interface RepoIntelligenceRaw {
  url: string;
  owner: string;
  repo: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  defaultBranch: string;
  readme: string | null;
  tree: RepoFileNode[];
  packageHints: string[];
  /** Contents of key manifest/config files for deeper intelligence. */
  keyFiles: { path: string; content: string }[];
  fetchedAt: string;
  warning?: string;
}

/** Manifest / config files worth fetching for deeper repo intelligence. */
const KEY_FILE_PATTERNS = [
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Gemfile",
  "composer.json",
  "mix.exs",
  "pubspec.yaml",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".env.example",
  "prisma/schema.prisma",
  "next.config.js",
  "next.config.mjs",
  "vite.config.ts",
  "vite.config.js",
  "tailwind.config.ts",
  "tailwind.config.js",
];

export interface RepoFileNode {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

function parseGithubUrl(raw: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(raw.trim());
    if (!/github\.com$/i.test(u.hostname) && u.hostname !== "github.com") {
      return null;
    }
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    // maybe a shorthand like "owner/repo"
    const m = raw.trim().match(/^([\w.-]+)\/([\w.-]+)$/);
    if (m) return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
    return null;
  }
}

const HEADERS: HeadersInit = {
  Accept: "application/vnd.github+json",
  "User-Agent": "repo-to-doc-intelligence/1.0",
};

export async function fetchRepoIntelligence(
  repoUrl: string,
): Promise<RepoIntelligenceRaw> {
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    throw new Error(`Could not parse a GitHub repository URL from: ${repoUrl}`);
  }
  const { owner, repo } = parsed;
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  // 1) repo metadata
  const metaRes = await fetch(base, { headers: HEADERS });
  if (metaRes.status === 404) {
    throw new Error(`Repository not found: ${owner}/${repo} (it may be private).`);
  }
  if (metaRes.status === 403) {
    throw new Error(
      "GitHub API rate limit reached. Try again in a few minutes or use a public repo.",
    );
  }
  if (!metaRes.ok) {
    throw new Error(`GitHub metadata request failed: ${metaRes.status}`);
  }
  const meta = await metaRes.json();

  // 2) README — try main branch raw first, fall back to API
  const branch = meta.default_branch ?? "main";
  let readme: string | null = null;
  const readmeCandidates = [
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/readme.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.MD`,
  ];
  for (const url of readmeCandidates) {
    try {
      const r = await fetch(url, { headers: HEADERS });
      if (r.ok) {
        readme = await r.text();
        break;
      }
    } catch {
      /* ignore */
    }
  }

  // 3) git tree (recursive) — capped to keep payload small
  let tree: RepoFileNode[] = [];
  try {
    const treeRes = await fetch(`${base}/git/trees/${branch}?recursive=1`, {
      headers: HEADERS,
    });
    if (treeRes.ok) {
      const treeJson = await treeRes.json();
      const all: RepoFileNode[] = (treeJson.tree ?? [])
        .filter((n: { type: string; path: string }) => n.type === "blob" || n.type === "tree")
        .map((n: { type: string; path: string; size?: number }) => ({
          path: n.path,
          type: n.type as "blob" | "tree",
          size: n.size,
        }));
      // cap at 600 entries to stay within model context budgets
      tree = all.slice(0, 600);
    }
  } catch {
    /* ignore tree errors */
  }

  // 4) package hints — scan tree for well-known manifests
  const pkgHints = new Set<string>();
  const hintMap: Record<string, string> = {
    "package.json": "Node.js / npm",
    "bun.lockb": "Bun",
    "yarn.lock": "Yarn",
    "pnpm-lock.yaml": "pnpm",
    "pom.xml": "Java / Maven",
    "build.gradle": "Java / Gradle",
    "build.gradle.kts": "Kotlin / Gradle",
    "go.mod": "Go",
    "Cargo.toml": "Rust",
    "requirements.txt": "Python (pip)",
    "pyproject.toml": "Python (PEP 517)",
    "Pipfile": "Python (Pipenv)",
    "Gemfile": "Ruby",
    "composer.json": "PHP / Composer",
    "mix.exs": "Elixir",
    "pubspec.yaml": "Dart / Flutter",
    "Podfile": "iOS / CocoaPods",
    "Package.swift": "SwiftPM",
    "CMakeLists.txt": "C/C++ (CMake)",
    "Dockerfile": "Docker",
    "docker-compose.yml": "Docker Compose",
    ".github/workflows": "GitHub Actions CI",
    "prisma/schema.prisma": "Prisma ORM",
    "next.config": "Next.js",
    "vite.config": "Vite",
    "tailwind.config": "Tailwind CSS",
  };
  for (const node of tree) {
    for (const [key, label] of Object.entries(hintMap)) {
      if (node.path === key || node.path.startsWith(key + "/") || node.path.includes(key)) {
        pkgHints.add(label);
      }
    }
  }

  // 5) Fetch contents of key manifest/config files for deeper intelligence.
  const keyFiles: { path: string; content: string }[] = [];
  const treePaths = new Set(tree.map((n) => n.path));
  const targets = KEY_FILE_PATTERNS.filter((p) => treePaths.has(p)).slice(0, 6);
  await Promise.all(
    targets.map(async (path) => {
      try {
        const r = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
          { headers: HEADERS },
        );
        if (r.ok) {
          const content = await r.text();
          // cap each file to keep the model context budget reasonable
          keyFiles.push({ path, content: content.slice(0, 4000) });
        }
      } catch {
        /* ignore individual file errors */
      }
    }),
  );

  return {
    url: `https://github.com/${owner}/${repo}`,
    owner,
    repo,
    description: meta.description,
    language: meta.language,
    stars: meta.stargazers_count ?? 0,
    forks: meta.forks_count ?? 0,
    topics: meta.topics ?? [],
    defaultBranch: branch,
    readme,
    tree,
    packageHints: [...pkgHints],
    keyFiles,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Compress a repo tree into a compact listing for the LLM — directories +
 * top-level files + a flat sample, so we stay well under context limits.
 */
export function summarizeTreeForModel(
  tree: RepoFileNode[],
  keyFiles: { path: string; content: string }[] = [],
): string {
  if (tree.length === 0) return "(file tree unavailable)";
  const topLevel = new Set<string>();
  const byDir = new Map<string, number>();
  for (const n of tree) {
    const seg = n.path.split("/")[0];
    topLevel.add(seg);
    const dir = n.path.includes("/") ? n.path.slice(0, n.path.indexOf("/")) : "(root)";
    byDir.set(dir, (byDir.get(dir) ?? 0) + 1);
  }
  const dirLines = [...byDir.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([d, c]) => `  ${d}/ (${c} files)`);
  const parts = [
    `Top-level entries (${topLevel.size}):`,
    [...topLevel].sort().slice(0, 60).join(", "),
    "",
    `Largest directories (of ${byDir.size}):`,
    ...dirLines,
    "",
    `Total tracked entries: ${tree.length}`,
  ];
  if (keyFiles.length > 0) {
    parts.push("", "## Key manifest / config files");
    for (const f of keyFiles) {
      parts.push(`### ${f.path}`, "```", f.content.slice(0, 2000), "```", "");
    }
  }
  return parts.join("\n");
}
