import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List backlog items for a project. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const items = await db.backlogItem.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return Response.json({
    items: items.map((i) => ({
      id: i.id,
      projectId: i.projectId,
      versionId: i.versionId,
      itemType: i.itemType,
      title: i.title,
      description: i.description,
      requirementId: i.requirementId,
      priority: i.priority,
      effort: i.effort,
      status: i.status,
      createdAt: i.createdAt,
    })),
  });
}
