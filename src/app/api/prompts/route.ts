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

/** List all prompt registry entries. */
export async function GET() {
  const prompts = await db.promptRegistry.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return Response.json({
    prompts: prompts.map((p) => ({
      id: p.id,
      name: p.name,
      version: p.version,
      purpose: p.purpose,
      role: p.role,
      active: p.active,
      createdAt: p.createdAt,
    })),
  });
}

/** Create a new prompt registry entry. Sets active=true by default. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const version = String(body.version ?? "").trim();
  const purpose = String(body.purpose ?? "").trim();
  const systemPrompt = String(body.systemPrompt ?? "").trim();

  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (!version) {
    return Response.json({ error: "version is required" }, { status: 400 });
  }
  if (!purpose) {
    return Response.json({ error: "purpose is required" }, { status: 400 });
  }
  if (!systemPrompt) {
    return Response.json(
      { error: "systemPrompt is required" },
      { status: 400 },
    );
  }

  const role = body.role ? String(body.role) : null;
  const expectedFormat = body.expectedFormat
    ? String(body.expectedFormat)
    : null;
  const validationRules = body.validationRules
    ? JSON.stringify(body.validationRules)
    : null;
  const changeNote = body.changeNote ? String(body.changeNote) : null;

  // Deactivate prior versions of this prompt name so only one is active.
  const existing = await db.promptRegistry.findUnique({
    where: { name_version: { name, version } },
  });
  if (existing) {
    return Response.json(
      {
        error: `Prompt ${name}@${version} already exists`,
      },
      { status: 409 },
    );
  }

  const created = await db.promptRegistry.create({
    data: {
      name,
      version,
      purpose,
      role,
      systemPrompt,
      expectedFormat,
      validationRules,
      changeNote,
      active: true,
    },
  });

  return Response.json({
    prompt: {
      id: created.id,
      name: created.name,
      version: created.version,
      purpose: created.purpose,
      role: created.role,
      expectedFormat: created.expectedFormat,
      validationRules: safeParse(created.validationRules),
      changeNote: created.changeNote,
      active: created.active,
      createdAt: created.createdAt,
    },
  });
}
