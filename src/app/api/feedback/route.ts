import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_RATINGS = [
  "helpful",
  "not_helpful",
  "inaccurate",
  "too_generic",
  "missing_context",
  "excellent",
] as const;

const VALID_ACTIONS = ["accepted", "rejected", "edited"] as const;

/** Create a user feedback record on a version or section. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const projectId = String(body.projectId ?? "").trim();
  const rating = String(body.rating ?? "").trim();
  if (!projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!VALID_RATINGS.includes(rating as (typeof VALID_RATINGS)[number])) {
    return Response.json(
      { error: `rating must be one of: ${VALID_RATINGS.join(", ")}` },
      { status: 400 },
    );
  }

  const versionId = body.versionId ? String(body.versionId) : null;
  const comment = body.comment ? String(body.comment) : null;
  const targetSection = body.targetSection
    ? String(body.targetSection)
    : null;
  const action = body.action ? String(body.action) : null;
  if (
    action &&
    !VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number])
  ) {
    return Response.json(
      { error: `action must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 },
    );
  }

  const feedback = await db.userFeedback.create({
    data: {
      projectId,
      versionId,
      rating,
      comment,
      targetSection,
      action,
    },
  });

  return Response.json({ feedback });
}

/** List feedback for a project (?projectId=xxx). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  const where: { projectId?: string } = {};
  if (projectId) where.projectId = projectId;

  const feedback = await db.userFeedback.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json({
    feedback: feedback.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      versionId: f.versionId,
      rating: f.rating,
      comment: f.comment,
      targetSection: f.targetSection,
      action: f.action,
      createdAt: f.createdAt,
    })),
  });
}
