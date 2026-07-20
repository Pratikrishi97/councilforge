"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentProps } from "react";
import { Mermaid } from "@/components/mermaid";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CodeProps = ComponentProps<"code"> & {
  inline?: boolean;
};

function CodeBlock({ className, children, ...props }: CodeProps) {
  const text = String(children ?? "");
  const match = /language-(\w+)/.exec(className ?? "");
  const lang = match?.[1];

  // Render mermaid blocks with the Mermaid component
  if (lang === "mermaid") {
    return <Mermaid chart={text} />;
  }

  // Inline code
  if (!className && !text.includes("\n")) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return <CodeBlockWithCopy text={text} lang={lang} />;
}

function CodeBlockWithCopy({ text, lang }: { text: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative my-3">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* ignore */
          }
        }}
        className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/80 opacity-0 transition group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      {lang ? (
        <div className="mb-0 select-none px-3 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {lang}
        </div>
      ) : null}
      <pre>
        <code className={lang ? `language-${lang}` : undefined}>{text}</code>
      </pre>
    </div>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock as never,
          a: ({ node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
