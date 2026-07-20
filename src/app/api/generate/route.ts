import { NextRequest } from "next/server";
import { runPipeline, type PipelineEvent } from "@/lib/pipeline";
import { DOC_TYPES, type DocType } from "@/lib/doc-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_DOC_TYPES = new Set<string>(DOC_TYPES.map((d) => d.id));

export async function POST(req: NextRequest) {
  let body: {
    projectId?: string;
    docType?: string;
    sourceType?: string;
    repoUrl?: string;
    text?: string;
    audience?: string;
    gateMode?: string;
    resumeVersionId?: string;
    gateFeedback?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const docType = (body.docType ?? "AUTO") as DocType;
  if (!VALID_DOC_TYPES.has(docType)) {
    return json({ error: `Unknown document type: ${docType}` }, 400);
  }

  const sourceType =
    body.sourceType === "repo" ? "repo" : body.sourceType === "mixed" ? "mixed" : "text";
  const repoUrl = (body.repoUrl ?? "").trim();
  const text = (body.text ?? "").trim();
  const audience = (body.audience ?? "").trim() || undefined;
  const projectId = (body.projectId ?? "").trim() || undefined;
  const gateMode = body.gateMode === "enabled" ? "enabled" : "disabled" as const;
  const resumeVersionId = (body.resumeVersionId ?? "").trim() || undefined;
  const gateFeedback = (body.gateFeedback ?? "").trim() || undefined;

  // When resuming from a gate, skip input validation (the version already exists)
  if (!resumeVersionId) {
    if (!projectId) {
      if (sourceType === "repo" && !repoUrl) {
        return json({ error: "A repository URL is required when source type is 'repo'." }, 400);
      }
      if (sourceType === "text" && text.length < 10) {
        return json({ error: "Please provide at least a few sentences of source material." }, 400);
      }
      if (sourceType === "mixed" && !repoUrl && text.length < 10) {
        return json({ error: "Mixed source needs either a repo URL or some notes." }, 400);
      }
    } else {
      if (!repoUrl && text.length < 5) {
        return json(
          { error: "Provide new notes or a repo URL to generate a new version." },
          400,
        );
      }
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (evt: PipelineEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      };
      try {
        for await (const evt of runPipeline({
          projectId,
          docType,
          sourceType,
          repoUrl: repoUrl || undefined,
          text: text || undefined,
          audience,
          gateMode,
          resumeVersionId,
          gateFeedback,
        })) {
          send(evt);
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Unexpected pipeline failure.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
