import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List evidence library entries, optionally filtered by project or topic. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const topic = url.searchParams.get("topic");

  const where: { projectId?: string; topic?: string } = {};
  if (projectId) where.projectId = projectId;
  if (topic) where.topic = topic;

  const evidence = await db.evidenceLibrary.findMany({
    where,
    orderBy: { collectedAt: "desc" },
    take: 500,
  });

  return Response.json({
    evidence: evidence.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      topic: e.topic,
      sourceTitle: e.sourceTitle,
      sourceUrl: e.sourceUrl,
      sourceType: e.sourceType,
      snippet: e.snippet,
      confidence: e.confidence,
      relevance: e.relevance,
      collectedAt: e.collectedAt,
    })),
  });
}
