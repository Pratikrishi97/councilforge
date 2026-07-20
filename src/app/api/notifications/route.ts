import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeParse<T = unknown>(v: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

/** List notifications, optionally filtered by project or unread-only. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const unread = url.searchParams.get("unread");

  const where: { projectId?: string; read?: boolean } = {};
  if (projectId) where.projectId = projectId;
  if (unread === "true") where.read = false;

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      projectId: n.projectId,
      type: n.type,
      title: n.title,
      message: n.message,
      severity: n.severity,
      read: n.read,
      details: safeParse(n.details),
      createdAt: n.createdAt,
    })),
  });
}

/** Mark all notifications as read (optionally scoped to a project). */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  const where: { projectId?: string; read: boolean } = { read: false };
  if (projectId) where.projectId = projectId;

  const result = await db.notification.updateMany({
    where,
    data: { read: true },
  });

  return Response.json({ success: true, updated: result.count });
}
