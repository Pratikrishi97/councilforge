"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
  flowchart: { curve: "basis", useMaxWidth: true },
  themeVariables: {
    primaryColor: "#d1fae5",
    primaryTextColor: "#064e3b",
    primaryBorderColor: "#10b981",
    lineColor: "#6b7280",
    secondaryColor: "#f1f5f9",
    tertiaryColor: "#ffffff",
  },
});

let idCounter = 0;

export function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${++idCounter}`;
    (async () => {
      try {
        const { svg: out } = await mermaid.render(id, chart);
        if (!cancelled) {
          setSvg(out);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Diagram render error");
          setSvg("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
        <p className="font-medium">Mermaid diagram could not render</p>
        <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[11px] opacity-80">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-wrap my-4 overflow-x-auto rounded-lg border bg-card p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
