"use client";

import { useEffect } from "react";
import { useWorkspace } from "@/store/workspace";
import { getDocType } from "@/lib/doc-types";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ProjectSidebar() {
  const {
    projects,
    projectsLoading,
    refreshProjects,
    loadVersion,
    loadProjectMemory,
    setContinueProject,
    resetPipeline,
    continueProjectId,
    currentProjectId,
    currentVersionId,
    loadedVersionId,
    running,
  } = useWorkspace();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects, running]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNewVersion = (projectId: string) => {
    setContinueProject(projectId);
    void loadProjectMemory(projectId);
    resetPipeline();
  };

  const handleLoadVersion = (versionId: string) => {
    void loadVersion(versionId);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </span>
        </div>
        <button
          type="button"
          onClick={() => void refreshProjects()}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Refresh projects"
        >
          {projectsLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
        {projects.length === 0 ? (
          <p className="px-2 py-4 text-[11px] text-muted-foreground">
            No projects yet. Generate a document to create one.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {projects.map((p) => {
              const isOpen = expanded.has(p.id) || currentProjectId === p.id;
              const latest = p.versions[0];
              return (
                <li key={p.id}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className="flex flex-1 items-center gap-1 rounded-md px-1.5 py-1 text-left hover:bg-muted/60"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-xs font-medium">
                        {p.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNewVersion(p.id)}
                      title="New version of this project"
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-primary"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  {isOpen && (
                    <ul className="ml-2 border-l pl-2">
                      {p.versions.length === 0 ? (
                        <li className="py-1 text-[11px] text-muted-foreground">
                          No versions
                        </li>
                      ) : (
                        p.versions.map((v) => {
                          const cfg = getDocType(v.docType);
                          const active =
                            loadedVersionId === v.id ||
                            currentVersionId === v.id;
                          const date = new Date(v.createdAt);
                          return (
                            <li key={v.id}>
                              <button
                                type="button"
                                onClick={() => handleLoadVersion(v.id)}
                                className={cn(
                                  "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left transition",
                                  active
                                    ? "bg-accent"
                                    : "hover:bg-muted/60",
                                )}
                              >
                                <span className="text-[10px] font-bold text-primary">
                                  v{v.versionNumber}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {cfg.short}
                                </span>
                                {v.status === "complete" && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                )}
                                {v.status === "generating" && (
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                                )}
                                {v.status === "error" && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                )}
                                {typeof v.qualityScore === "number" && (
                                  <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                                    {v.qualityScore}
                                  </span>
                                )}
                              </button>
                              <p className="px-2 pb-1 text-[9px] text-muted-foreground">
                                {date.toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                {date.toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                  {latest && !isOpen && (
                    <p className="ml-5 truncate text-[10px] text-muted-foreground">
                      v{latest.versionNumber} · {getDocType(latest.docType).short}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {continueProjectId && (
        <div className="border-t px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-primary">
              Continuing project
            </span>
            <button
              type="button"
              onClick={() => {
                setContinueProject(null);
                resetPipeline();
              }}
              className="text-[10px] text-muted-foreground underline hover:text-foreground"
            >
              start fresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
