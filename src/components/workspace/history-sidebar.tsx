"use client";

import { useEffect } from "react";
import { useWorkspace } from "@/store/workspace";
import { getDocType } from "@/lib/doc-types";
import { History, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function HistorySidebar() {
  const {
    history,
    historyLoading,
    refreshHistory,
    loadProject,
    loadedProjectId,
    currentProjectId,
    running,
  } = useWorkspace();

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory, running]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            History
          </span>
        </div>
        <button
          type="button"
          onClick={() => void refreshHistory()}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Refresh history"
        >
          {historyLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
        {history.length === 0 ? (
          <p className="px-2 py-4 text-[11px] text-muted-foreground">
            No documents yet. Generate one to see it here.
          </p>
        ) : (
          <ul className="space-y-1">
            {history.map((h) => {
              const cfg = getDocType(h.docType);
              const active = loadedProjectId === h.id || currentProjectId === h.id;
              const date = new Date(h.createdAt);
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => void loadProject(h.id)}
                    className={cn(
                      "w-full rounded-md border px-2.5 py-2 text-left transition",
                      active
                        ? "border-primary bg-accent"
                        : "border-transparent hover:border-border hover:bg-muted/60",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                        {cfg.short}
                      </span>
                      {h.status === "complete" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {h.status === "generating" && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                      )}
                      {h.status === "error" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-foreground/90">
                      {h.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      ·{" "}
                      {date.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
