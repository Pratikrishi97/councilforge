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

/** Get the decision journal for a project. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const decisions = await db.decisionJournal.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({
    decisions: decisions.map((d) => ({
      id: d.id,
      decision: d.decision,
      rationale: d.rationale,
      alternativesConsidered: safeParse(d.alternativesConsidered),
      tradeoffs: safeParse(d.tradeoffs),
      supportedBy: safeParse(d.supportedBy),
      objectedBy: safeParse(d.objectedBy),
      confidence: d.confidence,
      affectedDocuments: safeParse(d.affectedDocuments),
      createdAt: d.createdAt,
    })),
  });
}
