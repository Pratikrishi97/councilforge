import { db } from "@/lib/db";
import { recommendNextActions } from "@/lib/next-action";

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

function daysSince(date: Date): number {
  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

/** Recommend the next best actions for a project based on its current state. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const latestVersion = await db.docVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      document: true,
      qualityScore: true,
      openQuestions: true,
      risks: true,
      traceability: true,
      validationCouncil: true,
      createdAt: true,
    },
  });

  const versionCount = await db.docVersion.count({ where: { projectId } });

  const [backlogCount, acceptanceTestCount, pendingDecisions] =
    await Promise.all([
      db.backlogItem.count({ where: { projectId } }),
      db.acceptanceTest.count({ where: { projectId } }),
      db.decisionJournal.count({
        where: { projectId, confidence: "low" },
      }),
    ]);

  // Open questions count
  let openQuestionCount = 0;
  if (latestVersion?.openQuestions) {
    const q = safeParse<unknown[]>(latestVersion.openQuestions);
    if (Array.isArray(q)) openQuestionCount = q.length;
  }

  // Unresolved risk count: risks without a mitigation
  let unresolvedRiskCount = 0;
  if (latestVersion?.risks) {
    const r = safeParse<{ risks?: { mitigation?: string }[] }>(
      latestVersion.risks,
    );
    if (r?.risks && Array.isArray(r.risks)) {
      unresolvedRiskCount = r.risks.filter(
        (x) => !String(x.mitigation ?? "").trim(),
      ).length;
    }
  }

  // Traceability coverage
  let traceabilityCoverage = 0;
  if (latestVersion?.traceability) {
    const t = safeParse<
      { testScenario?: string; releaseItem?: string }[]
    >(latestVersion.traceability);
    if (Array.isArray(t) && t.length > 0) {
      const covered = t.filter(
        (row) =>
          String(row.testScenario ?? "").trim() &&
          String(row.releaseItem ?? "").trim(),
      ).length;
      traceabilityCoverage = Math.round((covered / t.length) * 100);
    }
  }

  // Validation council verdict
  let validationVerdict: string | null = null;
  let hasValidationCouncil = false;
  if (latestVersion?.validationCouncil) {
    const vc = safeParse<{
      consensus?: { overallVerdict?: string };
    }>(latestVersion.validationCouncil);
    if (vc?.consensus) {
      hasValidationCouncil = true;
      validationVerdict = vc.consensus.overallVerdict ?? null;
    }
  }

  const daysSinceUpdate = latestVersion?.createdAt
    ? daysSince(latestVersion.createdAt)
    : 0;

  const actions = recommendNextActions({
    hasDocument: Boolean(latestVersion?.document),
    qualityScore: latestVersion?.qualityScore ?? null,
    openQuestionCount,
    unresolvedRiskCount,
    pendingDecisions,
    traceabilityCoverage,
    hasValidationCouncil,
    validationVerdict,
    versionCount,
    daysSinceUpdate,
    hasBacklog: backlogCount > 0,
    hasAcceptanceTests: acceptanceTestCount > 0,
  });

  return Response.json({ actions });
}
