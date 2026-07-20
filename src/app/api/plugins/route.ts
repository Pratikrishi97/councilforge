import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = [
  "research",
  "debate",
  "validation",
  "prompt",
  "provider",
  "export",
  "policy",
  "domain",
  "evaluation",
  "simulation",
] as const;

/** List all installed plugins. */
export async function GET() {
  const plugins = await db.pluginRegistry.findMany({
    orderBy: { installedAt: "desc" },
    take: 500,
  });

  return Response.json({
    plugins: plugins.map((p) => ({
      id: p.id,
      pluginId: p.pluginId,
      name: p.name,
      description: p.description,
      category: p.category,
      version: p.version,
      enabled: p.enabled,
      installedAt: p.installedAt,
    })),
  });
}

/** Install/register a new plugin. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pluginId = String(body.pluginId ?? "").trim();
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "").trim();
  const version = String(body.version ?? "").trim();

  if (!pluginId || !name || !description || !version) {
    return Response.json(
      {
        error:
          "pluginId, name, description, and version are required",
      },
      { status: 400 },
    );
  }
  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return Response.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }

  // manifest may be an object or a string; serialize to JSON
  let manifestStr: string;
  if (body.manifest === undefined || body.manifest === null) {
    return Response.json(
      { error: "manifest is required" },
      { status: 400 },
    );
  } else if (typeof body.manifest === "string") {
    // validate it parses as JSON
    try {
      JSON.parse(body.manifest);
      manifestStr = body.manifest;
    } catch {
      return Response.json(
        { error: "manifest string must be valid JSON" },
        { status: 400 },
      );
    }
  } else {
    try {
      manifestStr = JSON.stringify(body.manifest);
    } catch {
      return Response.json(
        { error: "manifest must be serializable to JSON" },
        { status: 400 },
      );
    }
  }

  const existing = await db.pluginRegistry.findUnique({
    where: { pluginId },
  });
  if (existing) {
    return Response.json(
      { error: `Plugin with pluginId "${pluginId}" already installed` },
      { status: 409 },
    );
  }

  const plugin = await db.pluginRegistry.create({
    data: {
      pluginId,
      name,
      description,
      category,
      version,
      manifest: manifestStr,
      enabled: true,
    },
  });

  return Response.json({
    plugin: {
      id: plugin.id,
      pluginId: plugin.pluginId,
      name: plugin.name,
      description: plugin.description,
      category: plugin.category,
      version: plugin.version,
      enabled: plugin.enabled,
      installedAt: plugin.installedAt,
    },
  });
}
