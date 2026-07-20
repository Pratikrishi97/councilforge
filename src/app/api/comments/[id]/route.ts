import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Update a comment (resolve/unresolve or edit body). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { resolved?: boolean; body?: string } = {};
  if (typeof body.resolved === "boolean") {
    data.resolved = body.resolved;
  }
  if (body.body !== undefined) {
    const bodyText = String(body.body ?? "").trim();
    if (!bodyText) {
      return Response.json(
        { error: "body must not be empty" },
        { status: 400 },
      );
    }
    data.body = bodyText;
  }

  if (Object.keys(data).length === 0) {
    return Response.json(
      { error: "No updatable fields provided (resolved, body)" },
      { status: 400 },
    );
  }

  const updated = await db.comment.update({
    where: { id },
    data,
  });

  return Response.json({
    comment: {
      id: updated.id,
      projectId: updated.projectId,
      versionId: updated.versionId,
      targetSection: updated.targetSection,
      author: updated.author,
      body: updated.body,
      resolved: updated.resolved,
      createdAt: updated.createdAt,
    },
  });
}

/** Delete a comment by id. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.comment.delete({ where: { id } });
  return Response.json({ success: true, id });
}
