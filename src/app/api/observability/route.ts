import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List observability events, optionally filtered by project or version. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const versionId = url.searchParams.get("versionId");
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "200"),
    500,
  );

  const where: { projectId?: string; versionId?: string } = {};
  if (projectId) where.projectId = projectId;
  if (versionId) where.versionId = versionId;

  const events = await db.observabilityEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Response.json({
    events: events.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      versionId: e.versionId,
      stage: e.stage,
      providerId: e.providerId,
      durationMs: e.durationMs,
      tokenUsage: e.tokenUsage,
      status: e.status,
      message: e.message,
      createdAt: e.createdAt,
    })),
  });
}
