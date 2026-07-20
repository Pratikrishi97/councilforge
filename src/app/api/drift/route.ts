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

/** List drift alerts for a project. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const alerts = await db.driftAlert.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      alertType: a.alertType,
      description: a.description,
      impactedArtifacts: safeParse<string[]>(a.impactedArtifacts),
      severity: a.severity,
      resolved: a.resolved,
      createdAt: a.createdAt,
    })),
  });
}
