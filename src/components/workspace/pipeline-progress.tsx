"use client";

import { useWorkspace, type StageKey } from "@/store/workspace";
import { Check, Loader2, Circle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES: { key: StageKey; label: string; sub: string; optional?: boolean; group: string }[] = [
  { key: "ingest", label: "Collect", sub: "Context + repo intel", group: "understand" },
  { key: "understand", label: "Understand", sub: "Context map", group: "understand" },
  { key: "dynamic_council", label: "Dyn. Council", sub: "Adapt roles to domain", group: "understand" },
  { key: "research", label: "Research", sub: "Autonomous evidence", group: "understand" },
  { key: "hypotheses", label: "Hypotheses", sub: "Testable beliefs", group: "debate" },
  { key: "debate_round1", label: "Debate R1", sub: "Role proposals", group: "debate" },
  { key: "debate_round2", label: "Debate R2", sub: "Responses + revisions", group: "debate" },
  { key: "moderator", label: "Moderator", sub: "Consensus + conflicts", group: "debate" },
  { key: "ai_voting", label: "AI Voting", sub: "Weighted vote", group: "debate" },
  { key: "requirements", label: "Requirements", sub: "Inference engine", group: "analyze" },
  { key: "gaps_risks", label: "Gaps & Risks", sub: "10 + 6 categories", group: "analyze" },
  { key: "competitor_intel", label: "Competitors", sub: "Market intelligence", group: "analyze" },
  { key: "feature_recs", label: "Feature Recs", sub: "MVP + phases", group: "analyze" },
  { key: "strategy", label: "Strategy", sub: "Doc type selection", group: "generate" },
  { key: "generate", label: "Generate", sub: "Draft document", group: "generate" },
  { key: "validate", label: "Validate", sub: "Quality gates", group: "generate" },
  { key: "revise", label: "Revise", sub: "Fix weak sections", optional: true, group: "generate" },
  { key: "validation_council", label: "Val. Council", sub: "Multi-role review", group: "generate" },
  { key: "acceptance_tests", label: "Acc. Tests", sub: "Given/When/Then", group: "test" },
  { key: "backlog", label: "Backlog", sub: "Epics + stories", group: "test" },
  { key: "roadmap", label: "Roadmap", sub: "Delivery phases", group: "test" },
  { key: "evaluation", label: "Evaluation", sub: "Rubric scoring", group: "test" },
  { key: "cost_estimate", label: "Cost", sub: "Effort + infra", group: "intelligence" },
  { key: "sprint_plan", label: "Sprint", sub: "Delivery sequencing", group: "intelligence" },
  { key: "arch_simulation", label: "Arch Sim", sub: "Failure paths", group: "intelligence" },
  { key: "scenario_simulation", label: "Scenarios", sub: "What-if analysis", group: "intelligence" },
  { key: "knowledge_graph", label: "KG Update", sub: "Dependency graph", group: "persist" },
  { key: "decision_journal", label: "Decisions", sub: "Decision log", group: "persist" },
  { key: "metadata", label: "Metadata", sub: "Traceability + memory", group: "persist" },
];

const GROUP_LABELS: Record<string, string> = {
  understand: "Context & Understanding",
  debate: "Council Debate",
  analyze: "Analysis",
  generate: "Generate & Validate",
  test: "Tests & Delivery",
  intelligence: "Intelligence",
  persist: "Persist",
};

export function PipelineProgress() {
  const { stages, running, revisionApplied } = useWorkspace();

  const doneCount = STAGES.filter((s) => stages[s.key].status === "done").length;
  const skippedCount = STAGES.filter(
    (s) => stages[s.key].status === "skipped",
  ).length;
  const effective = STAGES.length - skippedCount;
  const progress = effective > 0 ? Math.round((doneCount / effective) * 100) : 0;
  const activeIndex = STAGES.findIndex((s) => stages[s.key].status === "running");

  // group stages
  const groups = new Map<string, typeof STAGES>();
  for (const s of STAGES) {
    const arr = groups.get(s.group) ?? [];
    arr.push(s);
    groups.set(s.group, arr);
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          AI OS pipeline
          {revisionApplied && (
            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              revised
            </span>
          )}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {doneCount}/{effective} · {progress}%
        </span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="space-y-3">
        {[...groups.entries()].map(([group, groupStages]) => {
          const groupActive = groupStages.some(
            (s) => stages[s.key].status === "running",
          );
          const groupDone = groupStages.every(
            (s) => stages[s.key].status === "done" || stages[s.key].status === "skipped",
          );
          return (
            <div key={group}>
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider",
                    groupActive
                      ? "text-primary"
                      : groupDone
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground/50",
                  )}
                >
                  {GROUP_LABELS[group] ?? group}
                </span>
              </div>
              <ol className="space-y-0.5">
                {groupStages.map((s) => {
                  const state = stages[s.key];
                  const isActive = STAGES.indexOf(s) === activeIndex;
                  return (
                    <li
                      key={s.key}
                      className={cn(
                        "flex items-start gap-2 rounded-md px-2 py-0.5 transition",
                        isActive && "bg-accent/60",
                      )}
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                        {state.status === "done" ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : state.status === "running" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : state.status === "skipped" ? (
                          <Minus className="h-3 w-3 text-muted-foreground/50" />
                        ) : (
                          <Circle
                            className={cn(
                              "h-3 w-3",
                              running
                                ? "text-muted-foreground/30"
                                : "text-muted-foreground/50",
                            )}
                          />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "text-[11px] font-medium",
                            state.status === "done"
                              ? "text-foreground"
                              : state.status === "running"
                                ? "text-primary"
                                : state.status === "skipped"
                                  ? "text-muted-foreground/50 line-through"
                                  : "text-muted-foreground",
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
