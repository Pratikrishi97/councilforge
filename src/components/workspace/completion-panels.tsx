"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Panel,
  Pill,
  StringList,
  Empty,
} from "@/components/workspace/stage-panels";
import { cn } from "@/lib/utils";
import { planRun } from "@/lib/orchestrator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  GitBranch,
  Gauge,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Network,
  Plus,
  RefreshCw,
  Route,
  Server,
  ShieldAlert,
  SkipForward,
  Sparkles,
  Target,
  XCircle,
  Zap,
} from "lucide-react";

/* ============================================================================
 * Shared local helpers
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

function RefreshButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      Refresh
    </button>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-destructive";
}

type Severity = "high" | "medium" | "low" | string;

function severityTone(sev: Severity): "danger" | "warn" | "neutral" {
  const s = (sev ?? "").toLowerCase();
  if (s === "high") return "danger";
  if (s === "medium") return "warn";
  return "neutral";
}

function relativeTime(iso: string | number | Date): string {
  try {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const diff = Date.now() - t;
    const sec = Math.round(diff / 1000);
    if (sec < 60) return "just now";
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.round(hr / 24);
    if (day < 30) return `${day}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/* ============================================================================
 * 1. CompletenessWidget
 * ========================================================================== */

interface CompletenessCheck {
  component: string;
  present: boolean;
  healthy: boolean;
  status: "complete" | "warning" | "missing";
  note: string;
}

interface CompletenessData {
  overall: number;
  checks: CompletenessCheck[];
  missing: string[];
  warnings: string[];
}

function statusTone(
  status: CompletenessCheck["status"],
): "success" | "warn" | "danger" {
  if (status === "complete") return "success";
  if (status === "warning") return "warn";
  return "danger";
}

function statusIcon(status: CompletenessCheck["status"]) {
  if (status === "complete")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "warning")
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  return <XCircle className="h-3.5 w-3.5 text-destructive" />;
}

