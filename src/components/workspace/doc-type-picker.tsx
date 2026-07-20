"use client";

import { useWorkspace } from "@/store/workspace";
import { DOC_TYPES } from "@/lib/doc-types";
import type { DocType } from "@/lib/doc-types";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

export function DocTypePicker() {
  const { docType, setDocType, running } = useWorkspace();

  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        2 · Document type
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {DOC_TYPES.map((d) => {
          const active = docType === d.id;
          const Icon = (Icons[d.icon as keyof typeof Icons] ??
            Icons.FileText) as Icons.LucideIcon;
          return (
            <button
              key={d.id}
              type="button"
              disabled={running}
              onClick={() => setDocType(d.id as DocType)}
              className={cn(
                "group relative flex flex-col gap-1 rounded-lg border p-2.5 text-left transition disabled:opacity-60",
                active
                  ? "border-primary bg-accent shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/50",
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-xs font-semibold">{d.short}</span>
              </div>
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  active ? "text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {d.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
