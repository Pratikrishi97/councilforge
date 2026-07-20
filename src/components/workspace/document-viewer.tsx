"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download, FileText, FileJson, FileSpreadsheet, ListTodo } from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { getDocType } from "@/lib/doc-types";
import { Empty } from "@/components/workspace/stage-panels";
import { FeedbackButtons } from "@/components/workspace/delivery-panels";

export function DocumentViewer() {
  const {
    stages,
    resolvedDocType,
    resolvedDocReason,
    currentProjectId,
    currentVersionId,
    currentVersionNumber,
    revisionApplied,
  } = useWorkspace();
  const generateStage = stages.generate;
  const doc = typeof generateStage.data === "string" ? generateStage.data : "";

  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"rendered" | "source">("rendered");

  const docType = resolvedDocType ?? "AUTO";
  const cfg = getDocType(docType);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(doc);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = () => {
    const blob = new Blob([doc], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = cfg.short.toLowerCase().replace(/\s+/g, "-");
    a.href = url;
    a.download = `${slug || "document"}-${(currentProjectId ?? "draft").slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: string) => {
    if (!currentVersionId) return;
    window.open(`/api/versions/${currentVersionId}/export?format=${format}`, "_blank");
  };

  if (generateStage.status === "running" && !doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-6 w-6 animate-pulse text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Drafting your document…</p>
          <p className="text-xs text-muted-foreground">
            The model is synthesizing all stages into the final artifact.
          </p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <Empty label="The generated document will render here once the Generate stage completes." />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {cfg.short}
          </span>
          {currentVersionNumber && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              v{currentVersionNumber}
            </span>
          )}
          {revisionApplied && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              revised
            </span>
          )}
          {resolvedDocReason && (
            <span className="text-[11px] text-muted-foreground">
              · auto-selected
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="mr-1 inline-flex rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setView("rendered")}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                view === "rendered"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Rendered
            </button>
            <button
              type="button"
              onClick={() => setView("source")}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
                view === "source"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Markdown
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-7 gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            .md
          </Button>
          {currentVersionId && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("json")}
                className="h-7 gap-1.5 text-xs"
                title="Export full version data as JSON"
              >
                <FileJson className="h-3.5 w-3.5" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                className="h-7 gap-1.5 text-xs"
                title="Export traceability matrix as CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("issues")}
                className="h-7 gap-1.5 text-xs"
                title="Export requirements as issue-tracker JSON"
              >
                <ListTodo className="h-3.5 w-3.5" />
                Issues
              </Button>
            </>
          )}
        </div>
      </div>

      {resolvedDocReason && (
        <div className="border-b bg-accent/40 px-4 py-2 text-[11px] text-accent-foreground">
          <span className="font-medium">Why this document type:</span>{" "}
          {resolvedDocReason}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scroll-thin">
        {view === "rendered" ? (
          <article className="mx-auto max-w-3xl px-5 py-6">
            <Markdown>{doc}</Markdown>
          </article>
        ) : (
          <pre className="m-4 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed scroll-thin">
            <code>{doc}</code>
          </pre>
        )}
      </div>

      {currentProjectId && currentVersionId && (
        <div className="border-t bg-muted/20 px-4 py-2">
          <FeedbackButtons projectId={currentProjectId} versionId={currentVersionId} />
        </div>
      )}
    </div>
  );
}
