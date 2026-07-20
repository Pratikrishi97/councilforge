"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Panel, Pill, StringList, Empty } from "@/components/workspace/stage-panels";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flag,
  Gauge,
  GitBranch,
  Layers,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Route,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  XCircle,
  Zap,
} from "lucide-react";

/* ============================================================================
 * Shared helpers
 * ========================================================================== */

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <span className="text-xs text-destructive">{message}</span>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function statusTone(
  status: string,
): "neutral" | "primary" | "warn" | "danger" | "success" {
  const s = status.toLowerCase();
  if (["done", "complete", "completed", "passed", "ready", "success"].includes(s))
    return "success";
  if (["in_progress", "running", "pending", "backlog", "fair", "warn"].includes(s))
    return "warn";
  if (["failed", "error", "blocked", "poor", "low"].includes(s)) return "danger";
  if (["high", "must"].includes(s)) return "danger";
  return "neutral";
}

function confidenceTone(
  confidence: string,
): "neutral" | "primary" | "warn" | "danger" | "success" {
  const c = confidence.toLowerCase();
  if (c === "high") return "success";
  if (c === "medium") return "warn";
  if (c === "low") return "danger";
  return "neutral";
}

/* ============================================================================
 * 1. AcceptanceTestsView
 * ========================================================================== */

interface AcceptanceTestItem {
  id: string;
  testId?: string;
  requirementId?: string;
  given?: string;
  when?: string;
  then?: string;
  testType?: string;
  status?: string;
}

interface AcceptanceTestsData {
  tests: AcceptanceTestItem[];
  coverage: {
    total: number;
    withTests: number;
    withoutTests: number;
    percent: number;
  };
  /** Optional: list of requirement IDs that have no test coverage. */
  uncoveredRequirementIds?: string[];
}

