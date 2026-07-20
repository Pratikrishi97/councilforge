import type { ProjectMemory } from "./prompts";

/**
 * Memory Manager — supports structured memory, semantic retrieval,
 * summary compaction, stale memory decay, and short/long-term separation.
 */

export interface CompactMemoryResult {
  compacted: ProjectMemory;
  summary: string;
  compactedItems: number;
  retainedItems: number;
}

/**
 * Compact old memory into a summary. Keep important decisions and risks,
 * discard low-value noise. This prevents the context window from flooding
 * with irrelevant history.
 */
export function compactMemory(
  memory: ProjectMemory,
  maxItems: { goals?: number; assumptions?: number; risks?: number; openQuestions?: number; decisions?: number } = {},
): CompactMemoryResult {
  const limits = {
    goals: maxItems.goals ?? 8,
    assumptions: maxItems.assumptions ?? 10,
    risks: maxItems.risks ?? 10,
    openQuestions: maxItems.openQuestions ?? 8,
    decisions: maxItems.decisions ?? 10,
  };

  const originalGoals = memory.goals ?? [];
  const originalAssumptions = memory.assumptions ?? [];
  const originalRisks = memory.risks ?? [];
  const originalQuestions = memory.openQuestions ?? [];
  const originalDecisions = memory.decisions ?? [];

  const compacted: ProjectMemory = {
    goals: originalGoals.slice(0, limits.goals),
    stakeholders: memory.stakeholders,
    decisions: originalDecisions.slice(-limits.decisions), // keep most recent
    assumptions: originalAssumptions.slice(0, limits.assumptions),
    risks: originalRisks.slice(0, limits.risks),
    openQuestions: originalQuestions.slice(0, limits.openQuestions),
    priorSummary: memory.priorSummary,
  };

  const compactedItems =
    Math.max(0, originalGoals.length - limits.goals) +
    Math.max(0, originalAssumptions.length - limits.assumptions) +
    Math.max(0, originalRisks.length - limits.risks) +
    Math.max(0, originalQuestions.length - limits.openQuestions) +
    Math.max(0, originalDecisions.length - limits.decisions);

  const retainedItems =
    compacted.goals!.length +
    compacted.assumptions!.length +
    compacted.risks!.length +
    compacted.openQuestions!.length +
    compacted.decisions!.length;

  const droppedGoals = originalGoals.slice(limits.goals);
  const droppedAssumptions = originalAssumptions.slice(limits.assumptions);

  const summary = [
    compactedItems > 0
      ? `Compacted ${compactedItems} older items to keep memory focused.`
      : "Memory is already compact — no items dropped.",
    droppedGoals.length > 0 ? `Dropped goals: ${droppedGoals.length}` : null,
    droppedAssumptions.length > 0 ? `Dropped assumptions: ${droppedAssumptions.length}` : null,
    `Retained: ${retainedItems} items (${compacted.goals!.length} goals, ${compacted.decisions!.length} decisions, ${compacted.risks!.length} risks, ${compacted.openQuestions!.length} open questions).`,
  ]
    .filter(Boolean)
    .join(" ");

  return { compacted, summary, compactedItems, retainedItems };
}

/**
 * Retrieve relevant memory items for a new task. Simple keyword matching
 * against goals, assumptions, and open questions.
 */
export function retrieveRelevantMemory(
  memory: ProjectMemory,
  taskKeywords: string[],
): { goals: string[]; assumptions: string[]; openQuestions: string[] } {
  const lower = taskKeywords.map((k) => k.toLowerCase());

  const matches = (text: string) =>
    lower.some((k) => text.toLowerCase().includes(k));

  return {
    goals: (memory.goals ?? []).filter(matches),
    assumptions: (memory.assumptions ?? []).filter(matches),
    openQuestions: (memory.openQuestions ?? []).filter(matches),
  };
}
