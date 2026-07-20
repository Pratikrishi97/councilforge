import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeParse<T = unknown>(v: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

/** Cross-project intelligence: compare projects, find shared dependencies,
 *  identify repeated patterns and terminology. */
export async function GET() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      sourceType: true,
      repoUrl: true,
      updatedAt: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: {
          id: true,
          versionNumber: true,
          docType: true,
          contextMap: true,
          requirements: true,
          risks: true,
          assumptions: true,
        },
      },
    },
  });

  // Extract shared terminology + patterns across projects
  const termFrequency = new Map<string, number>();
  const techStackFrequency = new Map<string, number>();
  const riskPatterns = new Map<string, number>();
  const projectProfiles: {
    id: string;
    name: string;
    docType: string;
    techStack: string[];
    goals: string[];
    topRisks: string[];
    stakeholders: string[];
  }[] = [];

  for (const p of projects) {
    const v = p.versions[0];
    if (!v) continue;

    const ctx = safeParse<Record<string, unknown>>(v.contextMap);
    const reqs = safeParse<Record<string, unknown>>(v.requirements);
    const risks = safeParse<{ risks?: { description?: string; category?: string }[] }>({ risks: safeParse(v.risks) });

    const techStack = (ctx?.techStack as string[]) ?? [];
    const goals = (ctx?.whatSuccessLooksLike as string[]) ?? [];
    const stakeholders = (ctx?.whoItIsFor as string[]) ?? [];
    const topRisks = (risks?.risks ?? []).slice(0, 3).map((r) => r.description ?? "");

    projectProfiles.push({
      id: p.id,
      name: p.name,
      docType: v.docType,
      techStack,
      goals: goals.slice(0, 5),
      topRisks,
      stakeholders,
    });

    // accumulate frequencies
    for (const t of techStack) {
      techStackFrequency.set(t, (techStackFrequency.get(t) ?? 0) + 1);
    }
    for (const s of stakeholders) {
      termFrequency.set(s, (termFrequency.get(s) ?? 0) + 1);
    }
    for (const r of (risks?.risks ?? [])) {
      const cat = r.category ?? "general";
      riskPatterns.set(cat, (riskPatterns.get(cat) ?? 0) + 1);
    }
  }

  // find shared tech stacks (appear in >1 project)
  const sharedTech = [...techStackFrequency.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const sharedTerms = [...termFrequency.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const riskCategories = [...riskPatterns.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return Response.json({
    projectCount: projects.length,
    projects: projectProfiles,
    sharedTech,
    sharedTerms,
    riskCategories,
  });
}