export function AcceptanceTestsView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<AcceptanceTestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/acceptance-tests?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Failed to load acceptance tests (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as AcceptanceTestsData;
      setData(d);
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/acceptance-tests?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as AcceptanceTestsData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load acceptance tests (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading && !data) return <LoadingState label="Loading acceptance tests…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <Empty label="No acceptance tests found." />;

  const { coverage, tests } = data;
  const uncovered = data.uncoveredRequirementIds ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <ClipboardList className="h-4 w-4 text-primary" />
          Acceptance tests
        </h3>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      {/* Coverage summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CoverageStat label="Total reqs" value={coverage.total} />
        <CoverageStat label="With tests" value={coverage.withTests} tone="success" />
        <CoverageStat
          label="Without tests"
          value={coverage.withoutTests}
          tone={coverage.withoutTests > 0 ? "danger" : "neutral"}
        />
        <CoverageStat
          label="Coverage"
          value={`${coverage.percent}%`}
          tone={coverage.percent >= 80 ? "success" : coverage.percent >= 50 ? "warn" : "danger"}
        />
      </div>

      {/* Coverage bar */}
      {coverage.total > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              coverage.percent >= 80
                ? "bg-emerald-500"
                : coverage.percent >= 50
                  ? "bg-amber-500"
                  : "bg-destructive",
            )}
            style={{ width: `${Math.min(100, coverage.percent)}%` }}
          />
        </div>
      )}

      {/* Uncovered requirements */}
      {uncovered.length > 0 && (
        <Panel
          title="Requirements without tests"
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
        >
          <div className="flex flex-wrap gap-1">
            {uncovered.map((id, i) => (
              <Pill key={i} tone="danger">
                {id}
              </Pill>
            ))}
          </div>
        </Panel>
      )}

      {/* Test list */}
      {tests.length === 0 ? (
        <Empty label="No acceptance tests have been generated yet." />
      ) : (
        <div className="space-y-2">
          {tests.map((t, i) => (
            <AcceptanceTestCard key={t.id ?? i} test={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function CoverageStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "primary" | "warn" | "danger" | "success";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "text-foreground",
    primary: "text-primary",
    warn: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
    success: "text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-bold tabular-nums", toneClasses[tone])}>
        {value}
      </p>
    </div>
  );
}

function AcceptanceTestCard({ test }: { test: AcceptanceTestItem }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] text-muted-foreground">
          {test.testId ?? "AT-?"}
        </span>
        {test.testType && <Pill tone="primary">{test.testType}</Pill>}
        {test.status && (
          <Pill tone={statusTone(test.status)}>{test.status}</Pill>
        )}
        {test.requirementId && (
          <Pill tone="neutral">req: {test.requirementId}</Pill>
        )}
      </div>
      <div className="space-y-1 text-xs leading-relaxed">
        {test.given && (
          <div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Given:
            </span>{" "}
            <span className="text-foreground/90">{test.given}</span>
          </div>
        )}
        {test.when && (
          <div>
            <span className="font-semibold text-primary">When:</span>{" "}
            <span className="text-foreground/90">{test.when}</span>
          </div>
        )}
        {test.then && (
          <div>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Then:
            </span>{" "}
            <span className="text-foreground/90">{test.then}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. BacklogView
 * ========================================================================== */

interface BacklogItem {
  id: string;
  itemType?: string;
  title?: string;
  description?: string;
  requirementId?: string | null;
  priority?: string;
  effort?: string | null;
  status?: string;
}

interface BacklogData {
  items: BacklogItem[];
}

const BACKLOG_TYPE_ORDER = ["epic", "story", "task", "subtask", "milestone", "bug"];

const BACKLOG_TYPE_ICONS: Record<string, ReactNode> = {
  epic: <Layers className="h-4 w-4 text-primary" />,
  story: <BookOpen className="h-4 w-4 text-sky-500" />,
  task: <ListChecks className="h-4 w-4 text-emerald-500" />,
  subtask: <ListChecks className="h-4 w-4 text-muted-foreground" />,
  milestone: <Flag className="h-4 w-4 text-amber-500" />,
  bug: <TriangleAlert className="h-4 w-4 text-destructive" />,
};

export function BacklogView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<BacklogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backlog?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Failed to load backlog (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as BacklogData;
      setData(d);
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/backlog?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as BacklogData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load backlog (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading && !data) return <LoadingState label="Loading backlog…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data || data.items.length === 0)
    return <Empty label="No backlog items have been generated yet." />;

  // Group by itemType
  const grouped = new Map<string, BacklogItem[]>();
  for (const item of data.items) {
    const t = item.itemType ?? "task";
    const arr = grouped.get(t) ?? [];
    arr.push(item);
    grouped.set(t, arr);
  }
  const types = Array.from(grouped.keys()).sort(
    (a, b) =>
      (BACKLOG_TYPE_ORDER.indexOf(a) === -1
        ? Number.MAX_SAFE_INTEGER
        : BACKLOG_TYPE_ORDER.indexOf(a)) -
      (BACKLOG_TYPE_ORDER.indexOf(b) === -1
        ? Number.MAX_SAFE_INTEGER
        : BACKLOG_TYPE_ORDER.indexOf(b)),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <ListChecks className="h-4 w-4 text-primary" />
          Backlog
          <Pill tone="neutral">{data.items.length}</Pill>
        </h3>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      {types.map((type) => (
        <Panel
          key={type}
          title={`${type.charAt(0).toUpperCase() + type.slice(1)}s`}
          icon={BACKLOG_TYPE_ICONS[type] ?? <ListChecks className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="space-y-2">
            {grouped.get(type)!.map((item, i) => (
              <BacklogItemRow key={item.id ?? i} item={item} />
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function BacklogItemRow({ item }: { item: BacklogItem }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">
          {item.title ?? "Untitled"}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {item.priority && (
            <Pill tone={statusTone(item.priority)}>{item.priority}</Pill>
          )}
          {item.effort && <Pill tone="primary">{item.effort}</Pill>}
          {item.status && (
            <Pill tone={statusTone(item.status)}>{item.status}</Pill>
          )}
        </div>
      </div>
      {item.description && (
        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
      )}
      {item.itemType === "story" && item.requirementId && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          <span>
            Traceability: <span className="font-mono">{item.requirementId}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * 3. RoadmapView
 * ========================================================================== */

interface RoadmapPhase {
  id: string;
  phaseNumber?: number;
  phaseName?: string;
  description?: string | null;
  contents?: {
    features?: string[];
    dependencies?: string[];
    risks?: string[];
  } | null;
  targetDate?: string | null;
  confidence?: string;
}

interface RoadmapData {
  phases: RoadmapPhase[];
}

export function RoadmapView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/roadmap?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Failed to load roadmap (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as RoadmapData;
      setData(d);
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/roadmap?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as RoadmapData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load roadmap (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading && !data) return <LoadingState label="Loading roadmap…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data || data.phases.length === 0)
    return <Empty label="No roadmap phases have been generated yet." />;

  const phases = [...data.phases].sort(
    (a, b) => (a.phaseNumber ?? 0) - (b.phaseNumber ?? 0),
  );

  // Detect parallelizable phases: phase with no dependencies OR
  // with the same dependency set as another phase. We'll flag the second
  // and subsequent phases that share dependencies with the prior one.
  const parallelizableFlags = phases.map((p, i) => {
    const deps = p.contents?.dependencies ?? [];
    if (i === 0 || deps.length === 0) return false;
    const prev = phases[i - 1];
    const prevDeps = prev.contents?.dependencies ?? [];
    if (prevDeps.length === 0) return false;
    return deps.some((d) => prevDeps.includes(d));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Route className="h-4 w-4 text-primary" />
          Roadmap
          <Pill tone="neutral">{phases.length} phases</Pill>
        </h3>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {phases.map((phase, i) => (
          <RoadmapPhaseCard
            key={phase.id}
            phase={phase}
            parallelizable={parallelizableFlags[i]}
            isLast={i === phases.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function RoadmapPhaseCard({
  phase,
  parallelizable,
  isLast,
}: {
  phase: RoadmapPhase;
  parallelizable: boolean;
  isLast: boolean;
}) {
  const c = phase.contents ?? {};
  return (
    <div className="relative rounded-lg border bg-card p-3 pl-6">
      {/* Phase number bubble */}
      <div className="absolute left-2 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
        {phase.phaseNumber ?? "?"}
      </div>
      {!isLast && (
        <div className="absolute left-[15px] top-7 h-[calc(100%-12px)] w-px bg-border" />
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {phase.phaseName ?? `Phase ${phase.phaseNumber ?? "?"}`}
          </p>
          {phase.targetDate && (
            <p className="text-[10px] text-muted-foreground">
              Target: {phase.targetDate}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {phase.confidence && (
            <Pill tone={confidenceTone(phase.confidence)}>
              {phase.confidence} confidence
            </Pill>
          )}
          {parallelizable && (
            <Pill tone="primary">
              <Zap className="mr-1 h-2.5 w-2.5" />
              parallelizable
            </Pill>
          )}
        </div>
      </div>

      {phase.description && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {phase.description}
        </p>
      )}

      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Features
          </p>
          <StringList items={c.features} empty="No features listed." />
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <GitBranch className="h-3 w-3 text-sky-500" />
            Dependencies
          </p>
          <StringList items={c.dependencies} empty="No dependencies." />
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            Risks
          </p>
          <StringList items={c.risks} empty="No risks identified." />
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 4. EvaluationView — props: { data: unknown }
 * ========================================================================== */

interface RubricScore {
  criterion?: string;
  weight?: number;
  score?: number;
  status?: string;
  note?: string;
}

interface EvaluationResult {
  rubricScores?: RubricScore[];
  overallScore?: number;
  results?: {
    passed?: string[];
    warnings?: string[];
    failed?: string[];
  };
  recommendations?: {
    improved?: string[];
    needsWork?: string[];
  };
  benchmarkMode?: string;
}

export function EvaluationView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object")
    return (
      <Empty label="Rubric evaluation will appear here after the Evaluation stage." />
    );

  const d = data as EvaluationResult;
  const rubric = d.rubricScores ?? [];
  const overall = typeof d.overallScore === "number" ? d.overallScore : null;
  const results = d.results ?? {};
  const recs = d.recommendations ?? {};

  if (rubric.length === 0 && overall === null)
    return <Empty label="No evaluation results available." />;

  return (
    <div className="space-y-4">
      {/* Overall score */}
      {overall !== null && (
        <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
          <div
            className={cn(
              "flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4",
              overall >= 80
                ? "border-emerald-500/40 bg-emerald-500/10"
                : overall >= 60
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-destructive/40 bg-destructive/10",
            )}
          >
            <span
              className={cn(
                "text-3xl font-bold tabular-nums",
                scoreColor(overall),
              )}
            >
              {overall}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Overall score
            </p>
            <p className="text-sm font-semibold">
              {overall >= 80
                ? "Strong — ready to ship"
                : overall >= 60
                  ? "Acceptable — minor revisions"
                  : "Needs work — revise before delivery"}
            </p>
            {d.benchmarkMode && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Benchmark: <span className="font-mono">{d.benchmarkMode}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Rubric table */}
      {rubric.length > 0 && (
        <Panel
          title="Rubric scores"
          icon={<Gauge className="h-4 w-4 text-primary" />}
        >
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-2">Criterion</th>
                  <th className="py-1.5 pr-2 text-right">Weight</th>
                  <th className="py-1.5 pr-2 text-right">Score</th>
                  <th className="py-1.5 pr-2">Status</th>
                  <th className="py-1.5 pr-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {rubric.map((r, i) => {
                  const score = typeof r.score === "number" ? r.score : 0;
                  return (
                    <tr key={i} className="border-b last:border-0 align-top">
                      <td className="py-1.5 pr-2 font-medium">
                        {r.criterion ?? `Criterion ${i + 1}`}
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                        {typeof r.weight === "number"
                          ? `${Math.round(r.weight * 100)}%`
                          : "—"}
                      </td>
                      <td
                        className={cn(
                          "py-1.5 pr-2 text-right font-bold tabular-nums",
                          scoreColor(score),
                        )}
                      >
                        {score}
                      </td>
                      <td className="py-1.5 pr-2">
                        {r.status && (
                          <Pill tone={rubricStatusTone(r.status)}>
                            {r.status}
                          </Pill>
                        )}
                      </td>
                      <td className="py-1.5 pr-2 text-muted-foreground">
                        {r.note ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Results */}
      <div className="grid gap-3 md:grid-cols-3">
        <ResultList
          title="Passed"
          items={results.passed}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          tone="success"
        />
        <ResultList
          title="Warnings"
          items={results.warnings}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          tone="warn"
        />
        <ResultList
          title="Failed"
          items={results.failed}
          icon={<XCircle className="h-4 w-4 text-destructive" />}
          tone="danger"
        />
      </div>

      {/* Recommendations */}
      <div className="grid gap-3 md:grid-cols-2">
        <ResultList
          title="Improved"
          items={recs.improved}
          icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
          tone="success"
        />
        <ResultList
          title="Needs work"
          items={recs.needsWork}
          icon={<Target className="h-4 w-4 text-amber-500" />}
          tone="warn"
        />
      </div>
    </div>
  );
}

function rubricStatusTone(
  status: string,
): "neutral" | "primary" | "warn" | "danger" | "success" {
  const s = status.toLowerCase();
  if (s === "pass" || s === "passed") return "success";
  if (s === "warning" || s === "warn") return "warn";
  if (s === "fail" || s === "failed") return "danger";
  return "neutral";
}

function ResultList({
  title,
  items,
  icon,
  tone,
}: {
  title: string;
  items?: string[];
  icon: ReactNode;
  tone: "neutral" | "primary" | "warn" | "danger" | "success";
}) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <Panel title={title} icon={icon}>
      {safeItems.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">None.</p>
      ) : (
        <ul className="space-y-1">
          {safeItems.map((it, i) => (
            <li
              key={i}
              className="flex gap-2 text-xs leading-relaxed"
            >
              <span
                className={cn(
                  "mt-1.5 h-1 w-1 shrink-0 rounded-full",
                  tone === "success" && "bg-emerald-500",
                  tone === "warn" && "bg-amber-500",
                  tone === "danger" && "bg-destructive",
                  tone === "primary" && "bg-primary",
                  tone === "neutral" && "bg-muted-foreground",
                )}
              />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ============================================================================
 * 5. HealthScoreWidget
 * ========================================================================== */

interface HealthArea {
  name: string;
  score: number;
  weight: number;
  status: "good" | "fair" | "poor";
}

interface HealthData {
  overall: number;
  areas: HealthArea[];
  weakAreas: string[];
  recommendedActions: string[];
}

export function HealthScoreWidget({ projectId }: { projectId: string }) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/health?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Failed to load health score (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as HealthData;
      setData(d);
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/health?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as HealthData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load health score (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading && !data) return <LoadingState label="Computing health score…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <Empty label="Health score unavailable." />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Gauge className="h-4 w-4 text-primary" />
          Health score
        </h4>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      {/* Overall */}
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border-2",
            data.overall >= 80
              ? "border-emerald-500/40 bg-emerald-500/10"
              : data.overall >= 60
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-destructive/40 bg-destructive/10",
          )}
        >
          <span
            className={cn(
              "text-xl font-bold tabular-nums",
              scoreColor(data.overall),
            )}
          >
            {data.overall}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Overall
          </p>
          <p className="text-sm font-semibold">
            {data.overall >= 80
              ? "Healthy"
              : data.overall >= 60
                ? "Fair — needs attention"
                : "At risk"}
          </p>
        </div>
      </div>

      {/* Area breakdown */}
      <div className="space-y-1.5">
        {data.areas.map((area, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-40 shrink-0 truncate text-xs font-medium">
              {area.name}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
              <div
                className={cn(
                  "h-full rounded transition-all",
                  area.status === "good"
                    ? "bg-emerald-500"
                    : area.status === "fair"
                      ? "bg-amber-500"
                      : "bg-destructive",
                )}
                style={{ width: `${Math.min(100, area.score)}%` }}
              />
            </div>
            <span
              className={cn(
                "w-9 shrink-0 text-right text-xs font-bold tabular-nums",
                area.status === "good"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : area.status === "fair"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-destructive",
              )}
            >
              {area.score}
            </span>
          </div>
        ))}
      </div>

      {/* Weak areas */}
      {data.weakAreas.length > 0 && (
        <Panel
          title="Weak areas"
          icon={<ShieldAlert className="h-4 w-4 text-amber-500" />}
        >
          <div className="flex flex-wrap gap-1">
            {data.weakAreas.map((w, i) => (
              <Pill key={i} tone="warn">
                {w}
              </Pill>
            ))}
          </div>
        </Panel>
      )}

      {/* Recommended actions */}
      {data.recommendedActions.length > 0 && (
        <Panel
          title="Recommended actions"
          icon={<Sparkles className="h-4 w-4 text-primary" />}
        >
          <StringList items={data.recommendedActions} />
        </Panel>
      )}
    </div>
  );
}

/* ============================================================================
 * 6. NextActionsWidget
 * ========================================================================== */

interface NextActionItem {
  action?: string;
  rationale?: string;
  priority?: string;
  category?: string;
}

interface NextActionsData {
  actions: NextActionItem[];
}

const CATEGORY_ICONS: Record<string, ReactNode> = {
  context: <BookOpen className="h-3 w-3" />,
  refine: <Sparkles className="h-3 w-3" />,
  validate: <ShieldCheck className="h-3 w-3" />,
  deliver: <Flag className="h-3 w-3" />,
  review: <ListChecks className="h-3 w-3" />,
  export: <ArrowRight className="h-3 w-3" />,
};

export function NextActionsWidget({ projectId }: { projectId: string }) {
  const [data, setData] = useState<NextActionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/next-action?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Failed to load next actions (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as NextActionsData;
      setData(d);
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/next-action?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as NextActionsData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load next actions (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading && !data) return <LoadingState label="Recommending actions…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data || data.actions.length === 0)
    return <Empty label="No recommended actions right now." />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Target className="h-4 w-4 text-primary" />
          Next best actions
        </h4>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {data.actions.map((a, i) => (
          <div key={i} className="rounded-md border bg-card p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <p className="text-sm font-medium leading-snug">{a.action}</p>
              <div className="flex flex-wrap items-center gap-1">
                {a.priority && (
                  <Pill tone={statusTone(a.priority)}>{a.priority}</Pill>
                )}
                {a.category && (
                  <Pill tone="primary">
                    <span className="mr-1 inline-flex align-middle">
                      {CATEGORY_ICONS[a.category] ?? <Activity className="h-3 w-3" />}
                    </span>
                    {a.category}
                  </Pill>
                )}
              </div>
            </div>
            {a.rationale && (
              <p className="mt-1 text-xs text-muted-foreground">{a.rationale}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
 * 7. FeedbackButtons
 * ========================================================================== */

const FEEDBACK_RATINGS: {
  rating: string;
  label: string;
  icon: ReactNode;
  tone: "neutral" | "primary" | "warn" | "danger" | "success";
}[] = [
  {
    rating: "excellent",
    label: "Excellent",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    tone: "success",
  },
  {
    rating: "helpful",
    label: "Helpful",
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
    tone: "primary",
  },
  {
    rating: "not_helpful",
    label: "Not helpful",
    icon: <ThumbsDown className="h-3.5 w-3.5" />,
    tone: "neutral",
  },
  {
    rating: "too_generic",
    label: "Too generic",
    icon: <Layers className="h-3.5 w-3.5" />,
    tone: "warn",
  },
  {
    rating: "missing_context",
    label: "Missing context",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    tone: "warn",
  },
  {
    rating: "inaccurate",
    label: "Inaccurate",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    tone: "danger",
  },
];

export function FeedbackButtons({
  projectId,
  versionId,
}: {
  projectId: string;
  versionId: string;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const handleSubmit = async (rating: string) => {
    if (submitting) return;
    setSubmitting(rating);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, versionId, rating }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? `Feedback failed (${res.status}).`);
        return;
      }
      setSubmitted(rating);
      toast.success("Thanks — feedback recorded.");
    } catch {
      toast.error("Could not submit feedback.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Rate this output
      </p>
      <div className="flex flex-wrap gap-1.5">
        {FEEDBACK_RATINGS.map((r) => {
          const isSubmitting = submitting === r.rating;
          const isSubmitted = submitted === r.rating;
          return (
            <button
              key={r.rating}
              type="button"
              disabled={submitting !== null}
              onClick={() => void handleSubmit(r.rating)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                "disabled:opacity-60",
                isSubmitted
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isSubmitted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                r.icon
              )}
              {r.label}
            </button>
          );
        })}
      </div>
      {submitted && (
        <p className="text-[10px] text-muted-foreground">
          You rated this as{" "}
          <span className="font-medium text-foreground">{submitted.replace(/_/g, " ")}</span>.
        </p>
      )}
    </div>
  );
}

/* ============================================================================
 * 8. ObservabilityView
 * ========================================================================== */

interface ObservabilityEvent {
  id: string;
  stage?: string;
  providerId?: string | null;
  durationMs?: number | null;
  tokenUsage?: number | null;
  status?: string;
  message?: string | null;
  createdAt?: string;
}

interface ObservabilityData {
  events: ObservabilityEvent[];
}

export function ObservabilityView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ObservabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/observability?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Failed to load observability events (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as ObservabilityData;
      setData(d);
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/observability?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as ObservabilityData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load observability events (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading && !data) return <LoadingState label="Loading events…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data || data.events.length === 0)
    return <Empty label="No observability events recorded yet." />;

  const events = data.events;
  const total = events.length;
  const fallbackCount = events.filter((e) => e.status === "fallback").length;
  const errorCount = events.filter(
    (e) => e.status === "error" || e.status === "timeout",
  ).length;
  const durations = events
    .map((e) => e.durationMs ?? 0)
    .filter((d) => d > 0);
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          Observability
        </h3>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryStat label="Events" value={total} icon={<Activity className="h-3 w-3 text-primary" />} />
        <SummaryStat
          label="Fallbacks"
          value={fallbackCount}
          tone={fallbackCount > 0 ? "warn" : "neutral"}
          icon={<ShieldAlert className="h-3 w-3 text-amber-500" />}
        />
        <SummaryStat
          label="Errors"
          value={errorCount}
          tone={errorCount > 0 ? "danger" : "neutral"}
          icon={<XCircle className="h-3 w-3 text-destructive" />}
        />
        <SummaryStat
          label="Avg duration"
          value={`${avgDuration}ms`}
          icon={<Clock className="h-3 w-3 text-muted-foreground" />}
        />
      </div>

      {/* Event list */}
      <Panel title="Event log" icon={<ListChecks className="h-4 w-4 text-primary" />}>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-2">Stage</th>
                <th className="py-1.5 pr-2">Provider</th>
                <th className="py-1.5 pr-2 text-right">Duration</th>
                <th className="py-1.5 pr-2 text-right">Tokens</th>
                <th className="py-1.5 pr-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 200).map((e, i) => (
                <tr key={e.id ?? i} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 font-mono text-[10px]">
                    {e.stage ?? "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-muted-foreground">
                    {e.providerId ?? "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                    {e.durationMs != null ? `${e.durationMs}ms` : "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                    {e.tokenUsage != null ? e.tokenUsage : "—"}
                  </td>
                  <td className="py-1.5 pr-2">
                    {e.status && (
                      <Pill tone={obsStatusTone(e.status)}>{e.status}</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function obsStatusTone(
  status: string,
): "neutral" | "primary" | "warn" | "danger" | "success" {
  const s = status.toLowerCase();
  if (s === "success") return "success";
  if (s === "fallback") return "warn";
  if (s === "error" || s === "timeout") return "danger";
  return "neutral";
}

function SummaryStat({
  label,
  value,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "primary" | "warn" | "danger" | "success";
  icon?: ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "text-foreground",
    primary: "text-primary",
    warn: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
    success: "text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={cn("mt-1 text-xl font-bold tabular-nums", toneClasses[tone])}>
        {value}
      </p>
    </div>
  );
}

/* ============================================================================
 * 9. PolicyView — includes an add-policy form
 * ========================================================================== */

const POLICY_TYPES = [
  "input_restriction",
  "output_restriction",
  "role_restriction",
  "provider_restriction",
  "data_handling",
  "escalation",
] as const;

interface PolicyItem {
  id: string;
  type?: string;
  rule?: string;
  enforced?: boolean;
  projectId?: string | null;
}

interface PolicyData {
  policies: PolicyItem[];
}

export function PolicyView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<string>(POLICY_TYPES[0]);
  const [formRule, setFormRule] = useState<string>("");
  const [formEnforced, setFormEnforced] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/policies?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Failed to load policies (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as PolicyData;
      setData(d);
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/policies?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as PolicyData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load policies (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRule.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type: formType,
          rule: formRule.trim(),
          enforced: formEnforced,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? `Failed to add policy (${res.status}).`);
        return;
      }
      toast.success("Policy added.");
      setFormRule("");
      setFormEnforced(true);
      await fetchData();
    } catch {
      toast.error("Could not add policy.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) return <LoadingState label="Loading policies…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <Empty label="No policies configured." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Shield className="h-4 w-4 text-primary" />
          Policies
          {data.policies.length > 0 && (
            <Pill tone="neutral">{data.policies.length}</Pill>
          )}
        </h3>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      {/* Add policy form */}
      <Panel title="Add policy" icon={<Plus className="h-4 w-4 text-primary" />}>
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Type
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-xs font-normal normal-case text-foreground"
              >
                {POLICY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 self-end pb-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={formEnforced}
                onChange={(e) => setFormEnforced(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-input"
              />
              Enforced
            </label>
          </div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Rule
            <textarea
              value={formRule}
              onChange={(e) => setFormRule(e.target.value)}
              placeholder="e.g. Disallow PII in any LLM input"
              rows={2}
              className="mt-1 w-full resize-y rounded-md border bg-background px-2 py-1.5 text-xs font-normal normal-case text-foreground placeholder:text-muted-foreground/60"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || !formRule.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add policy
          </button>
        </form>
      </Panel>

      {/* Policy list */}
      {data.policies.length === 0 ? (
        <Empty label="No policies configured for this project yet." />
      ) : (
        <div className="space-y-2">
          {data.policies.map((p, i) => (
            <PolicyRow key={p.id ?? i} policy={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PolicyRow({ policy }: { policy: PolicyItem }) {
  return (
    <div className="rounded-md border bg-card p-2.5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {policy.type && <Pill tone="primary">{policy.type}</Pill>}
          {policy.enforced ? (
            <Pill tone="success">
              <ShieldCheck className="mr-1 h-2.5 w-2.5" />
              enforced
            </Pill>
          ) : (
            <Pill tone="neutral">
              <Shield className="mr-1 h-2.5 w-2.5" />
              advisory
            </Pill>
          )}
        </div>
      </div>
      <p className="font-mono text-xs leading-relaxed text-foreground/90">
        {policy.rule ?? "—"}
      </p>
    </div>
  );
}