export function CompletenessWidget({ projectId }: { projectId: string }) {
  const [data, setData] = useState<CompletenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/completeness?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Failed to load completeness (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as CompletenessData;
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
          `/api/completeness?projectId=${encodeURIComponent(projectId)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as CompletenessData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load completeness (${res.status}).`);
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

  if (loading && !data) return <LoadingState label="Checking completeness…" />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <Empty label="No completeness data available." />;

  const { overall, checks, missing, warnings } = data;

  return (
    <Panel
      title="Project completeness"
      icon={<ListChecks className="h-4 w-4 text-primary" />}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Health check across all platform components.
        </p>
        <RefreshButton loading={loading} onClick={() => void fetchData()} />
      </div>

      {/* Overall percentage */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-bold tabular-nums", scoreColor(overall))}>
            {overall}
            <span className="text-xl">%</span>
          </span>
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
            overall
          </span>
        </div>
        <div className="flex-1">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                scoreBarColor(overall),
              )}
              style={{ width: `${Math.min(100, overall)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>
              {checks.filter((c) => c.status === "complete").length} complete
            </span>
            <span>
              {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
            </span>
            <span>
              {missing.length} missing
            </span>
          </div>
        </div>
      </div>

      {/* Missing items highlight */}
      {missing.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
            <p className="text-xs font-semibold text-destructive">
              Missing components
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {missing.map((m, i) => (
              <Pill key={i} tone="danger">
                {m}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-1.5">
        {checks.map((c, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2 rounded-md border bg-card p-2",
              c.status === "missing" && "border-destructive/30",
            )}
          >
            <div className="mt-0.5">{statusIcon(c.status)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium">{c.component}</p>
                <Pill tone={statusTone(c.status)}>{c.status}</Pill>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{c.note}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ============================================================================
 * 2. NotificationsBell
 * ========================================================================== */

interface NotificationItem {
  id: string;
  projectId: string | null;
  type: string;
  title: string;
  message: string;
  severity: "high" | "medium" | "low" | string;
  read: boolean;
  details: unknown;
  createdAt: string;
}

interface NotificationsData {
  notifications: NotificationItem[];
}

export function NotificationsBell() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?unread=true", {
        cache: "no-store",
      });
      if (res.ok) {
        const d = (await res.json()) as NotificationsData;
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
        const res = await fetch("/api/notifications?unread=true", {
          cache: "no-store",
        });
        if (res.ok && !cancelled) {
          const d = (await res.json()) as NotificationsData;
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

  // Refresh when popover opens so the count stays fresh (handled in
  // onOpenChange to avoid setState-in-effect).
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) void fetchData();
  };

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.length;

  const markAllRead = async () => {
    setMarking(true);
    try {
      const res = await fetch("/api/notifications?unread=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setData({ notifications: [] });
        toast.success("All notifications marked as read.");
      } else {
        toast.error("Failed to mark notifications as read.");
      }
    } catch {
      toast.error("Could not reach the server.");
    }
    setMarking(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-w-[calc(100vw-1rem)] p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs font-semibold">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1 text-muted-foreground">
                  · {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={marking}
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50"
            >
              {marking ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto scroll-thin">
          {loading ? (
            <LoadingState label="Loading notifications…" />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500/70" />
              <p className="text-xs text-muted-foreground">
                You&apos;re all caught up.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex gap-2 px-3 py-2.5 hover:bg-muted/50"
                >
                  <div className="mt-0.5">
                    {n.severity === "high" ? (
                      <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                    ) : n.severity === "medium" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold">{n.title}</p>
                      <Pill tone={severityTone(n.severity)}>{n.severity}</Pill>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {n.message}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground/70">
                      <Clock className="h-2.5 w-2.5" />
                      {relativeTime(n.createdAt)}
                      {n.type && (
                        <>
                          <span>·</span>
                          <span className="uppercase tracking-wide">{n.type}</span>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ============================================================================
 * 3. CommentsView
 * ========================================================================== */

interface CommentItem {
  id: string;
  projectId: string;
  versionId: string | null;
  targetSection: string;
  author: string;
  body: string;
  resolved: boolean;
  createdAt: string;
}

interface CommentsData {
  comments: CommentItem[];
}

export function CommentsView({
  projectId,
  versionId,
}: {
  projectId: string;
  versionId?: string;
}) {
  const [data, setData] = useState<CommentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const buildUrl = (extra?: string) => {
    const params = new URLSearchParams({ projectId });
    if (versionId) params.set("versionId", versionId);
    if (extra) params.set("_", extra);
    return `/api/comments?${params.toString()}`;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl(), { cache: "no-store" });
      if (!res.ok) {
        setError(`Failed to load comments (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as CommentsData;
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
        const res = await fetch(buildUrl(), { cache: "no-store" });
        if (res.ok && !cancelled) {
          const d = (await res.json()) as CommentsData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load comments (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, versionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedSection = section.trim();
    const trimmedBody = body.trim();
    if (!trimmedSection) {
      toast.error("Please specify a target section.");
      return;
    }
    if (!trimmedBody) {
      toast.error("Comment body cannot be empty.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          versionId: versionId ?? null,
          targetSection: trimmedSection,
          body: trimmedBody,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(j?.error ?? "Failed to add comment.");
        setSubmitting(false);
        return;
      }
      setSection("");
      setBody("");
      toast.success("Comment added.");
      await fetchData();
    } catch {
      toast.error("Could not reach the server.");
    }
    setSubmitting(false);
  };

  const toggleResolved = async (c: CommentItem) => {
    setTogglingId(c.id);
    try {
      const res = await fetch(`/api/comments/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !c.resolved }),
      });
      if (!res.ok) {
        toast.error("Failed to update comment.");
        setTogglingId(null);
        return;
      }
      if (data) {
        setData({
          comments: data.comments.map((x) =>
            x.id === c.id ? { ...x, resolved: !c.resolved } : x,
          ),
        });
      }
    } catch {
      toast.error("Could not reach the server.");
    }
    setTogglingId(null);
  };

  const comments = data?.comments ?? [];
  const openCount = comments.filter((c) => !c.resolved).length;

  return (
    <Panel
      title="Comments"
      icon={<MessagesSquare className="h-4 w-4 text-primary" />}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {comments.length} total · {openCount} open
        </p>
        <RefreshButton loading={loading} onClick={() => void fetchData()} />
      </div>

      {/* Add comment form */}
      <form
        onSubmit={(e) => void submit(e)}
        className="space-y-2 rounded-lg border bg-card p-3"
      >
        <div className="flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold">Add a comment</p>
        </div>
        <input
          type="text"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder="Target section (e.g. FR-3, Roadmap)"
          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your comment…"
          className="min-h-16 text-xs"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={submitting}
            className="h-8 text-xs"
          >
            {submitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MessageSquare className="h-3 w-3" />
            )}
            Submit
          </Button>
        </div>
      </form>

      {/* Comment list */}
      {loading && !data ? (
        <LoadingState label="Loading comments…" />
      ) : error && !data ? (
        <ErrorState message={error} />
      ) : comments.length === 0 ? (
        <Empty label="No comments yet. Start a discussion above." />
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className={cn(
                "rounded-lg border bg-card p-3",
                c.resolved && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold uppercase text-primary">
                    {c.author.slice(0, 2)}
                  </span>
                  <p className="text-xs font-semibold">{c.author}</p>
                  <span className="text-[10px] text-muted-foreground">
                    · {relativeTime(c.createdAt)}
                  </span>
                </div>
                {c.resolved ? (
                  <Pill tone="success">resolved</Pill>
                ) : (
                  <Pill tone="warn">open</Pill>
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed">{c.body}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ChevronRight className="h-2.5 w-2.5" />
                  {c.targetSection || "general"}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  disabled={togglingId === c.id}
                  onClick={() => void toggleResolved(c)}
                >
                  {togglingId === c.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : c.resolved ? (
                    <RefreshCw className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {c.resolved ? "Reopen" : "Resolve"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ============================================================================
 * 4. ProviderAnalyticsView
 * ========================================================================== */

interface ProviderStats {
  providerId: string;
  totalCalls: number;
  successRate: number;
  avgDurationMs: number;
  fallbackRate: number;
  avgTokenUsage: number;
  bestStage: string | null;
  worstStage: string | null;
}

interface ProviderAnalyticsData {
  stats: ProviderStats[];
}

function rateColor(rate: number, higherIsBetter: boolean): string {
  if (higherIsBetter) {
    if (rate >= 95) return "text-emerald-600 dark:text-emerald-400";
    if (rate >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  }
  if (rate <= 5) return "text-emerald-600 dark:text-emerald-400";
  if (rate <= 20) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function rateTone(rate: number, higherIsBetter: boolean): "success" | "warn" | "danger" {
  if (higherIsBetter) {
    if (rate >= 95) return "success";
    if (rate >= 80) return "warn";
    return "danger";
  }
  if (rate <= 5) return "success";
  if (rate <= 20) return "warn";
  return "danger";
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ProviderAnalyticsView() {
  const [data, setData] = useState<ProviderAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/provider-performance", {
        cache: "no-store",
      });
      if (!res.ok) {
        setError(`Failed to load provider stats (${res.status}).`);
        setLoading(false);
        return;
      }
      const d = (await res.json()) as ProviderAnalyticsData;
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
        const res = await fetch("/api/provider-performance", {
          cache: "no-store",
        });
        if (res.ok && !cancelled) {
          const d = (await res.json()) as ProviderAnalyticsData;
          setData(d);
        } else if (!cancelled) {
          setError(`Failed to load provider stats (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data?.stats ?? [];

  return (
    <Panel
      title="Provider analytics"
      icon={<Server className="h-4 w-4 text-primary" />}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Live performance & fallback metrics per provider.
        </p>
        <RefreshButton loading={loading} onClick={() => void fetchData()} />
      </div>

      {loading && !data ? (
        <LoadingState label="Loading provider stats…" />
      ) : error && !data ? (
        <ErrorState message={error} />
      ) : stats.length === 0 ? (
        <Empty label="No provider performance data yet. Run a generation to populate." />
      ) : (
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-2">Provider</th>
                <th className="py-1.5 pr-2 text-right">Calls</th>
                <th className="py-1.5 pr-2 text-right">Success</th>
                <th className="py-1.5 pr-2 text-right">Fallback</th>
                <th className="py-1.5 pr-2 text-right">Avg ms</th>
                <th className="py-1.5 pr-2 text-right">Avg tokens</th>
                <th className="py-1.5 pr-2">Best stage</th>
                <th className="py-1.5 pr-2">Worst stage</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.providerId} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 font-medium">{s.providerId}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    {s.totalCalls}
                  </td>
                  <td className="py-1.5 pr-2 text-right">
                    <Pill tone={rateTone(s.successRate, true)}>
                      {s.successRate}%
                    </Pill>
                  </td>
                  <td className="py-1.5 pr-2 text-right">
                    <Pill tone={rateTone(s.fallbackRate, false)}>
                      {s.fallbackRate}%
                    </Pill>
                  </td>
                  <td
                    className={cn(
                      "py-1.5 pr-2 text-right tabular-nums",
                      rateColor(s.successRate, true),
                    )}
                  >
                    {formatMs(s.avgDurationMs)}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted-foreground">
                    {formatTokens(s.avgTokenUsage)}
                  </td>
                  <td className="py-1.5 pr-2">
                    {s.bestStage ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {s.bestStage}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2">
                    {s.worstStage ? (
                      <span className="text-destructive">{s.worstStage}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          <span className="text-emerald-600 dark:text-emerald-400">Green</span>{" "}
          ≥95% success / ≤5% fallback ·{" "}
          <span className="text-amber-600 dark:text-amber-400">Amber</span> ≥80%
          / ≤20% ·{" "}
          <span className="text-destructive">Red</span> below threshold.
        </p>
      )}
    </Panel>
  );
}

/* ============================================================================
 * 5. ImpactPropagationView
 * ========================================================================== */

interface ImpactEntry {
  artifact: string;
  impact: string;
  severity: "high" | "medium" | "low";
}

interface ImpactData {
  sourceArtifact: string;
  impactedArtifacts: ImpactEntry[];
  recommendation: string;
}

function impactSeverityTone(sev: ImpactEntry["severity"]): "danger" | "warn" | "neutral" {
  if (sev === "high") return "danger";
  if (sev === "medium") return "warn";
  return "neutral";
}

function impactSeverityIcon(sev: ImpactEntry["severity"]) {
  if (sev === "high") return <ShieldAlert className="h-3.5 w-3.5 text-destructive" />;
  if (sev === "medium") return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  return <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function ImpactPropagationView() {
  const [sources, setSources] = useState<string[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load source list once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/impact", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const d = (await res.json()) as { sources: string[] };
          setSources(d.sources ?? []);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setSourcesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch impact when a source is selected. The loading/error/impact reset
  // happens in the select handler (not in the effect body) so we never call
  // setState synchronously inside the effect.
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/impact?source=${encodeURIComponent(selected)}`,
          { cache: "no-store" },
        );
        if (res.ok && !cancelled) {
          const d = (await res.json()) as ImpactData;
          setImpact(d);
        } else if (!cancelled) {
          setError(`Failed to load impact (${res.status}).`);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
      if (!cancelled) setImpactLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const handleSelectSource = (val: string) => {
    setSelected(val);
    setImpact(null);
    setImpactLoading(true);
    setError(null);
  };

  return (
    <Panel
      title="Impact propagation"
      icon={<Network className="h-4 w-4 text-primary" />}
      className="space-y-4"
    >
      <p className="text-[10px] text-muted-foreground">
        Pick a source artifact that changed — see which downstream artifacts must
        be reviewed or regenerated.
      </p>

      {/* Source selector */}
      {sourcesLoading ? (
        <LoadingState label="Loading sources…" />
      ) : sources.length === 0 ? (
        <Empty label="No impact sources available." />
      ) : (
        <Select value={selected} onValueChange={handleSelectSource}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a source artifact…" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Impact output */}
      {!selected ? (
        <Empty label="Select a source artifact to trace its downstream impact." />
      ) : impactLoading ? (
        <LoadingState label="Tracing impact…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : !impact ? (
        <Empty label="No impact data." />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs">
              <span className="font-semibold">{impact.sourceArtifact}</span>
              <span className="text-muted-foreground"> impacts</span>{" "}
              <Pill tone="primary">{impact.impactedArtifacts.length}</Pill>
              <span className="text-muted-foreground"> artifact(s)</span>
            </p>
          </div>

          {impact.impactedArtifacts.length === 0 ? (
            <Empty label="No known downstream impacts." />
          ) : (
            <ul className="space-y-1.5">
              {impact.impactedArtifacts.map((e, i) => (
                <li
                  key={i}
                  className="rounded-md border bg-card p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {impactSeverityIcon(e.severity)}
                      <p className="text-xs font-semibold">{e.artifact}</p>
                    </div>
                    <Pill tone={impactSeverityTone(e.severity)}>
                      {e.severity}
                    </Pill>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {e.impact}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {impact.recommendation && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-[11px] leading-relaxed">
                <span className="font-semibold">Recommendation: </span>
                {impact.recommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

/* ============================================================================
 * 6. OrchestratorPanel
 * ========================================================================== */

export function OrchestratorPanel({
  isContinuation,
  inputLength,
  fullRun,
}: {
  isContinuation: boolean;
  inputLength: number;
  fullRun: boolean;
}) {
  const plan = useMemo(
    () =>
      planRun({
        sourceType: "mixed",
        hasRepo: false,
        docType: "PRD",
        isContinuation,
        hasMemory: isContinuation,
        inputLength,
        gateMode: "enabled",
        fullRun,
      }),
    [isContinuation, inputLength, fullRun],
  );

  const triggerFlags = [
    { label: "Research", on: plan.triggerResearch, icon: Sparkles },
    { label: "Extra debate", on: plan.triggerExtraDebate, icon: MessagesSquare },
    { label: "Adapt council", on: plan.adaptCouncil, icon: ShieldAlert },
  ];

  return (
    <Panel
      title="Orchestrator plan"
      icon={<Route className="h-4 w-4 text-primary" />}
      className="space-y-4"
    >
      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Stages to run
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-primary">
            {plan.stages.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Skipped
          </p>
          <p
            className={cn(
              "mt-0.5 text-2xl font-bold tabular-nums",
              plan.skipped.length > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {plan.skipped.length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Est. duration
          </p>
          <p className="mt-0.5 text-xs font-bold tabular-nums">
            <Clock className="mr-1 inline h-3 w-3" />
            {plan.estimatedDuration}
          </p>
        </div>
      </div>

      {/* Rationale */}
      <div className="flex items-start gap-2 rounded-lg border bg-card p-2.5">
        <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Rationale
          </p>
          <p className="mt-0.5 text-xs leading-relaxed">{plan.rationale}</p>
        </div>
      </div>

      {/* Skipped stages with reasons */}
      {plan.skipped.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <SkipForward className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-xs font-semibold">Skipped stages</p>
          </div>
          <ul className="space-y-1">
            {plan.skipped.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border bg-card p-2"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">{s.stage}</p>
                  <p className="text-[10px] text-muted-foreground">{s.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stages to run */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold">Stages to run</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {plan.stages.map((s) => (
            <Pill key={s} tone="primary">
              {s}
            </Pill>
          ))}
        </div>
      </div>

      {/* Trigger flags */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold">Trigger flags</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {triggerFlags.map(({ label, on, icon: Icon }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-1.5 rounded-md border p-2",
                on
                  ? "border-primary/40 bg-primary/5"
                  : "bg-card opacity-60",
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  on
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium">{label}</p>
                <p
                  className={cn(
                    "text-[9px] font-semibold uppercase",
                    on
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {on ? "on" : "off"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
