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

/** Get scenarios for a project. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const scenarios = await db.scenario.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json({
    scenarios: scenarios.map((s) => ({
      id: s.id,
      question: s.question,
      implications: safeParse(s.implications),
      recommendation: s.recommendation,
      createdAt: s.createdAt,
    })),
  });
}
