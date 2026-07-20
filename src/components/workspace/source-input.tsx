"use client";

import { useWorkspace } from "@/store/workspace";
import { Github, FileText, Layers, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SOURCE_TABS = [
  {
    id: "text" as const,
    label: "Notes / Code",
    icon: FileText,
    desc: "Paste requirements, notes, specs, or code",
  },
  {
    id: "repo" as const,
    label: "GitHub Repo",
    icon: Github,
    desc: "Analyze a public repository",
  },
  {
    id: "mixed" as const,
    label: "Notes + Repo",
    icon: Layers,
    desc: "Combine your notes with a repo",
  },
];

export function SourceInput() {
  const {
    sourceType,
    setSourceType,
    repoUrl,
    setRepoUrl,
    text,
    setText,
    audience,
    setAudience,
    continueProjectId,
    memory,
  } = useWorkspace();

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          1 · Source material
        </Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SOURCE_TABS.map((tab) => {
            const active = sourceType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSourceType(tab.id)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition",
                  active
                    ? "border-primary bg-accent text-accent-foreground shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent/50",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-xs font-semibold leading-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {SOURCE_TABS.find((t) => t.id === sourceType)?.desc}
        </p>
      </div>

      {(sourceType === "repo" || sourceType === "mixed") && (
        <div>
          <Label htmlFor="repo-url" className="text-xs font-medium">
            Repository URL
          </Label>
          <Input
            id="repo-url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="mt-1.5 font-mono text-sm"
            spellCheck={false}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Public repos only. README + file tree are read automatically.
          </p>
        </div>
      )}

      {(sourceType === "text" || sourceType === "mixed") && (
        <div>
          <Label htmlFor="source-text" className="text-xs font-medium">
            {sourceType === "mixed" ? "Your notes / context" : "Notes, requirements, or code"}
          </Label>
          <Textarea
            id="source-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              "Paste a product brief, meeting notes, API spec, code snippet, or raw requirements…\n\nExample:\nWe're building an internal tool for the sales team to track deal stages. It needs role-based access (rep, manager, admin), pipeline views, and Slack notifications when a deal moves to 'closing'. Mobile-friendly is a must."
            }
            className="mt-1.5 min-h-[180px] resize-y font-mono text-[13px] leading-relaxed scroll-thin"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{text.length.toLocaleString()} chars</span>
            {text.length > 0 && text.length < 10 && (
              <span className="text-amber-600 dark:text-amber-400">
                Add a bit more detail for a stronger result
              </span>
            )}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="audience" className="text-xs font-medium">
          Audience <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. engineering team, executive sponsors, QA"
          className="mt-1.5 text-sm"
        />
      </div>

      {continueProjectId && memory && (
        <div className="rounded-md border border-primary/30 bg-accent/40 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            Project memory loaded
          </p>
          <div className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
            {memory.priorSummary && <p>{memory.priorSummary}</p>}
            {memory.goals && memory.goals.length > 0 && (
              <p>
                <span className="font-medium text-foreground">Goals:</span>{" "}
                {memory.goals.slice(0, 3).join("; ")}
                {memory.goals.length > 3 && ` +${memory.goals.length - 3} more`}
              </p>
            )}
            {memory.stakeholders && memory.stakeholders.length > 0 && (
              <p>
                <span className="font-medium text-foreground">Stakeholders:</span>{" "}
                {memory.stakeholders.join(", ")}
              </p>
            )}
            {memory.openQuestions && memory.openQuestions.length > 0 && (
              <p>
                <span className="font-medium text-foreground">
                  Open questions:
                </span>{" "}
                {memory.openQuestions.length} carried forward
              </p>
            )}
          </div>
          <p className="mt-1.5 text-[10px] italic text-muted-foreground">
            Provide new input below — the engine will diff against the prior
            version and produce a new one.
          </p>
        </div>
      )}
    </div>
  );
}

export function GenerateButton() {
  const {
    running,
    startGeneration,
    abortGeneration,
    error,
    continueProjectId,
  } = useWorkspace();
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={running ? abortGeneration : startGeneration}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition",
          running
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        )}
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Stop pipeline
          </>
        ) : (
          <>
            <SparkleIcon />
            {continueProjectId ? "Generate new version" : "Generate document"}
          </>
        )}
      </button>
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
    </svg>
  );
}
