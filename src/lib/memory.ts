import type { ProjectMemory } from "./prompts";

/**
 * Derive long-lived project memory from a completed version's stage outputs.
 * Avoids an extra LLM call by reusing structured data already produced.
 */
export function deriveMemory(
  contextMap: Record<string, unknown> | null,
  requirements: Record<string, unknown> | null,
  gapsRisks: { gaps?: unknown[]; risks?: unknown[] } | null,
  metadata: Record<string, unknown> | null,
  document: string | null,
): ProjectMemory {
  const goals = [
    ...asStrings(contextMap?.whatSuccessLooksLike),
    ...asStrings(contextMap?.explicitRequirements).slice(0, 5),
  ];

  const stakeholders = asStrings(contextMap?.whoItIsFor);

  const decisions =
    (metadata?.nextActions as { action: string; owner?: string }[])?.map((a) => ({
      decision: a.action,
      rationale: `Owner: ${a.owner ?? "unassigned"}`,
    })) ?? [];

  const assumptions = asStrings(metadata?.assumptions);

  const risks = (gapsRisks?.risks as { description?: string; category?: string }[])?.map(
    (r) => ({ description: r.description ?? "", category: r.category }),
  ) ?? [];

  const openQuestions = (metadata?.openQuestions as { question?: string }[])?.map(
    (q) => q.question ?? "",
  ) ?? [];

  const priorSummary = [
    contextMap?.oneLinePurpose
      ? String(contextMap.oneLinePurpose)
      : null,
    document
      ? `${document.split("\n").filter((l) => l.trim()).length} lines generated`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    goals: dedupe(goals).slice(0, 12),
    stakeholders: dedupe(stakeholders).slice(0, 12),
    decisions: decisions.slice(0, 10),
    assumptions: dedupe(assumptions).slice(0, 15),
    risks: risks.slice(0, 15),
    openQuestions: dedupe(openQuestions).slice(0, 15),
    priorSummary,
  };
}

function asStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}
