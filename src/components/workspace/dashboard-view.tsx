"use client";

import { useEffect, useState } from "react";
import { Empty, Panel, Pill } from "@/components/workspace/stage-panels";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  GitBranch,
  ListChecks,
  Loader2,
  RefreshCw,
  Server,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  summary: {
    totalProjects: number;
    totalVersions: number;
    totalDecisions: number;
    totalResearch: number;
    totalScenarios: number;
  };
  projects: {
    id: string;
    name: string;
    sourceType: string;
    repoUrl: string | null;
    updatedAt: string;
    versionCount: number;
    knowledgeNodes: number;
    decisions: number;
    research: number;
    competitors: number;
    scenarios: number;
    latestVersion: {
      id: string;
      versionNumber: number;
      docType: string;
      status: string;
      qualityScore: number | null;
      revised: boolean;
      confidence: string | null;
      createdAt: string;
    } | null;
  }[];
  openItems: { project: string; questions: number; risks: number }[];
  providerUsage: { name: string; count: number }[];
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const d = await res.json();
          setData(d);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-20">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading dashboard…</span>
      </div>
    );
  }

  if (!data || data.projects.length === 0) {
    return (
      <Empty label="Generate a document to populate the executive dashboard with project intelligence." />
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryStat icon={Target} label="Projects" value={summary.totalProjects} />
        <SummaryStat icon={GitBranch} label="Versions" value={summary.totalVersions} />
        <SummaryStat icon={ListChecks} label="Decisions" value={summary.totalDecisions} />
        <SummaryStat icon={Sparkles} label="Research" value={summary.totalResearch} />
        <SummaryStat icon={Activity} label="Scenarios" value={summary.totalScenarios} />
      </div>

      {/* Provider usage */}
      {data.providerUsage.length > 0 && (
        <Panel title="Provider usage" icon={<Server className="h-4 w-4 text-primary" />}>
          <div className="space-y-1.5">
            {data.providerUsage.slice(0, 8).map((p) => {
              const max = data.providerUsage[0]?.count ?? 1;
              return (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 truncate text-xs font-medium">
                    {p.name}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full rounded bg-primary transition-all"
                      style={{ width: `${(p.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {p.count}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Open items across projects */}
      {data.openItems.length > 0 && (
        <Panel title="Open questions & risks" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-1.5 pr-2">Project</th>
                  <th className="py-1.5 pr-2">Open questions</th>
                  <th className="py-1.5 pr-2">Risks</th>
                </tr>
              </thead>
              <tbody>
                {data.openItems.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 font-medium">{item.project}</td>
                    <td className="py-1.5 pr-2">
                      {item.questions > 0 ? (
                        <Pill tone="warn">{item.questions}</Pill>
                      ) : (
                        <Pill tone="success">0</Pill>
                      )}
                    </td>
                    <td className="py-1.5 pr-2">
                      {item.risks > 0 ? (
                        <Pill tone="danger">{item.risks}</Pill>
                      ) : (
                        <Pill tone="success">0</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Project list */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />
            Projects
          </h3>
          <button
            type="button"
            onClick={() => void refresh()}
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
        <div className="grid gap-2 md:grid-cols-2">
          {data.projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ProjectCard({
  project,
}: {
  project: DashboardData["projects"][number];
}) {
  const v = project.latestVersion;
  const date = new Date(project.updatedAt);
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{project.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}{" "}
            · {project.versionCount} version
            {project.versionCount !== 1 ? "s" : ""}
          </p>
        </div>
        {v && v.qualityScore !== null && (
          <div className="text-right">
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                v.qualityScore >= 80
                  ? "text-emerald-600 dark:text-emerald-400"
                  : v.qualityScore >= 60
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-destructive",
              )}
            >
              {v.qualityScore}
            </p>
            <p className="text-[9px] text-muted-foreground">quality</p>
          </div>
        )}
      </div>

      {v && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Pill tone="primary">{v.docType}</Pill>
          {v.revised && <Pill tone="warn">revised</Pill>}
          {v.status === "complete" && <Pill tone="success">complete</Pill>}
          {v.status === "generating" && <Pill tone="neutral">generating</Pill>}
          {v.status === "error" && <Pill tone="danger">error</Pill>}
        </div>
      )}

      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
        <MiniStat label="nodes" value={project.knowledgeNodes} />
        <MiniStat label="decisions" value={project.decisions} />
        <MiniStat label="research" value={project.research} />
        <MiniStat label="scenarios" value={project.scenarios} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-muted/40 p-1">
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}
