import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Get audit log entries, optionally filtered by project or action. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const action = url.searchParams.get("action");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100"), 500);

  const where: { projectId?: string; action?: string } = {};
  if (projectId) where.projectId = projectId;
  if (action) where.action = action;

  const entries = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Response.json({
    entries: entries.map((e) => ({
      id: e.id,
      action: e.action,
      projectId: e.projectId,
      versionId: e.versionId,
      actor: e.actor,
      details: e.details ? JSON.parse(e.details) : null,
      createdAt: e.createdAt,
    })),
  });
}
