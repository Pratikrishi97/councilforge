import type { StageKey } from "./pipeline";

/**
 * Orchestrator AI — the top-level brain that decides which stages to run,
 * in what order, and whether to trigger deeper analysis. Instead of always
 * running all 29 stages, the orchestrator selects only the relevant ones
 * based on the input and project state.
 */

export interface OrchestratorInput {
  sourceType: "repo" | "text" | "mixed";
  hasRepo: boolean;
  docType: string;
  isContinuation: boolean;
  hasMemory: boolean;
  inputLength: number;
  /** User-requested gate mode */
  gateMode: "enabled" | "disabled";
  /** Whether to force a full run (skip optimization) */
  fullRun: boolean;
}

export interface OrchestratorPlan {
  stages: StageKey[];
  skipped: { stage: StageKey; reason: string }[];
  rationale: string;
  estimatedDuration: string;
  triggerResearch: boolean;
  triggerExtraDebate: boolean;
  adaptCouncil: boolean;
}

const ALL_STAGES: StageKey[] = [
  "ingest",
  "understand",
  "dynamic_council",
  "research",
  "hypotheses",
  "debate_round1",
  "debate_round2",
  "moderator",
  "ai_voting",
  "requirements",
  "gaps_risks",
  "competitor_intel",
  "feature_recs",
  "strategy",
  "generate",
  "validate",
  "revise",
  "validation_council",
  "acceptance_tests",
  "backlog",
  "roadmap",
  "evaluation",
  "cost_estimate",
  "sprint_plan",
  "arch_simulation",
  "scenario_simulation",
  "knowledge_graph",
  "decision_journal",
  "metadata",
];

/**
 * Plan the pipeline execution. For continuation runs with small input
 * changes, skip irrelevant stages. For new projects, run everything.
 */
export function planRun(input: OrchestratorInput): OrchestratorPlan {
  // Full run for new projects or when explicitly requested
  if (!input.isContinuation || input.fullRun) {
    return {
      stages: ALL_STAGES,
      skipped: [],
      rationale: input.fullRun
        ? "Full run requested — all stages will execute."
        : "New project — running the complete pipeline to establish baseline intelligence.",
      estimatedDuration: "8-12 minutes",
      triggerResearch: true,
      triggerExtraDebate: false,
      adaptCouncil: true,
    };
  }

  // Continuation run — optimize by skipping stages not affected by the change
  const skipped: { stage: StageKey; reason: string }[] = [];
  let stages = [...ALL_STAGES];

  // If the input is short (minor edit), skip research + competitor intel
  if (input.inputLength < 200) {
    stages = stages.filter((s) => {
      if (s === "research") {
        skipped.push({ stage: "research", reason: "Minor edit — reusing prior research evidence." });
        return false;
      }
      if (s === "competitor_intel") {
        skipped.push({ stage: "competitor_intel", reason: "Minor edit — competitor landscape unchanged." });
        return false;
      }
      return true;
    });
  }

  // If no repo, skip deep repo intelligence (understand still runs for text)
  // (understand stage handles both — don't skip it)

  // Always keep: generate, validate, metadata, knowledge_graph, decision_journal
  // These are the core output + persistence stages

  // Trigger extra debate if the input seems to challenge prior assumptions
  const triggerExtraDebate = input.inputLength > 500 && input.isContinuation;

  // Trigger research if the input mentions new technical concepts
  const triggerResearch = input.inputLength >= 200;

  return {
    stages,
    skipped,
    rationale: `Continuation run with ${input.inputLength} chars of new input. ${skipped.length > 0 ? `Optimized: skipping ${skipped.length} stages not affected by the change.` : "Running all stages."} ${triggerExtraDebate ? "Extra debate round triggered due to significant input change." : ""}`,
    estimatedDuration: skipped.length > 2 ? "4-6 minutes" : "6-10 minutes",
    triggerResearch,
    triggerExtraDebate,
    adaptCouncil: true,
  };
}
