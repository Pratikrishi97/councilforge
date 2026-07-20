"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

/* ---------- small shared helpers ---------- */

export function Panel({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "warn" | "danger" | "success";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    warn: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StringList({
  items,
  empty = "Nothing surfaced yet.",
}: {
  items?: string[];
  empty?: string;
}) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{empty}</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-xs leading-relaxed">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function humanizeKey(k: string): string {
  return k
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
      <Info className="h-5 w-5 text-muted-foreground/50" />
      <p className="max-w-xs text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ---------- Context + Repo Intelligence ---------- */

export function ContextView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return (
      <Empty label="Context map + repository intelligence will appear here after the Understand stage." />
    );
  const d = data as Record<string, unknown>;
  const scalarKeys = [
    "projectName",
    "oneLinePurpose",
    "whatItIs",
    "whyItExists",
    "problemSolved",
    "currentState",
    "futureState",
    "architectureStyle",
    "uiBackendBoundary",
  ];
  const listKeys = [
    "mainWorkflows",
    "techStack",
    "architectureHints",
    "boundedContexts",
    "modulesAndFolders",
    "apiOrIntegrationClues",
    "authOrAuthzClues",
    "dataModelClues",
    "configAndEnvClues",
    "testCoverageClues",
    "deployOrCicdClues",
    "techDebtIndicators",
    "securityConcerns",
    "documentationGaps",
    "explicitRequirements",
    "implicitRequirements",
    "likelyMissingInformation",
    "whatSuccessLooksLike",
  ];
  const journeys = Array.isArray(d.likelyUserJourneys)
    ? (d.likelyUserJourneys as { name?: string; actor?: string; steps?: string[] }[])
    : [];
  const who = Array.isArray(d.whoItIsFor) ? (d.whoItIsFor as string[]) : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {scalarKeys.map((k) =>
          d[k] ? (
            <Panel key={k} title={humanizeKey(k)}>
              <p className="text-xs leading-relaxed text-foreground/90">
                {String(d[k])}
              </p>
            </Panel>
          ) : null,
        )}
        {who.length > 0 && (
          <Panel title="Who it is for">
            <div className="flex flex-wrap gap-1">
              {who.map((p, i) => (
                <Pill key={i} tone="primary">
                  {p}
                </Pill>
              ))}
            </div>
          </Panel>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {listKeys.map((k) =>
          Array.isArray(d[k]) && (d[k] as string[]).length > 0 ? (
            <Panel key={k} title={humanizeKey(k)}>
              <StringList items={d[k] as string[]} />
            </Panel>
          ) : null,
        )}
      </div>
      {journeys.length > 0 && (
        <Panel title="Likely user journeys" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <div className="space-y-2">
            {journeys.map((f, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2.5">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold">{f.name}</span>
                  {f.actor && <Pill tone="primary">{f.actor}</Pill>}
                </div>
                <ol className="ml-4 list-decimal space-y-0.5 text-xs">
                  {(f.steps ?? []).map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------- Hypotheses ---------- */

export function HypothesesView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Hypotheses will appear here after stage 2." />;
  const d = data as { hypotheses?: { id?: string; statement?: string; type?: string; evidence?: string; ifWrongImpact?: string; validationApproach?: string; confidence?: string }[] };
  const list = d.hypotheses ?? [];
  if (list.length === 0) return <Empty label="No hypotheses generated." />;
  return (
    <div className="space-y-2">
      {list.map((h, i) => (
        <div key={i} className="rounded-lg border bg-card p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {h.id ?? `H${i + 1}`}
                </span>
                {h.type && <Pill tone="neutral">{h.type}</Pill>}
                {h.confidence && (
                  <Pill tone={confTone(h.confidence)}>{h.confidence}</Pill>
                )}
              </div>
              <p className="mt-1 text-sm font-medium leading-snug">
                {h.statement}
              </p>
              <div className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
                {h.evidence && (
                  <div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Evidence:
                    </span>{" "}
                    <span className="text-muted-foreground">{h.evidence}</span>
                  </div>
                )}
                {h.validationApproach && (
                  <div>
                    <span className="font-semibold text-primary">
                      Validate by:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {h.validationApproach}
                    </span>
                  </div>
                )}
                {h.ifWrongImpact && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-destructive">
                      If wrong:
                    </span>{" "}
                    <span className="text-muted-foreground">{h.ifWrongImpact}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Debate + Consensus ---------- */

const ROLE_META: Record<string, { emoji: string; label: string }> = {
  productManager: { emoji: "🎯", label: "Product Manager" },
  businessAnalyst: { emoji: "📊", label: "Business Analyst" },
  solutionsArchitect: { emoji: "🏛️", label: "Solutions Architect" },
  engineeringLead: { emoji: "⚙️", label: "Engineering Lead" },
  qaLead: { emoji: "🧪", label: "QA Lead" },
  securityReviewer: { emoji: "🛡️", label: "Security Reviewer" },
  uxReviewer: { emoji: "🎨", label: "UX Reviewer" },
  deliveryManager: { emoji: "🚚", label: "Delivery Manager" },
};

const ROLE_FIELDS: { key: string; label: string }[] = [
  { key: "mattersMost", label: "Matters most" },
  { key: "couldGoWrong", label: "Could go wrong" },
  { key: "missing", label: "Missing" },
  { key: "mustClarify", label: "Must clarify" },
  { key: "shouldDocument", label: "Should document" },
  { key: "shouldChallenge", label: "Should challenge" },
];

export function DebateView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Council debate will appear here after the moderator stage." />;
  const d = data as Record<string, unknown>;

  const consensus = (d.consensus as Record<string, unknown>) ?? null;
  const conflicts = Array.isArray(d.conflicts)
    ? (d.conflicts as {
        description?: string;
        roles?: string[];
        resolution?: string;
        resolved?: boolean;
        compromise?: string;
      }[])
    : [];
  const unresolved = Array.isArray(d.unresolvedDisagreements)
    ? (d.unresolvedDisagreements as {
        description?: string;
        objectingRole?: string;
        objection?: string;
        whyUnresolved?: string;
        finalDecision?: string;
      }[])
    : [];
  const candidates = Array.isArray(d.candidateDirections)
    ? (d.candidateDirections as { name: string; rationale: string; tradeoff: string }[])
    : [];
  const needsAnotherRound = d.needsAnotherRound === true;
  const rationale = typeof d.rationale === "string" ? d.rationale : null;

  return (
    <div className="space-y-4">
      {/* Moderator rationale */}
      {rationale && (
        <div className="rounded-lg border border-primary/30 bg-accent/40 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Moderator rationale
            </span>
            {needsAnotherRound && (
              <Pill tone="warn">another round flagged</Pill>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">
            {rationale}
          </p>
        </div>
      )}

      {/* Consensus */}
      {consensus && (
        <Panel
          title="Council consensus"
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          className="border-l-2 border-l-primary"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {Array.isArray(consensus.topPriorities) && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Top priorities
                </p>
                <StringList items={consensus.topPriorities as string[]} />
              </div>
            )}
            {Array.isArray(consensus.topRisks) && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Top risks
                </p>
                <StringList items={consensus.topRisks as string[]} />
              </div>
            )}
            {Array.isArray(consensus.topGaps) && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Top gaps
                </p>
                <StringList items={consensus.topGaps as string[]} />
              </div>
            )}
            {Array.isArray(consensus.keyDecisionsNeeded) &&
              (consensus.keyDecisionsNeeded as { decision?: string; owner?: string; urgency?: string }[]).length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Key decisions needed
                  </p>
                  <div className="space-y-1">
                    {(consensus.keyDecisionsNeeded as { decision?: string; owner?: string; urgency?: string }[]).map((dec, i) => (
                      <div key={i} className="rounded border bg-muted/30 p-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          {dec.urgency && <Pill tone={sevTone(dec.urgency)}>{dec.urgency}</Pill>}
                          {dec.owner && (
                            <span className="text-[10px] text-muted-foreground">@{dec.owner}</span>
                          )}
                        </div>
                        <p className="mt-0.5">{dec.decision}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
          {typeof consensus.recommendedApproach === "string" && (
            <div className="mt-3 rounded-md bg-accent/50 p-2.5 text-xs">
              <span className="font-semibold">Recommended approach: </span>
              {consensus.recommendedApproach}
            </div>
          )}
        </Panel>
      )}

      {/* Conflicts resolved */}
      {conflicts.length > 0 && (
        <Panel title="Conflicts identified" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>
          <div className="space-y-1.5">
            {conflicts.map((c, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {c.resolved ? (
                    <Pill tone="success">resolved</Pill>
                  ) : (
                    <Pill tone="danger">unresolved</Pill>
                  )}
                  {c.roles && c.roles.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {c.roles.join(" vs ")}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-foreground/90">{c.description}</p>
                {c.resolution && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    → {c.resolution}
                  </p>
                )}
                {c.compromise && (
                  <p className="mt-0.5 text-[11px] italic text-muted-foreground/80">
                    Compromise: {c.compromise}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Unresolved disagreements */}
      {unresolved.length > 0 && (
        <Panel
          title="Unresolved disagreements"
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          className="border-l-2 border-l-destructive"
        >
          <div className="space-y-1.5">
            {unresolved.map((u, i) => (
              <div key={i} className="rounded-md border bg-destructive/5 p-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Pill tone="danger">objection</Pill>
                  {u.objectingRole && (
                    <span className="text-[10px] font-medium text-destructive">
                      {ROLE_META[u.objectingRole]?.label ?? u.objectingRole}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-foreground/90">{u.description}</p>
                {u.objection && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Objection: {u.objection}
                  </p>
                )}
                {u.whyUnresolved && (
                  <p className="mt-0.5 text-[11px] italic text-muted-foreground/80">
                    Why unresolved: {u.whyUnresolved}
                  </p>
                )}
                {u.finalDecision && (
                  <p className="mt-0.5 text-[11px] text-primary">
                    Final decision: {u.finalDecision}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Candidate directions */}
      {candidates.length > 0 && (
        <Panel title="Candidate directions" icon={<Info className="h-4 w-4 text-primary" />}>
          <div className="grid gap-2 md:grid-cols-3">
            {candidates.map((c, i) => {
              const chosen =
                typeof d.chosenDirection === "string" &&
                (d.chosenDirection as string).toLowerCase().includes(c.name.toLowerCase());
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-md border p-2.5",
                    chosen ? "border-primary bg-accent/50" : "bg-muted/40",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold">{c.name}</span>
                    {chosen && <Pill tone="success">chosen</Pill>}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{c.rationale}</p>
                  {c.tradeoff && (
                    <p className="mt-1 text-[11px] italic text-muted-foreground/80">
                      Tradeoff: {c.tradeoff}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {typeof d.chosenWhy === "string" && (
            <p className="mt-2 text-xs text-foreground/90">
              <span className="font-medium">Why this choice:</span> {d.chosenWhy}
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}

/* ---------- Round 1 proposals (shown in the debate_round1 tab) ---------- */

export function DebateRound1View({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Round 1 proposals will appear here as the council debates." />;
  const d = data as Record<string, unknown>;
  const roles = Object.keys(ROLE_META).filter((r) => d[r]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Round 1 — each council role independently proposes its interpretation,
        priorities, risks, and missing information.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {roles.map((r) => {
          const meta = ROLE_META[r];
          const rd = d[r] as {
            proposal?: string;
            topPriorities?: string[];
            risks?: string[];
            missingInfo?: string[];
            assumptionsChallenged?: string[];
          };
          return (
            <Panel
              key={r}
              title={`${meta.emoji} ${meta.label}`}
              className="border-l-2 border-l-primary/30"
            >
              {rd.proposal && (
                <p className="mb-2 text-xs font-medium leading-relaxed text-foreground/90">
                  {rd.proposal}
                </p>
              )}
              <div className="space-y-2">
                {rd.topPriorities && rd.topPriorities.length > 0 && (
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Top priorities
                    </p>
                    <StringList items={rd.topPriorities} />
                  </div>
                )}
                {rd.risks && rd.risks.length > 0 && (
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Risks
                    </p>
                    <StringList items={rd.risks} />
                  </div>
                )}
                {rd.missingInfo && rd.missingInfo.length > 0 && (
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Missing info
                    </p>
                    <StringList items={rd.missingInfo} />
                  </div>
                )}
                {rd.assumptionsChallenged && rd.assumptionsChallenged.length > 0 && (
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Assumptions challenged
                    </p>
                    <StringList items={rd.assumptionsChallenged} />
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Round 2 responses (shown in the debate_round2 tab) ---------- */

export function DebateRound2View({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Round 2 responses will appear here after roles respond to each other." />;
  const d = data as Record<string, unknown>;
  const roles = Object.keys(ROLE_META).filter((r) => d[r]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Round 2 — each role responds to the others, revises its stance if
        persuaded, and confirms or withdraws its positions.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {roles.map((r) => {
          const meta = ROLE_META[r];
          const rd = d[r] as {
            responses?: { to?: string; point?: string; agree?: boolean; reason?: string }[];
            revised?: boolean;
            revisedStance?: string;
            standsBy?: string[];
            withdraws?: string[];
          };
          return (
            <Panel
              key={r}
              title={`${meta.emoji} ${meta.label}`}
              className={rd.revised ? "border-l-2 border-l-amber-500" : "border-l-2 border-l-primary/30"}
            >
              {rd.revised && (
                <div className="mb-2">
                  <Pill tone="warn">revised stance</Pill>
                  {rd.revisedStance && (
                    <p className="mt-1 text-xs italic text-foreground/90">
                      {rd.revisedStance}
                    </p>
                  )}
                </div>
              )}
              {rd.responses && rd.responses.length > 0 && (
                <div className="mb-2">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Responses
                  </p>
                  <div className="space-y-1">
                    {rd.responses.map((resp, i) => (
                      <div key={i} className="rounded border bg-muted/30 p-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          {resp.agree ? (
                            <Pill tone="success">agrees</Pill>
                          ) : (
                            <Pill tone="danger">disagrees</Pill>
                          )}
                          {resp.to && (
                            <span className="text-[10px] text-muted-foreground">
                              → {ROLE_META[resp.to]?.label ?? resp.to}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5">{resp.point}</p>
                        {resp.reason && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {resp.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {rd.standsBy && rd.standsBy.length > 0 && (
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      Stands by
                    </p>
                    <StringList items={rd.standsBy} />
                  </div>
                )}
                {rd.withdraws && rd.withdraws.length > 0 && (
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Withdraws
                    </p>
                    <StringList items={rd.withdraws} />
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Requirements ---------- */

export function RequirementsView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Requirements will appear here after stage 4." />;
  const d = data as Record<string, unknown>;
  const functional = Array.isArray(d.functionalNeeds)
    ? (d.functionalNeeds as {
        id?: string;
        statement?: string;
        capability?: string;
        inferred?: boolean;
        confirmed?: boolean;
        priority?: string;
        source?: string;
      }[])
    : [];
  const nonFunctional = Array.isArray(d.nonFunctionalNeeds)
    ? (d.nonFunctionalNeeds as {
        id?: string;
        category?: string;
        statement?: string;
        target?: string;
        inferred?: boolean;
      }[])
    : [];
  const flows = Array.isArray(d.userFlows)
    ? (d.userFlows as { name?: string; actor?: string; steps?: string[] }[])
    : [];
  const acceptance = Array.isArray(d.acceptanceCriteria)
    ? (d.acceptanceCriteria as {
        id?: string;
        given?: string;
        when?: string;
        then?: string;
        requirementId?: string;
      }[])
    : [];
  const roles = Array.isArray(d.permissionsAndRoles)
    ? (d.permissionsAndRoles as { role?: string; capabilities?: string[] }[])
    : [];
  const coverage = (d.coverage as Record<string, number>) ?? null;

  return (
    <div className="space-y-4">
      {coverage && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([
            ["Confirmed", coverage.confirmedCount, "success"],
            ["Inferred", coverage.inferredCount, "warn"],
            ["Must", coverage.mustCount, "danger"],
            ["Should", coverage.shouldCount, "warn"],
            ["Could", coverage.couldCount, "neutral"],
          ] as const).map(([label, val, tone]) => (
            <div key={label} className="rounded-lg border bg-card p-2.5 text-center">
              <p className="text-2xl font-bold tabular-nums">{val ?? 0}</p>
              <Pill tone={tone}>{label}</Pill>
            </div>
          ))}
        </div>
      )}

      {functional.length > 0 && (
        <Panel title="Functional needs" icon={<CheckCircle2 className="h-4 w-4 text-primary" />}>
          <div className="space-y-1.5">
            {functional.map((f, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border bg-muted/30 p-2">
                <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  {f.id ?? `F${i + 1}`}
                </span>
                <span className="flex-1 text-xs leading-relaxed">
                  {f.statement}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="flex gap-1">
                    {f.priority && <Pill tone={prioTone(f.priority)}>{f.priority}</Pill>}
                    {f.inferred && !f.confirmed ? (
                      <Pill tone="warn">inferred</Pill>
                    ) : (
                      <Pill tone="success">confirmed</Pill>
                    )}
                  </span>
                  {f.capability && (
                    <span className="text-[9px] text-muted-foreground">
                      {f.capability}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {nonFunctional.length > 0 && (
        <Panel title="Non-functional needs">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {nonFunctional.map((f, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2">
                <div className="mb-0.5 flex items-center gap-1.5">
                  {f.category && <Pill tone="neutral">{f.category}</Pill>}
                  {f.inferred && <Pill tone="warn">inferred</Pill>}
                </div>
                <p className="text-xs leading-relaxed">{f.statement}</p>
                {f.target && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Target: {f.target}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {Array.isArray(d.businessRules) && (d.businessRules as string[]).length > 0 && (
          <Panel title="Business rules">
            <StringList items={d.businessRules as string[]} />
          </Panel>
        )}
        {Array.isArray(d.edgeCases) && (d.edgeCases as string[]).length > 0 && (
          <Panel title="Edge cases">
            <StringList items={d.edgeCases as string[]} />
          </Panel>
        )}
        {Array.isArray(d.exceptionHandling) &&
          (d.exceptionHandling as string[]).length > 0 && (
            <Panel title="Exception handling">
              <StringList items={d.exceptionHandling as string[]} />
            </Panel>
          )}
        {Array.isArray(d.reportingAndAnalytics) &&
          (d.reportingAndAnalytics as string[]).length > 0 && (
            <Panel title="Reporting & analytics">
              <StringList items={d.reportingAndAnalytics as string[]} />
            </Panel>
          )}
        {Array.isArray(d.rolloutNeeds) && (d.rolloutNeeds as string[]).length > 0 && (
          <Panel title="Rollout needs">
            <StringList items={d.rolloutNeeds as string[]} />
          </Panel>
        )}
      </div>

      {flows.length > 0 && (
        <Panel title="User flows">
          <div className="space-y-2">
            {flows.map((f, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2.5">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold">{f.name}</span>
                  {f.actor && <Pill tone="primary">{f.actor}</Pill>}
                </div>
                <ol className="ml-4 list-decimal space-y-0.5 text-xs">
                  {(f.steps ?? []).map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {roles.length > 0 && (
        <Panel title="Permissions & roles">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {roles.map((r, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2">
                <p className="text-xs font-semibold">{r.role}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(r.capabilities ?? []).map((c, j) => (
                    <Pill key={j} tone="neutral">
                      {c}
                    </Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {acceptance.length > 0 && (
        <Panel title="Acceptance criteria (Given / When / Then)">
          <div className="space-y-1.5">
            {acceptance.map((a, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {a.id ?? `AC${i + 1}`}
                  </span>
                  {a.requirementId && (
                    <span className="text-[10px] text-primary">
                      ← {a.requirementId}
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5">
                  <p>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Given</span>{" "}
                    {a.given}
                  </p>
                  <p>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">When</span>{" "}
                    {a.when}
                  </p>
                  <p>
                    <span className="font-semibold text-primary">Then</span> {a.then}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function prioTone(p?: string): "danger" | "warn" | "neutral" {
  if (p === "must") return "danger";
  if (p === "should") return "warn";
  return "neutral";
}

/* ---------- Gaps & Risks ---------- */

const GAP_CATEGORY_LABELS: Record<string, string> = {
  missing_scope: "Missing scope",
  missing_stakeholders: "Missing stakeholders",
  missing_requirements: "Missing requirements",
  missing_business_rules: "Missing business rules",
  missing_apis_or_integrations: "Missing APIs / integrations",
  missing_validations: "Missing validations",
  missing_acceptance_criteria: "Missing acceptance criteria",
  missing_non_functional_requirements: "Missing NFRs",
  missing_rollout_or_dependency_detail: "Missing rollout / dependencies",
  missing_ownership: "Missing ownership",
};

export function GapsRisksView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Gaps & risks will appear here after stage 5." />;
  const d = data as Record<string, unknown>;
  const gaps = Array.isArray(d.gaps)
    ? (d.gaps as {
        id?: string;
        category?: string;
        description?: string;
        severity?: string;
        recommendedAction?: string;
        blocksRelease?: boolean;
      }[])
    : [];
  const risks = Array.isArray(d.risks)
    ? (d.risks as {
        id?: string;
        category?: string;
        description?: string;
        likelihood?: string;
        impact?: string;
        severity?: string;
        mitigation?: string;
        owner?: string;
      }[])
    : [];
  const missing = Array.isArray(d.missingItems) ? (d.missingItems as string[]) : [];
  const contradictions = Array.isArray(d.contradictions)
    ? (d.contradictions as { a?: string; b?: string; resolution?: string }[])
    : [];

  // group gaps by category for a coverage view
  const gapsByCat = new Map<string, number>();
  for (const g of gaps) {
    const c = g.category ?? "uncategorized";
    gapsByCat.set(c, (gapsByCat.get(c) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      {gapsByCat.size > 0 && (
        <Panel title="Gap coverage by category">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(GAP_CATEGORY_LABELS).map((cat) => {
              const n = gapsByCat.get(cat) ?? 0;
              return (
                <span
                  key={cat}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
                    n > 0
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "border-border bg-muted/40 text-muted-foreground/60",
                  )}
                >
                  {GAP_CATEGORY_LABELS[cat]}
                  <span className="font-bold tabular-nums">{n}</span>
                </span>
              );
            })}
          </div>
        </Panel>
      )}

      {gaps.length > 0 && (
        <Panel title="Gaps" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>
          <div className="space-y-1.5">
            {gaps.map((g, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {g.category && (
                    <Pill tone="neutral">
                      {GAP_CATEGORY_LABELS[g.category] ?? humanizeKey(g.category)}
                    </Pill>
                  )}
                  {g.severity && <Pill tone={sevTone(g.severity)}>{g.severity}</Pill>}
                  {g.blocksRelease && <Pill tone="danger">blocks release</Pill>}
                </div>
                <p className="mt-0.5 text-xs text-foreground/90">{g.description}</p>
                {g.recommendedAction && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    → {g.recommendedAction}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {risks.length > 0 && (
        <Panel title="Risks" icon={<ShieldAlert className="h-4 w-4 text-destructive" />}>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-2">Category</th>
                  <th className="py-1.5 pr-2">Description</th>
                  <th className="py-1.5 pr-2">Likelihood</th>
                  <th className="py-1.5 pr-2">Impact</th>
                  <th className="py-1.5 pr-2">Severity</th>
                  <th className="py-1.5 pr-2">Mitigation</th>
                  <th className="py-1.5 pr-2">Owner</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 align-top">
                    <td className="py-1.5 pr-2">
                      <Pill tone="neutral">{r.category}</Pill>
                    </td>
                    <td className="py-1.5 pr-2">{r.description}</td>
                    <td className="py-1.5 pr-2">
                      {r.likelihood && <Pill tone={sevTone(r.likelihood)}>{r.likelihood}</Pill>}
                    </td>
                    <td className="py-1.5 pr-2">
                      {r.impact && <Pill tone={sevTone(r.impact)}>{r.impact}</Pill>}
                    </td>
                    <td className="py-1.5 pr-2">
                      {r.severity && <Pill tone={sevTone(r.severity)}>{r.severity}</Pill>}
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{r.mitigation}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {r.owner && r.owner !== "Unassigned" ? `@${r.owner}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {contradictions.length > 0 && (
        <Panel title="Contradictions detected" icon={<AlertTriangle className="h-4 w-4 text-destructive" />}>
          <div className="space-y-1.5">
            {contradictions.map((c, i) => (
              <div key={i} className="rounded-md border bg-destructive/5 p-2 text-xs">
                <p className="text-foreground/90">
                  <span className="text-destructive">A:</span> {c.a}
                </p>
                <p className="text-foreground/90">
                  <span className="text-destructive">B:</span> {c.b}
                </p>
                {c.resolution && (
                  <p className="mt-1 text-muted-foreground">→ {c.resolution}</p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {missing.length > 0 && (
        <Panel title="Missing items">
          <StringList items={missing} />
        </Panel>
      )}
    </div>
  );
}

function sevTone(s?: string): "danger" | "warn" | "success" | "neutral" {
  if (s === "high") return "danger";
  if (s === "medium") return "warn";
  if (s === "low") return "success";
  return "neutral";
}

function confTone(v?: string): "success" | "warn" | "danger" | "neutral" {
  if (v === "high") return "success";
  if (v === "medium") return "warn";
  if (v === "low") return "danger";
  return "neutral";
}

/* ---------- Strategy ---------- */

export function StrategyView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Document strategy will appear here after stage 6." />;
  const d = data as {
    chosenType?: string;
    reason?: string;
    alternativesConsidered?: { type: string; whyRejected: string }[];
    confidence?: string;
    recommendedCompanionDocs?: string[];
  };
  return (
    <div className="space-y-3">
      <Panel title="Chosen document type" icon={<Sparkles className="h-4 w-4 text-primary" />}>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
            {d.chosenType ?? "—"}
          </span>
          {d.confidence && <Pill tone={confTone(d.confidence)}>{d.confidence} confidence</Pill>}
        </div>
        {d.reason && (
          <p className="mt-2 text-xs leading-relaxed text-foreground/90">{d.reason}</p>
        )}
      </Panel>
      {d.alternativesConsidered && d.alternativesConsidered.length > 0 && (
        <Panel title="Alternatives considered">
          <div className="space-y-1.5">
            {d.alternativesConsidered.map((a, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2 text-xs">
                <span className="font-semibold">{a.type}</span>
                <p className="mt-0.5 text-muted-foreground">{a.whyRejected}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {d.recommendedCompanionDocs && d.recommendedCompanionDocs.length > 0 && (
        <Panel title="Recommended companion documents">
          <div className="flex flex-wrap gap-1.5">
            {d.recommendedCompanionDocs.map((c, i) => (
              <Pill key={i} tone="primary">
                {c}
              </Pill>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------- Validation ---------- */

export function ValidationView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Validation results will appear here after the validate stage." />;
  const d = data as {
    qualityScore?: number;
    qualityGates?: { gate?: string; status?: string; note?: string }[];
    needsRevision?: boolean;
    strengths?: string[];
    weaknesses?: string[];
    contradictionsFound?: string[];
  };
  const score = typeof d.qualityScore === "number" ? d.qualityScore : null;
  const gates = d.qualityGates ?? [];
  const passed = gates.filter((g) => g.status === "pass").length;
  const warned = gates.filter((g) => g.status === "warn").length;
  const failed = gates.filter((g) => g.status === "fail").length;

  return (
    <div className="space-y-4">
      {score !== null && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col items-center justify-center rounded-lg border bg-card p-4 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Quality score
            </p>
            <p
              className={cn(
                "text-4xl font-bold tabular-nums",
                score >= 80
                  ? "text-emerald-600 dark:text-emerald-400"
                  : score >= 60
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-destructive",
              )}
            >
              {score}
            </p>
            <p className="text-[10px] text-muted-foreground">/ 100</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {passed}
            </p>
            <p className="text-[10px] text-muted-foreground">passed</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {warned}
            </p>
            <p className="text-[10px] text-muted-foreground">warned</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums text-destructive">
              {failed}
            </p>
            <p className="text-[10px] text-muted-foreground">failed</p>
          </div>
        </div>
      )}

      {gates.length > 0 && (
        <Panel title="Quality gates">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {gates.map((g, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border bg-muted/30 p-2">
                <Pill tone={gateTone(g.status)}>{g.status}</Pill>
                <div className="flex-1">
                  <p className="text-xs font-medium">{g.gate}</p>
                  {g.note && (
                    <p className="text-[11px] text-muted-foreground">{g.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {d.strengths && d.strengths.length > 0 && (
          <Panel title="Strengths" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}>
            <StringList items={d.strengths} />
          </Panel>
        )}
        {d.weaknesses && d.weaknesses.length > 0 && (
          <Panel title="Weaknesses" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>
            <StringList items={d.weaknesses} />
          </Panel>
        )}
      </div>

      {d.contradictionsFound && d.contradictionsFound.length > 0 && (
        <Panel title="Contradictions found" icon={<AlertTriangle className="h-4 w-4 text-destructive" />}>
          <StringList items={d.contradictionsFound} />
        </Panel>
      )}
    </div>
  );
}

function gateTone(s?: string): "success" | "warn" | "danger" | "neutral" {
  if (s === "pass") return "success";
  if (s === "warn") return "warn";
  if (s === "fail") return "danger";
  return "neutral";
}

/* ---------- Validation Council (multi-role review) ---------- */

export function ValidationCouncilView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return (
      <Empty label="The validation council review will appear here after the validation_council stage." />
    );
  const d = data as Record<string, unknown>;
  const reviews = (d.reviews as Record<string, unknown>) ?? {};
  const consensus = (d.consensus as Record<string, unknown>) ?? null;

  const reviewRoles = Object.keys(ROLE_META).filter((r) => reviews[r]);
  const overallVerdict = consensus?.overallVerdict as string | undefined;
  const deliveryReady = consensus?.deliveryReady === true;
  const criticalIssues = Array.isArray(consensus?.criticalIssues)
    ? (consensus!.criticalIssues as string[])
    : [];
  const recommendations = Array.isArray(consensus?.recommendations)
    ? (consensus!.recommendations as string[])
    : [];

  return (
    <div className="space-y-4">
      {consensus && (
        <div
          className={cn(
            "rounded-lg border p-3",
            overallVerdict === "approved"
              ? "border-emerald-500/40 bg-emerald-500/5"
              : overallVerdict === "approved-with-notes"
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-destructive/40 bg-destructive/5",
          )}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={cn(
                "h-5 w-5",
                overallVerdict === "approved"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : overallVerdict === "approved-with-notes"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-destructive",
              )}
            />
            <span className="text-sm font-semibold">Council verdict</span>
            <Pill tone={overallVerdict === "approved" ? "success" : overallVerdict === "approved-with-notes" ? "warn" : "danger"}>
              {overallVerdict ?? "pending"}
            </Pill>
            {deliveryReady && <Pill tone="success">delivery-ready</Pill>}
          </div>
          {criticalIssues.length > 0 && (
            <div className="mt-2">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                Critical issues
              </p>
              <StringList items={criticalIssues} />
            </div>
          )}
          {recommendations.length > 0 && (
            <div className="mt-2">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recommendations
              </p>
              <StringList items={recommendations} />
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {reviewRoles.map((r) => {
          const meta = ROLE_META[r];
          const rd = reviews[r] as {
            issues?: { severity?: string; issue?: string; recommendation?: string }[];
            verdict?: string;
          };
          return (
            <Panel
              key={r}
              title={`${meta.emoji} ${meta.label}`}
              className={cn(
                "border-l-2",
                rd.verdict === "approve"
                  ? "border-l-emerald-500"
                  : rd.verdict === "approve-with-notes"
                    ? "border-l-amber-500"
                    : "border-l-destructive",
              )}
            >
              {rd.verdict && (
                <div className="mb-2">
                  <Pill
                    tone={
                      rd.verdict === "approve"
                        ? "success"
                        : rd.verdict === "approve-with-notes"
                          ? "warn"
                          : "danger"
                    }
                  >
                    {rd.verdict}
                  </Pill>
                </div>
              )}
              {rd.issues && rd.issues.length > 0 ? (
                <div className="space-y-1.5">
                  {rd.issues.map((iss, i) => (
                    <div key={i} className="rounded border bg-muted/30 p-1.5 text-xs">
                      {iss.severity && (
                        <Pill tone={sevTone(iss.severity)}>{iss.severity}</Pill>
                      )}
                      <p className="mt-0.5 text-foreground/90">{iss.issue}</p>
                      {iss.recommendation && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          → {iss.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">No issues found.</p>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Metadata (traceability + assumptions + confidence) ---------- */

export function MetadataView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Metadata will appear here after the final stage." />;
  const d = data as Record<string, unknown>;
  const assumptions = Array.isArray(d.assumptions) ? (d.assumptions as string[]) : [];
  const confidence = (d.confidence as Record<string, string>) ?? {};
  const confidenceNotes = (d.confidenceNotes as Record<string, string>) ?? {};
  const increaseConfidence = Array.isArray(d.whatWouldIncreaseConfidence)
    ? (d.whatWouldIncreaseConfidence as string[])
    : [];
  const missingInfo = Array.isArray(d.missingInformation)
    ? (d.missingInformation as string[])
    : [];
  const openQ = Array.isArray(d.openQuestions)
    ? (d.openQuestions as { question?: string; why?: string; blocksQuality?: boolean }[])
    : [];
  const nextActions = Array.isArray(d.nextActions)
    ? (d.nextActions as { action?: string; owner?: string; priority?: string }[])
    : [];
  const traceability = Array.isArray(d.traceability)
    ? (d.traceability as {
        id?: string;
        businessObjective?: string;
        requirement?: string;
        feature?: string;
        acceptanceCriteria?: string;
        testScenario?: string;
        releaseItem?: string;
        owner?: string;
      }[])
    : [];
  const changeSummary = typeof d.changeSummary === "string" ? d.changeSummary : null;

  const confLabels: Record<string, string> = {
    businessContext: "Business context",
    requirements: "Requirements",
    technicalDetail: "Technical detail",
    timeline: "Timeline",
  };

  return (
    <div className="space-y-4">
      {changeSummary && (
        <div className="rounded-lg border border-primary/30 bg-accent/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Change summary
          </p>
          <p className="mt-0.5 text-xs text-foreground/90">{changeSummary}</p>
        </div>
      )}

      <Panel title="Confidence scoring" icon={<Info className="h-4 w-4 text-primary" />}>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {Object.keys(confLabels).map((k) => {
            const v = confidence[k];
            return (
              <div key={k} className="rounded-md border bg-muted/30 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {confLabels[k]}
                </p>
                <div className="mt-1">
                  <Pill tone={confTone(v)}>{v ?? "—"}</Pill>
                </div>
                {confidenceNotes[k] && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {confidenceNotes[k]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {increaseConfidence.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              What would increase confidence
            </p>
            <StringList items={increaseConfidence} />
          </div>
        )}
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Assumptions">
          <StringList items={assumptions} />
        </Panel>
        <Panel title="Missing information">
          <StringList items={missingInfo} />
        </Panel>
      </div>

      {openQ.length > 0 && (
        <Panel title="Open questions">
          <div className="space-y-1.5">
            {openQ.map((q, i) => (
              <div key={i} className="rounded-md border bg-muted/30 p-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs">❓</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{q.question}</p>
                    {q.why && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Why: {q.why}
                      </p>
                    )}
                  </div>
                  {q.blocksQuality && <Pill tone="danger">blocks quality</Pill>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {nextActions.length > 0 && (
        <Panel title="Next actions">
          <div className="space-y-1.5">
            {nextActions.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
              >
                {a.priority && <Pill tone={sevTone(a.priority)}>{a.priority}</Pill>}
                <span className="flex-1 text-xs">{a.action}</span>
                {a.owner && (
                  <span className="text-[11px] text-muted-foreground">@{a.owner}</span>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {traceability.length > 0 && (
        <Panel title="Traceability matrix" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-2">Business objective</th>
                  <th className="py-1.5 pr-2">Requirement</th>
                  <th className="py-1.5 pr-2">Feature</th>
                  <th className="py-1.5 pr-2">Acceptance criteria</th>
                  <th className="py-1.5 pr-2">Test scenario</th>
                  <th className="py-1.5 pr-2">Release item</th>
                  <th className="py-1.5 pr-2">Owner</th>
                </tr>
              </thead>
              <tbody>
                {traceability.map((t, i) => (
                  <tr key={i} className="border-b last:border-0 align-top">
                    <td className="py-1.5 pr-2">{t.businessObjective}</td>
                    <td className="py-1.5 pr-2">{t.requirement}</td>
                    <td className="py-1.5 pr-2">{t.feature}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {t.acceptanceCriteria}
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {t.testScenario}
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {t.releaseItem}
                    </td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{t.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------- New Intelligence Stage Panels ---------- */

/* ---- Research View ---- */
export function ResearchView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Autonomous research evidence will appear here after the research stage." />;
  const d = data as { topics?: { topic?: string; evidenceSummary?: string; references?: { title?: string; url?: string; relevance?: string }[]; confidence?: string; unresolvedGaps?: string[] }[]; overallEvidenceSummary?: string; councilShouldDebate?: string[] };
  return (
    <div className="space-y-4">
      {d.overallEvidenceSummary && (
        <Panel title="Evidence summary" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <p className="text-xs leading-relaxed text-foreground/90">{d.overallEvidenceSummary}</p>
        </Panel>
      )}
      {(d.topics ?? []).map((t, i) => (
        <Panel key={i} title={t.topic ?? `Topic ${i + 1}`} icon={<Lightbulb className="h-4 w-4 text-amber-500" />}>
          <p className="text-xs leading-relaxed text-foreground/90">{t.evidenceSummary}</p>
          <div className="mt-2 flex items-center gap-2">
            {t.confidence && <Pill tone={confTone(t.confidence)}>confidence: {t.confidence}</Pill>}
          </div>
          {t.references && t.references.length > 0 && (
            <div className="mt-2">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">References</p>
              <div className="space-y-0.5">
                {t.references.map((r, j) => (
                  <a key={j} href={r.url} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-primary hover:underline">
                    {r.title} <span className="text-muted-foreground">— {r.relevance}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          {t.unresolvedGaps && t.unresolvedGaps.length > 0 && (
            <div className="mt-2">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">Unresolved gaps</p>
              <StringList items={t.unresolvedGaps} />
            </div>
          )}
        </Panel>
      ))}
      {d.councilShouldDebate && d.councilShouldDebate.length > 0 && (
        <Panel title="Council should debate" icon={<Info className="h-4 w-4 text-primary" />}>
          <StringList items={d.councilShouldDebate} />
        </Panel>
      )}
    </div>
  );
}

/* ---- Competitor Intelligence View ---- */
export function CompetitorIntelView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Competitor intelligence will appear here after the competitor_intel stage." />;
  const d = data as { competitors?: { name?: string; strengths?: string[]; weaknesses?: string[]; features?: string[]; gaps?: string[]; differentiation?: string[]; strategicRecommendations?: string[] }[]; marketPositioning?: string; ourAdvantages?: string[]; ourRisks?: string[] };
  return (
    <div className="space-y-4">
      {d.marketPositioning && (
        <Panel title="Market positioning" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <p className="text-xs leading-relaxed text-foreground/90">{d.marketPositioning}</p>
        </Panel>
      )}
      {(d.competitors ?? []).map((c, i) => (
        <Panel key={i} title={c.name ?? `Competitor ${i + 1}`} icon={<Target className="h-4 w-4 text-primary" />}>
          <div className="grid gap-3 md:grid-cols-2">
            {c.strengths && c.strengths.length > 0 && (
              <div><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Strengths</p><StringList items={c.strengths} /></div>
            )}
            {c.weaknesses && c.weaknesses.length > 0 && (
              <div><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">Weaknesses</p><StringList items={c.weaknesses} /></div>
            )}
            {c.features && c.features.length > 0 && (
              <div><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Features</p><StringList items={c.features} /></div>
            )}
            {c.gaps && c.gaps.length > 0 && (
              <div><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Gaps</p><StringList items={c.gaps} /></div>
            )}
          </div>
          {c.differentiation && c.differentiation.length > 0 && (
            <div className="mt-2"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Our differentiation</p><StringList items={c.differentiation} /></div>
          )}
          {c.strategicRecommendations && c.strategicRecommendations.length > 0 && (
            <div className="mt-2"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Strategic recommendations</p><StringList items={c.strategicRecommendations} /></div>
          )}
        </Panel>
      ))}
      <div className="grid gap-3 md:grid-cols-2">
        {d.ourAdvantages && d.ourAdvantages.length > 0 && (
          <Panel title="Our advantages"><StringList items={d.ourAdvantages} /></Panel>
        )}
        {d.ourRisks && d.ourRisks.length > 0 && (
          <Panel title="Our risks"><StringList items={d.ourRisks} /></Panel>
        )}
      </div>
    </div>
  );
}

/* ---- Feature Recommendations View ---- */
export function FeatureRecsView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Feature recommendations will appear here after the feature_recs stage." />;
  const d = data as Record<string, { feature?: string; rationale?: string; priority?: string }[]>;
  const categories: { key: string; label: string }[] = [
    { key: "mvp", label: "MVP" },
    { key: "phase2", label: "Phase 2" },
    { key: "activation", label: "Activation" },
    { key: "retention", label: "Retention" },
    { key: "monetization", label: "Monetization" },
    { key: "riskReducers", label: "Risk reducers" },
    { key: "analytics", label: "Analytics" },
    { key: "adminAndSupport", label: "Admin & support" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {categories.map((c) => {
        const items = d[c.key];
        if (!Array.isArray(items) || items.length === 0) return null;
        return (
          <Panel key={c.key} title={c.label}>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="rounded-md border bg-muted/30 p-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="flex-1 font-medium">{item.feature}</span>
                    {item.priority && <Pill tone={sevTone(item.priority)}>{item.priority}</Pill>}
                  </div>
                  {item.rationale && <p className="mt-0.5 text-[11px] text-muted-foreground">{item.rationale}</p>}
                </div>
              ))}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

/* ---- Cost Estimate View ---- */
export function CostEstimateView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Cost estimation will appear here after the cost_estimate stage." />;
  const d = data as { breakdown?: Record<string, { effortHours?: [number, number]; notes?: string }>; totalEffortHours?: [number, number]; estimatedDurationWeeks?: [number, number]; teamSize?: number; infraCost?: { setup?: string; monthlyOperating?: string; notes?: string }; totalCostRange?: string; implementationRisk?: string; confidenceInEstimate?: string; assumptions?: string[] };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Total effort" value={d.totalEffortHours ? `${d.totalEffortHours[0]}–${d.totalEffortHours[1]}h` : "—"} />
        <StatCard label="Duration" value={d.estimatedDurationWeeks ? `${d.estimatedDurationWeeks[0]}–${d.estimatedDurationWeeks[1]}w` : "—"} />
        <StatCard label="Team size" value={d.teamSize ? `${d.teamSize}` : "—"} />
        <StatCard label="Risk" value={d.implementationRisk ?? "—"} tone={sevTone(d.implementationRisk)} />
      </div>
      {d.totalCostRange && (
        <Panel title="Total cost range" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <p className="text-lg font-bold text-primary">{d.totalCostRange}</p>
          {d.confidenceInEstimate && <Pill tone={confTone(d.confidenceInEstimate)}>estimate confidence: {d.confidenceInEstimate}</Pill>}
        </Panel>
      )}
      {d.breakdown && (
        <Panel title="Effort breakdown">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-2">Area</th><th className="py-1.5 pr-2">Hours</th><th className="py-1.5 pr-2">Notes</th>
              </tr></thead>
              <tbody>
                {Object.entries(d.breakdown).map(([area, v]) => (
                  <tr key={area} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 font-medium">{area}</td>
                    <td className="py-1.5 pr-2 tabular-nums">{v.effortHours ? `${v.effortHours[0]}–${v.effortHours[1]}` : "—"}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{v.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {d.infraCost && (
        <Panel title="Infrastructure cost">
          <div className="grid gap-2 sm:grid-cols-2">
            {d.infraCost.setup && <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Setup</p><p className="text-xs">{d.infraCost.setup}</p></div>}
            {d.infraCost.monthlyOperating && <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Monthly operating</p><p className="text-xs">{d.infraCost.monthlyOperating}</p></div>}
          </div>
          {d.infraCost.notes && <p className="mt-1 text-[11px] text-muted-foreground">{d.infraCost.notes}</p>}
        </Panel>
      )}
      {d.assumptions && d.assumptions.length > 0 && (
        <Panel title="Estimate assumptions"><StringList items={d.assumptions} /></Panel>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "warn" | "danger" | "neutral" }) {
  return (
    <div className="rounded-lg border bg-card p-2.5 text-center">
      <p className={cn("text-lg font-bold", tone === "danger" && "text-destructive", tone === "warn" && "text-amber-600 dark:text-amber-400", tone === "success" && "text-emerald-600 dark:text-emerald-400")}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ---- Sprint Plan View ---- */
export function SprintPlanView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Sprint plan will appear here after the sprint_plan stage." />;
  const d = data as { sprints?: { sprint?: number; name?: string; goals?: string[]; items?: { item?: string; effort?: string; owner?: string }[]; riskCheckpoints?: string[] }[]; milestones?: { name?: string; afterSprint?: number; criteria?: string }[]; releasePhases?: { phase?: string; includes?: string[]; target?: string }[]; dependencies?: { from?: string; to?: string; type?: string }[] };
  return (
    <div className="space-y-4">
      {(d.sprints ?? []).map((s, i) => (
        <Panel key={i} title={`Sprint ${s.sprint ?? i + 1}: ${s.name ?? ""}`}>
          {s.goals && s.goals.length > 0 && <div className="mb-2"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Goals</p><StringList items={s.goals} /></div>}
          {s.items && s.items.length > 0 && (
            <div className="mb-2">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
              <div className="space-y-1">
                {s.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2 rounded border bg-muted/30 p-1.5 text-xs">
                    {item.effort && <Pill tone={item.effort === "L" ? "danger" : item.effort === "M" ? "warn" : "neutral"}>{item.effort}</Pill>}
                    <span className="flex-1">{item.item}</span>
                    {item.owner && <span className="text-[10px] text-muted-foreground">@{item.owner}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {s.riskCheckpoints && s.riskCheckpoints.length > 0 && (
            <div><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Risk checkpoints</p><StringList items={s.riskCheckpoints} /></div>
          )}
        </Panel>
      ))}
      {d.milestones && d.milestones.length > 0 && (
        <Panel title="Milestones">
          <div className="space-y-1">
            {d.milestones.map((m, i) => (
              <div key={i} className="rounded border bg-muted/30 p-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="font-medium">{m.name}</span>{m.afterSprint && <Pill tone="neutral">after sprint {m.afterSprint}</Pill>}</div>
                {m.criteria && <p className="mt-0.5 text-[11px] text-muted-foreground">{m.criteria}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}
      {d.releasePhases && d.releasePhases.length > 0 && (
        <Panel title="Release phases">
          <div className="space-y-1">
            {d.releasePhases.map((p, i) => (
              <div key={i} className="rounded border bg-muted/30 p-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="font-medium">{p.phase}</span>{p.target && <span className="text-[10px] text-muted-foreground">{p.target}</span>}</div>
                {p.includes && <p className="mt-0.5 text-[11px] text-muted-foreground">{p.includes.join(", ")}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---- Architecture Simulation View ---- */
export function ArchSimulationView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Architecture simulation will appear here after the arch_simulation stage." />;
  const d = data as { failureModes?: { component?: string; failure?: string; impact?: string; mitigation?: string }[]; bottlenecks?: { area?: string; description?: string; severity?: string }[]; whatIfs?: { question?: string; implication?: string; recommendation?: string }[]; operationalRisks?: { risk?: string; likelihood?: string; impact?: string }[]; scalabilityNotes?: string };
  return (
    <div className="space-y-4">
      {d.scalabilityNotes && (
        <Panel title="Scalability notes" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <p className="text-xs leading-relaxed text-foreground/90">{d.scalabilityNotes}</p>
        </Panel>
      )}
      {d.failureModes && d.failureModes.length > 0 && (
        <Panel title="Failure modes" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>
          <div className="space-y-1.5">
            {d.failureModes.map((f, i) => (
              <div key={i} className="rounded border bg-muted/30 p-2 text-xs">
                <div className="flex items-center gap-2"><span className="font-semibold">{f.component}</span></div>
                <p className="mt-0.5"><span className="text-destructive">Failure:</span> {f.failure}</p>
                <p className="mt-0.5"><span className="text-amber-600 dark:text-amber-400">Impact:</span> {f.impact}</p>
                {f.mitigation && <p className="mt-0.5 text-muted-foreground">→ {f.mitigation}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}
      {d.bottlenecks && d.bottlenecks.length > 0 && (
        <Panel title="Bottlenecks">
          <div className="space-y-1">
            {d.bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center gap-2 rounded border bg-muted/30 p-1.5 text-xs">
                {b.severity && <Pill tone={sevTone(b.severity)}>{b.severity}</Pill>}
                <span className="font-medium">{b.area}</span>
                <span className="flex-1 text-muted-foreground">{b.description}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {d.whatIfs && d.whatIfs.length > 0 && (
        <Panel title="What-if analysis" icon={<Lightbulb className="h-4 w-4 text-primary" />}>
          <div className="space-y-1.5">
            {d.whatIfs.map((w, i) => (
              <div key={i} className="rounded border bg-muted/30 p-2 text-xs">
                <p className="font-medium">{w.question}</p>
                <p className="mt-0.5 text-muted-foreground">{w.implication}</p>
                {w.recommendation && <p className="mt-0.5 text-primary">→ {w.recommendation}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}
      {d.operationalRisks && d.operationalRisks.length > 0 && (
        <Panel title="Operational risks" icon={<ShieldAlert className="h-4 w-4 text-destructive" />}>
          <div className="space-y-1">
            {d.operationalRisks.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded border bg-muted/30 p-1.5 text-xs">
                <span className="flex-1">{r.risk}</span>
                {r.likelihood && <Pill tone={sevTone(r.likelihood)}>{r.likelihood}</Pill>}
                {r.impact && <Pill tone={sevTone(r.impact)}>{r.impact}</Pill>}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---- Scenario Simulation View ---- */
export function ScenarioSimulationView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Scenario simulations will appear here after the scenario_simulation stage." />;
  const d = data as { scenarios?: { question?: string; implications?: Record<string, string>; recommendation?: string }[] };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">"What if" scenarios the team should consider, with implications across every dimension.</p>
      {(d.scenarios ?? []).map((s, i) => (
        <Panel key={i} title={s.question ?? `Scenario ${i + 1}`} icon={<Lightbulb className="h-4 w-4 text-amber-500" />}>
          {s.implications && (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {Object.entries(s.implications).map(([dim, text]) => (
                <div key={dim} className="rounded border bg-muted/30 p-1.5 text-xs">
                  <span className="font-semibold capitalize text-primary">{dim}:</span> {text}
                </div>
              ))}
            </div>
          )}
          {s.recommendation && (
            <p className="mt-2 rounded bg-accent/50 p-2 text-xs"><span className="font-semibold">Recommendation:</span> {s.recommendation}</p>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ---- Knowledge Graph View ---- */
export function KnowledgeGraphView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="The knowledge graph will appear here after the knowledge_graph stage." />;
  const d = data as { nodes?: { id: string; type: string; label: string; metadata?: Record<string, unknown> }[]; edges?: { source: string; target: string; relation: string }[]; coverageSummary?: { goalsCount?: number; requirementsCount?: number; testCoveragePercent?: number } };
  const nodes = d.nodes ?? [];
  const edges = d.edges ?? [];
  const typeColors: Record<string, string> = {
    goal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    epic: "bg-primary/15 text-primary",
    feature: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    requirement: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    acceptanceCriteria: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    testCase: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
    release: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    risk: "bg-destructive/15 text-destructive",
    decision: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    stakeholder: "bg-muted text-muted-foreground",
    dependency: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  };
  // group nodes by type
  const byType = new Map<string, typeof nodes>();
  for (const n of nodes) {
    const arr = byType.get(n.type) ?? [];
    arr.push(n);
    byType.set(n.type, arr);
  }
  return (
    <div className="space-y-4">
      {d.coverageSummary && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Goals" value={`${d.coverageSummary.goalsCount ?? 0}`} />
          <StatCard label="Requirements" value={`${d.coverageSummary.requirementsCount ?? 0}`} />
          <StatCard label="Test coverage" value={`${d.coverageSummary.testCoveragePercent ?? 0}%`} />
        </div>
      )}
      <Panel title={`Graph (${nodes.length} nodes, ${edges.length} edges)`} icon={<Sparkles className="h-4 w-4 text-primary" />}>
        <div className="space-y-3">
          {[...byType.entries()].map(([type, ns]) => (
            <div key={type}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{type} ({ns.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {ns.map((n) => (
                  <span key={n.id} className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", typeColors[n.type] ?? "bg-muted text-muted-foreground")} title={n.metadata ? JSON.stringify(n.metadata) : undefined}>
                    {n.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      {edges.length > 0 && (
        <Panel title="Relationships">
          <div className="max-h-64 space-y-0.5 overflow-y-auto scroll-thin">
            {edges.map((e, i) => (
              <div key={i} className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{e.source}</span>{" "}
                <span className="text-primary">—{e.relation}→</span>{" "}
                <span className="font-medium text-foreground">{e.target}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---- Decision Journal View ---- */
export function DecisionJournalView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="The decision journal will appear here after the decision_journal stage." />;
  const d = data as { decisions?: { decision?: string; rationale?: string; alternativesConsidered?: { name?: string; whyRejected?: string }[]; tradeoffs?: string[]; supportedBy?: string[]; objectedBy?: { role?: string; objection?: string }[]; confidence?: string; affectedDocuments?: string[] }[] };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Every key decision the council made, with rationale, alternatives, tradeoffs, and objections.</p>
      {(d.decisions ?? []).map((dec, i) => (
        <Panel key={i} title={dec.decision ?? `Decision ${i + 1}`} icon={<CheckCircle2 className="h-4 w-4 text-primary" />}>
          {dec.rationale && <p className="mb-2 text-xs leading-relaxed text-foreground/90">{dec.rationale}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            {dec.confidence && <Pill tone={confTone(dec.confidence)}>confidence: {dec.confidence}</Pill>}
            {dec.supportedBy && dec.supportedBy.length > 0 && (
              <span className="text-[10px] text-muted-foreground">supported by: {dec.supportedBy.join(", ")}</span>
            )}
          </div>
          {dec.alternativesConsidered && dec.alternativesConsidered.length > 0 && (
            <div className="mt-2"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Alternatives considered</p>
              <div className="space-y-0.5">
                {dec.alternativesConsidered.map((a, j) => (
                  <div key={j} className="text-[11px]"><span className="font-medium">{a.name}</span> <span className="text-muted-foreground">— {a.whyRejected}</span></div>
                ))}
              </div>
            </div>
          )}
          {dec.tradeoffs && dec.tradeoffs.length > 0 && (
            <div className="mt-2"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Tradeoffs accepted</p><StringList items={dec.tradeoffs} /></div>
          )}
          {dec.objectedBy && dec.objectedBy.length > 0 && (
            <div className="mt-2"><p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">Objected by</p>
              <div className="space-y-0.5">
                {dec.objectedBy.map((o, j) => (
                  <div key={j} className="text-[11px]"><span className="font-medium text-destructive">{o.role}:</span> <span className="text-muted-foreground">{o.objection}</span></div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ---- AI Voting View ---- */
export function AIVotingView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="AI council voting results will appear here after the ai_voting stage." />;
  const d = data as { votes?: { decision?: string; ballots?: { role?: string; vote?: string; weight?: number; rationale?: string }[]; result?: string; method?: string; scoreSupport?: number; scoreOppose?: number }[] };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Weighted council votes on key decisions. Weights reflect role authority on the decision domain.</p>
      {(d.votes ?? []).map((vote, i) => (
        <Panel key={i} title={vote.decision ?? `Vote ${i + 1}`} icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {vote.result && <Pill tone={vote.result === "approved" ? "success" : vote.result === "rejected" ? "danger" : "warn"}>{vote.result}</Pill>}
            {vote.method && <span className="text-[10px] text-muted-foreground">{vote.method}</span>}
            {typeof vote.scoreSupport === "number" && typeof vote.scoreOppose === "number" && (
              <span className="text-[10px] tabular-nums text-muted-foreground">support {vote.scoreSupport} · oppose {vote.scoreOppose}</span>
            )}
          </div>
          {vote.ballots && vote.ballots.length > 0 && (
            <div className="space-y-1">
              {vote.ballots.map((b, j) => (
                <div key={j} className="flex items-center gap-2 rounded border bg-muted/30 p-1.5 text-xs">
                  <Pill tone={b.vote === "support" ? "success" : b.vote === "oppose" ? "danger" : "neutral"}>{b.vote}</Pill>
                  <span className="text-[10px] text-muted-foreground">w:{b.weight}</span>
                  <span className="font-medium">{b.role}</span>
                  {b.rationale && <span className="flex-1 text-[11px] text-muted-foreground">{b.rationale}</span>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ---- Dynamic Council View ---- */
export function DynamicCouncilView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return <Empty label="Dynamic council adaptation will appear here after the dynamic_council stage." />;
  const d = data as { domain?: string; activeRoles?: string[]; addedRoles?: { role?: string; reason?: string; focus?: string }[]; removedRoles?: { role?: string; reason?: string }[] };
  return (
    <div className="space-y-4">
      {d.domain && (
        <Panel title="Detected domain" icon={<Sparkles className="h-4 w-4 text-primary" />}>
          <p className="text-sm font-semibold text-primary">{d.domain}</p>
        </Panel>
      )}
      {d.activeRoles && d.activeRoles.length > 0 && (
        <Panel title="Active council roles">
          <div className="flex flex-wrap gap-1.5">
            {d.activeRoles.map((r) => (
              <Pill key={r} tone="primary">{ROLE_META[r]?.label ?? r}</Pill>
            ))}
          </div>
        </Panel>
      )}
      {d.addedRoles && d.addedRoles.length > 0 && (
        <Panel title="Added specialist roles" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}>
          <div className="space-y-1.5">
            {d.addedRoles.map((r, i) => (
              <div key={i} className="rounded border bg-emerald-500/5 p-2 text-xs">
                <div className="flex items-center gap-2"><span className="font-semibold">{ROLE_META[r.role ?? ""]?.label ?? r.role}</span></div>
                {r.reason && <p className="mt-0.5 text-muted-foreground">{r.reason}</p>}
                {r.focus && <p className="mt-0.5 text-[11px] text-primary">Focus: {r.focus}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}
      {d.removedRoles && d.removedRoles.length > 0 && (
        <Panel title="Removed roles">
          <div className="space-y-1">
            {d.removedRoles.map((r, i) => (
              <div key={i} className="text-xs text-muted-foreground"><span className="font-medium">{ROLE_META[r.role ?? ""]?.label ?? r.role}</span> — {r.reason}</div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
