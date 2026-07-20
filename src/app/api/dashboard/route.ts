import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Executive dashboard: aggregates project health, open questions, risks,
 *  decisions, confidence, provider usage, traceability across ALL projects. */
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
          status: true,
          qualityScore: true,
          revised: true,
          confidence: true,
          openQuestions: true,
          risks: true,
          providerLog: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          versions: true,
        },
      },
    },
  });

  // fetch related counts per project separately (no explicit relations on Project)
  const projectIds = projects.map((p) => p.id);
  const [kgCounts, decCounts, resCounts, compCounts, scCounts] = await Promise.all([
    db.knowledgeNode.groupBy({ by: ["projectId"], where: { projectId: { in: projectIds } }, _count: { id: true } }),
    db.decisionJournal.groupBy({ by: ["projectId"], where: { projectId: { in: projectIds } }, _count: { id: true } }),
    db.researchEntry.groupBy({ by: ["projectId"], where: { projectId: { in: projectIds } }, _count: { id: true } }),
    db.competitor.groupBy({ by: ["projectId"], where: { projectId: { in: projectIds } }, _count: { id: true } }),
    db.scenario.groupBy({ by: ["projectId"], where: { projectId: { in: projectIds } }, _count: { id: true } }),
  ]);
  const toMap = (arr: { projectId: string; _count: { id: number } }[]) =>
    new Map(arr.map((k) => [k.projectId, k._count.id]));
  const kgMap = toMap(kgCounts as { projectId: string; _count: { id: number } }[]);
  const decMap = toMap(decCounts as { projectId: string; _count: { id: number } }[]);
  const resMap = toMap(resCounts as { projectId: string; _count: { id: number } }[]);
  const compMap = toMap(compCounts as { projectId: string; _count: { id: number } }[]);
  const scMap = toMap(scCounts as { projectId: string; _count: { id: number } }[]);

  const totalProjects = projects.length;
  const totalVersions = projects.reduce((sum, p) => sum + p._count.versions, 0);
  const totalDecisions = projects.reduce((sum, p) => sum + (decMap.get(p.id) ?? 0), 0);
  const totalResearch = projects.reduce((sum, p) => sum + (resMap.get(p.id) ?? 0), 0);
  const totalScenarios = projects.reduce((sum, p) => sum + (scMap.get(p.id) ?? 0), 0);

  // collect open questions + risks from latest versions
  const openItems: { project: string; questions: number; risks: number }[] = [];
  for (const p of projects) {
    const v = p.versions[0];
    if (!v) continue;
    let qCount = 0;
    let rCount = 0;
    try {
      const q = v.openQuestions ? JSON.parse(v.openQuestions) : [];
      qCount = Array.isArray(q) ? q.length : 0;
    } catch {
      /* ignore */
    }
    try {
      const r = v.risks ? JSON.parse(v.risks) : [];
      rCount = Array.isArray(r) ? r.length : 0;
    } catch {
      /* ignore */
    }
    openItems.push({ project: p.name, questions: qCount, risks: rCount });
  }

  // provider usage stats
  const providerUsage = new Map<string, number>();
  for (const p of projects) {
    for (const v of p.versions) {
      try {
        const log = v.providerLog ? JSON.parse(v.providerLog) : [];
        if (Array.isArray(log)) {
          for (const entry of log as { decision?: { providerName?: string } }[]) {
            const name = entry.decision?.providerName ?? "Unknown";
            providerUsage.set(name, (providerUsage.get(name) ?? 0) + 1);
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  return Response.json({
    summary: {
      totalProjects,
      totalVersions,
      totalDecisions,
      totalResearch,
      totalScenarios,
    },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      sourceType: p.sourceType,
      repoUrl: p.repoUrl,
      updatedAt: p.updatedAt,
      versionCount: p._count.versions,
      knowledgeNodes: kgMap.get(p.id) ?? 0,
      decisions: decMap.get(p.id) ?? 0,
      research: resMap.get(p.id) ?? 0,
      competitors: compMap.get(p.id) ?? 0,
      scenarios: scMap.get(p.id) ?? 0,
      latestVersion: p.versions[0] ?? null,
    })),
    openItems,
    providerUsage: [...providerUsage.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
  });
}
