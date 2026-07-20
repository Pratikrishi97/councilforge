"use client";

import { useWorkspace, type ProviderLogEntry } from "@/store/workspace";
import { Empty } from "@/components/workspace/stage-panels";
import { Server, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  ingest: "Ingest",
  understand: "Understand",
  hypotheses: "Hypotheses",
  debate_round1: "Debate R1",
  debate_round2: "Debate R2",
  moderator: "Moderator",
  requirements: "Requirements",
  gaps_risks: "Gaps & Risks",
  strategy: "Strategy",
  generate: "Generate",
  validate: "Validate",
  revise: "Revise",
  validation_council: "Validation Council",
  metadata: "Metadata",
};

const ROLE_LABELS: Record<string, string> = {
  moderator: "Moderator",
  productManager: "Product Manager",
  businessAnalyst: "Business Analyst",
  solutionsArchitect: "Solutions Architect",
  engineeringLead: "Engineering Lead",
  qaLead: "QA Lead",
  securityReviewer: "Security Reviewer",
  uxReviewer: "UX Reviewer",
  deliveryManager: "Delivery Manager",
};

export function ProviderLogView() {
  const { providerLog } = useWorkspace();

  if (providerLog.length === 0) {
    return (
      <Empty label="Provider routing decisions will appear here as each stage runs. The router shows which provider powered each stage and why it was selected." />
    );
  }

  // dedupe by stage (keep last decision per stage)
  const byStage = new Map<string, ProviderLogEntry>();
  for (const entry of providerLog) {
    byStage.set(entry.stage, entry);
  }
  const entries = [...byStage.values()].reverse();

  const fallbackCount = entries.filter(
    (e) => e.decision.fallback,
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <Server className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Provider routing log</span>
        <span className="text-[11px] text-muted-foreground">
          {entries.length} stages routed
        </span>
        {fallbackCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            {fallbackCount} fallback{fallbackCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {entries.map((entry, i) => {
          const d = entry.decision;
          return (
            <div
              key={i}
              className={cn(
                "rounded-md border bg-card p-2.5",
                d.fallback && "border-amber-500/30",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">
                  {STAGE_LABELS[entry.stage] ?? entry.stage}
                </span>
                {entry.role && (
                  <span className="text-[10px] text-muted-foreground">
                    · {ROLE_LABELS[entry.role] ?? entry.role}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1.5">
                  {d.backend === "zai-default" ? (
                    <Zap className="h-3 w-3 text-primary" />
                  ) : (
                    <Server className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="text-xs font-medium">{d.providerName}</span>
                  {d.fallback && (
                    <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                      fallback
                    </span>
                  )}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {d.reason}
              </p>
              {d.model && (
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                  model: <code className="font-mono">{d.model}</code>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
