import { db } from "@/lib/db";
import {
  calculateHealthScore,
  freshnessScore,
  providerReliabilityScore,
} from "@/lib/health-score";

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

/** Calculate and return the project health score. Gathers inputs from the DB
 *  (latest version quality score, provider log fallback rate, requirements
 *  clarity, risk mitigations, traceability coverage, memory completeness,
 *  last version's freshness) and returns the HealthScoreResult. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, memory: true },
  });
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const latestVersion = await db.docVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      qualityScore: true,
      requirements: true,
      risks: true,
      traceability: true,
      providerLog: true,
      createdAt: true,
    },
  });

  // Memory completeness: scan project.memory JSON for populated top-level fields.
  let memoryCompleteness = 0;
  const memory = safeParse<Record<string, unknown>>(project.memory);
  if (memory) {
    const expectedKeys = [
      "goals",
      "stakeholders",
      "terminology",
      "decisions",
      "assumptions",
      "risks",
      "openQuestions",
      "summaries",
    ];
    const populated = expectedKeys.filter((k) => {
      const v = memory[k];
      if (v == null) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v).length > 0;
      return String(v).trim().length > 0;
    }).length;
    memoryCompleteness = Math.round((populated / expectedKeys.length) * 100);
  }

  // Requirement clarity: % of functional needs that are explicitly stated
  // (inferred=false) rather than inferred.
  let requirementClarity = 0;
  if (latestVersion?.requirements) {
    const reqs = safeParse<{
      functionalNeeds?: { inferred?: boolean }[];
    }>(latestVersion.requirements);
    if (reqs?.functionalNeeds && reqs.functionalNeeds.length > 0) {
      const explicit = reqs.functionalNeeds.filter((n) => !n.inferred).length;
      requirementClarity = Math.round(
        (explicit / reqs.functionalNeeds.length) * 100,
      );
    }
  }

  // Risk coverage: % of risks with a non-empty mitigation.
  let riskCoverage = 0;
  if (latestVersion?.risks) {
    const r = safeParse<{ risks?: { mitigation?: string }[] }>(
      latestVersion.risks,
    );
    if (r?.risks && r.risks.length > 0) {
      const mitigated = r.risks.filter((x) =>
        String(x.mitigation ?? "").trim(),
      ).length;
      riskCoverage = Math.round((mitigated / r.risks.length) * 100);
    }
  }

  // Traceability coverage: % of rows that link a requirement to a test scenario.
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

  // Validation quality: latest version's qualityScore (0 if not yet scored).
  const validationQuality = latestVersion?.qualityScore ?? 0;

  // Provider reliability: fallback count / total providerLog entries.
  let providerReliability = 100;
  if (latestVersion?.providerLog) {
    const log = safeParse<
      { usedFallback?: boolean; fallback?: boolean }[]
    >(latestVersion.providerLog);
    if (Array.isArray(log) && log.length > 0) {
      const fallbackCount = log.filter(
        (e) => e.usedFallback === true || e.fallback === true,
      ).length;
      providerReliability = providerReliabilityScore(fallbackCount, log.length);
    }
  }

  // Document freshness: days since the latest version was created.
  let documentFreshness = 0;
  if (latestVersion?.createdAt) {
    documentFreshness = freshnessScore(daysSince(latestVersion.createdAt));
  }

  const result = calculateHealthScore({
    memoryCompleteness,
    requirementClarity,
    riskCoverage,
    traceabilityCoverage,
    validationQuality,
    providerReliability,
    documentFreshness,
  });

  return Response.json(result);
}
