import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mark a single notification as read or unread. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.read !== "boolean") {
    return Response.json(
      { error: "read (boolean) is required" },
      { status: 400 },
    );
  }

  const updated = await db.notification.update({
    where: { id },
    data: { read: body.read },
  });

  return Response.json({
    notification: {
      id: updated.id,
      projectId: updated.projectId,
      type: updated.type,
      title: updated.title,
      message: updated.message,
      severity: updated.severity,
      read: updated.read,
      createdAt: updated.createdAt,
    },
  });
}
