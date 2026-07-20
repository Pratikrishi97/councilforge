import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sourceType: true,
      repoUrl: true,
      memory: true,
      repoDetails: true,
      createdAt: true,
      updatedAt: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          docType: true,
          docTypeReason: true,
          status: true,
          qualityScore: true,
          revised: true,
          changeSummary: true,
          createdAt: true,
        },
      },
    },
  });
  if (!project) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  let memory = null;
  if (project.memory) {
    try {
      memory = JSON.parse(project.memory);
    } catch {
      memory = null;
    }
  }
  return Response.json({ project: { ...project, memory } });
}
