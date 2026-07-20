import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = [
  "input_restriction",
  "output_restriction",
  "role_restriction",
  "provider_restriction",
  "data_handling",
  "escalation",
] as const;

/** List policies, optionally filtered by project. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  const where: { projectId?: string } = {};
  if (projectId) where.projectId = projectId;

  const policies = await db.policy.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return Response.json({
    policies: policies.map((p) => ({
      id: p.id,
      projectId: p.projectId,
      type: p.type,
      rule: p.rule,
      enforced: p.enforced,
    })),
  });
}

/** Create a policy rule. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = String(body.type ?? "").trim();
  const rule = String(body.rule ?? "").trim();
  if (!type) {
    return Response.json({ error: "type is required" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return Response.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!rule) {
    return Response.json({ error: "rule is required" }, { status: 400 });
  }

  const projectId = body.projectId ? String(body.projectId) : null;
  const enforced = body.enforced === undefined ? true : Boolean(body.enforced);

  const policy = await db.policy.create({
    data: {
      projectId,
      type,
      rule,
      enforced,
    },
  });

  return Response.json({
    policy: {
      id: policy.id,
      projectId: policy.projectId,
      type: policy.type,
      rule: policy.rule,
      enforced: policy.enforced,
    },
  });
}
