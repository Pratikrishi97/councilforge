"use client";

import { useMemo } from "react";
import { diffDocuments, type SectionDiff } from "@/lib/diff";
import { Empty } from "@/components/workspace/stage-panels";
import { ArrowRight, FileDiff, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function DiffView({
  oldDoc,
  newDoc,
  hasParent,
}: {
  oldDoc: string | null;
  newDoc: string | null;
  hasParent: boolean;
}) {
  const diff = useMemo(() => {
    if (!newDoc) return null;
    return diffDocuments(oldDoc ?? "", newDoc);
  }, [oldDoc, newDoc]);

  if (!newDoc) {
    return (
      <Empty label="Generate a document to see its content. Versions that build on a previous one show a diff here." />
    );
  }

  if (!hasParent || !oldDoc) {
    return (
      <Empty label="This is the first version of this project. Generate a new version to see a diff against the previous one." />
    );
  }

  if (!diff) return null;

  const { sections, summary } = diff;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <SummaryStat
          icon={<Plus className="h-3.5 w-3.5" />}
          label="Added"
          value={summary.added}
          tone="text-emerald-600 dark:text-emerald-400"
        />
        <SummaryStat
          icon={<Minus className="h-3.5 w-3.5" />}
          label="Removed"
          value={summary.removed}
          tone="text-destructive"
        />
        <SummaryStat
          icon={<ArrowRight className="h-3.5 w-3.5" />}
          label="Changed"
          value={summary.changed}
          tone="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="space-y-2">
        {sections.map((s, i) => (
          <SectionCard key={i} section={s} />
        ))}
      </div>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
      <span className={tone}>{icon}</span>
      <div>
        <p className={cn("text-lg font-bold tabular-nums", tone)}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: SectionDiff }) {
  if (section.status === "unchanged") {
    return (
      <div className="rounded-md border border-border/60 bg-muted/20 p-2">
        <div className="flex items-center gap-2">
          <FileDiff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {section.heading}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            unchanged
          </span>
        </div>
      </div>
    );
  }

  const tone =
    section.status === "added"
      ? "border-emerald-500/40 bg-emerald-500/5"
      : section.status === "removed"
        ? "border-destructive/40 bg-destructive/5"
        : "border-amber-500/40 bg-amber-500/5";

  return (
    <div className={cn("rounded-md border p-2.5", tone)}>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            section.status === "added"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : section.status === "removed"
                ? "bg-destructive/15 text-destructive"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
          )}
        >
          {section.status === "added" && <Plus className="h-3 w-3" />}
          {section.status === "removed" && <Minus className="h-3 w-3" />}
          {section.status === "changed" && <ArrowRight className="h-3 w-3" />}
          {section.status}
        </span>
        <span className="text-xs font-semibold">{section.heading}</span>
      </div>
      <div className="overflow-x-auto rounded bg-background/50 p-2 font-mono text-[11px] leading-relaxed scroll-thin">
        {section.lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap break-words",
              l.type === "added" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
              l.type === "removed" &&
                "bg-destructive/15 text-destructive",
              l.type === "unchanged" && "text-muted-foreground",
            )}
          >
            <span className="select-none opacity-50">
              {l.type === "added" ? "+ " : l.type === "removed" ? "- " : "  "}
            </span>
            {l.value}
          </div>
        ))}
      </div>
    </div>
  );
}
