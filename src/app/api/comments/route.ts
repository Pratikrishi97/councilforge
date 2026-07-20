import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List comments for a project (optionally filtered by version). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const versionId = url.searchParams.get("versionId");

  const where: { projectId?: string; versionId?: string } = {};
  if (projectId) where.projectId = projectId;
  if (versionId) where.versionId = versionId;

  const comments = await db.comment.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  return Response.json({
    comments: comments.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      versionId: c.versionId,
      targetSection: c.targetSection,
      author: c.author,
      body: c.body,
      resolved: c.resolved,
      createdAt: c.createdAt,
    })),
  });
}

/** Create a comment on a document section. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const projectId = String(body.projectId ?? "").trim();
  const targetSection = String(body.targetSection ?? "").trim();
  const bodyText = String(body.body ?? "").trim();
  if (!projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!targetSection) {
    return Response.json(
      { error: "targetSection is required" },
      { status: 400 },
    );
  }
  if (!bodyText) {
    return Response.json({ error: "body is required" }, { status: 400 });
  }

  const versionId = body.versionId ? String(body.versionId) : null;
  const author = body.author ? String(body.author) : "user";

  const comment = await db.comment.create({
    data: {
      projectId,
      versionId,
      targetSection,
      author,
      body: bodyText,
      resolved: false,
    },
  });

  return Response.json({
    comment: {
      id: comment.id,
      projectId: comment.projectId,
      versionId: comment.versionId,
      targetSection: comment.targetSection,
      author: comment.author,
      body: comment.body,
      resolved: comment.resolved,
      createdAt: comment.createdAt,
    },
  });
}
