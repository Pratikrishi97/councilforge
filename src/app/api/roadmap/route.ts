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

/** List roadmap phases for a project. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const phases = await db.roadmapPhase.findMany({
    where: { projectId },
    orderBy: { phaseNumber: "asc" },
    take: 100,
  });

  return Response.json({
    phases: phases.map((p) => ({
      id: p.id,
      projectId: p.projectId,
      phaseNumber: p.phaseNumber,
      phaseName: p.phaseName,
      description: p.description,
      contents: safeParse<{
        features?: string[];
        dependencies?: string[];
        risks?: string[];
      }>(p.contents),
      targetDate: p.targetDate,
      confidence: p.confidence,
      createdAt: p.createdAt,
    })),
  });
}
