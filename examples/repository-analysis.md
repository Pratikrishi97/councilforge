# Example: Repository Analysis — vercel/next.js

A self-contained example of pointing CouncilForge at a public GitHub repository
and producing an architecture + tech-stack intelligence report.

## Input

In the **Source** panel, select **Repository** and paste a GitHub URL:

```
https://github.com/vercel/next.js
```

No PAT is required — the bundled `src/lib/github.ts` fetcher uses the public
GitHub REST API (anonymous, 60 req/hr per IP). For deeper scans, add a
fine-grained read-only PAT in the Providers tab under "GitHub (optional)".

## Configuration

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| Source           | Repository                                       |
| Repo URL         | `https://github.com/vercel/next.js`              |
| Doc type         | `AUTO` (engine infers `TECH_DESIGN` / `AUDIT`)   |
| Provider mode    | `hybrid` (paid long-context for the repo tree)   |
| Council depth    | 2-round debate                                   |
| Output format    | Markdown                                         |

## Expected Output

The **Repo Intel** stage fetches: repo metadata (stars, language %, license),
README, the recursive file tree (truncated to ~1,500 entries), and a
package-hint scan (`package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`,
`*.csproj`). The tree is summarised into a context-budget-safe outline.

The generated report contains:

1. **Architecture analysis** — package structure (`packages/next/src/*`),
   monorepo layout (Turborepo), entry points (`packages/next/src/server/next.ts`,
   `packages/next/src/client/index.ts`), and a layered diagram:

   ```mermaid
   flowchart TB
     subgraph CLI[packages/next/src/cli]
       CL[CLI entry]
     end
     subgraph Server[packages/next/src/server]
       SRV[Server runtime] --> RT[Router] --> RSC[React Server Components]
     end
     subgraph Build[packages/next/src/build]
       BL[Webpack/Turbopack]
     end
     CL --> BL --> Server
   ```

2. **Tech stack detection** — auto-detected from manifests:
   - Language: TypeScript (97%), JavaScript (2%), Rust (1% — SWC)
   - Build: Turbopack (Rust), fallback Webpack 5
   - Test: Jest + `swc/jest`, Playwright for e2e
   - Lint: ESLint + `eslint-plugin-react`
   - CI: GitHub Actions (vercel/next.js/.github/workflows/*)

3. **Module breakdown** — top-level packages with one-line responsibility:
   `next` (runtime), `next-swc` (native compiler), `next-env` (env loading),
   `next-build` (build orchestrator), `next-server` (request runtime), plus
   internal `crates/*` Rust crates (napi, swc transforms).

4. **Health signals** — open-issue count, PR throughput (last 30d), release
   cadence, license (MIT), security-advisory count.

5. **Gap analysis** — missing test coverage for `edge-runtime` package, no
   formal deprecation policy doc, etc. (each labeled `Confirmed` / `Inferred`
   / `Assumption`).

## Explanation

- **Repo source** triggers `src/lib/github.ts`'s `fetchRepoIntel()` which calls
  `/repos/{owner}/{repo}`, `/repos/.../readme`, `/repos/.../git/trees/{sha}?recursive=1`,
  and a filtered file scan for manifest hints — all over the public API.
- The recursive tree can exceed the model context window, so the summariser
  keeps only: top-level dirs, manifest files, README-like docs, and source files
  with high signal names (`index.ts`, `mod.ts`, `main.ts`, `lib.rs`).
- **AUTO** doc-type routes to `TECH_DESIGN` here because the source is code and
  the council identifies "architecture overview" as the highest-value artifact.
- **hybrid mode** is recommended because the repo tree alone (~120 KB summarised)
  needs a 200K-context model for the Understand stage; Brainstorm + Generate run
  on free-tier Groq. Typical cost: ~$0.05.
- The result is reproducible: re-running on the same SHA yields identical output
  (provider temperature is locked to 0.2 for reasoning stages). Re-running after
  a new release produces a diff visible in the **Diff** tab.
