/**
 * Project Health Score — composite metric combining memory completeness,
 * requirement clarity, risk coverage, traceability, validation quality,
 * provider reliability, and document freshness.
 */

export interface HealthScoreInput {
  memoryCompleteness: number; // 0-100
  requirementClarity: number; // 0-100
  riskCoverage: number; // 0-100
  traceabilityCoverage: number; // 0-100
  validationQuality: number; // 0-100 (quality score from last version)
  providerReliability: number; // 0-100 (1 - fallback rate)
  documentFreshness: number; // 0-100 (days since last version → score)
}

export interface HealthScoreResult {
  overall: number;
  areas: { name: string; score: number; weight: number; status: "good" | "fair" | "poor" }[];
  weakAreas: string[];
  recommendedActions: string[];
}

const WEIGHTS = {
  memoryCompleteness: 0.10,
  requirementClarity: 0.18,
  riskCoverage: 0.15,
  traceabilityCoverage: 0.15,
  validationQuality: 0.20,
  providerReliability: 0.10,
  documentFreshness: 0.12,
};

export function calculateHealthScore(
  input: HealthScoreInput,
): HealthScoreResult {
  const areas = [
    { name: "Memory completeness", score: input.memoryCompleteness, weight: WEIGHTS.memoryCompleteness },
    { name: "Requirement clarity", score: input.requirementClarity, weight: WEIGHTS.requirementClarity },
    { name: "Risk coverage", score: input.riskCoverage, weight: WEIGHTS.riskCoverage },
    { name: "Traceability coverage", score: input.traceabilityCoverage, weight: WEIGHTS.traceabilityCoverage },
    { name: "Validation quality", score: input.validationQuality, weight: WEIGHTS.validationQuality },
    { name: "Provider reliability", score: input.providerReliability, weight: WEIGHTS.providerReliability },
    { name: "Document freshness", score: input.documentFreshness, weight: WEIGHTS.documentFreshness },
  ].map((a) => ({
    ...a,
    status: (a.score >= 70 ? "good" : a.score >= 50 ? "fair" : "poor") as "good" | "fair" | "poor",
  }));

  const overall = Math.round(
    areas.reduce((sum, a) => sum + a.score * a.weight, 0),
  );

  const weakAreas = areas
    .filter((a) => a.status !== "good")
    .map((a) => a.name);

  const recommendedActions: string[] = [];
  if (input.memoryCompleteness < 50) recommendedActions.push("Add more project context to improve memory");
  if (input.requirementClarity < 50) recommendedActions.push("Refine requirements — many are vague or inferred");
  if (input.riskCoverage < 50) recommendedActions.push("Identify more risks, especially in security and delivery");
  if (input.traceabilityCoverage < 50) recommendedActions.push("Build out traceability matrix linking goals to tests");
  if (input.validationQuality < 60) recommendedActions.push("Revise the document to address validation failures");
  if (input.providerReliability < 70) recommendedActions.push("Configure API keys to reduce fallback reliance");
  if (input.documentFreshness < 50) recommendedActions.push("Generate a new version — the document is stale");

  if (recommendedActions.length === 0) {
    recommendedActions.push("Project health is strong — consider exporting to delivery tools");
  }

  return { overall, areas, weakAreas, recommendedActions };
}

/** Calculate document freshness score from days since last version. */
export function freshnessScore(daysSinceUpdate: number): number {
  if (daysSinceUpdate <= 1) return 100;
  if (daysSinceUpdate <= 7) return 90;
  if (daysSinceUpdate <= 14) return 75;
  if (daysSinceUpdate <= 30) return 55;
  if (daysSinceUpdate <= 60) return 35;
  return 20;
}

/** Calculate provider reliability from fallback count vs total. */
export function providerReliabilityScore(
  fallbackCount: number,
  totalCalls: number,
): number {
  if (totalCalls === 0) return 100;
  return Math.round((1 - fallbackCount / totalCalls) * 100);
}
