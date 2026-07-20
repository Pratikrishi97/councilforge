import { db } from "@/lib/db";
import { PROVIDER_CATALOG } from "@/lib/provider-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bootstrap (or refresh) the local provider registry from the catalog
 * (which is curated from https://github.com/cheahjs/free-llm-api-resources).
 * Also fetches the README to confirm the source version.
 */
export async function POST() {
  try {
    // fetch README to confirm source + capture a version hash
    let readmeVersion: string | null = null;
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/cheahjs/free-llm-api-resources/main/README.md",
        { cache: "no-store" },
      );
      if (res.ok) {
        const text = await res.text();
        readmeVersion = `len:${text.length}`;
      }
    } catch {
      /* offline fallback — still seed from catalog */
    }

    // upsert every catalog provider into the local registry
    let upserted = 0;
    for (const entry of PROVIDER_CATALOG) {
      await db.providerEntry.upsert({
        where: { providerId: entry.id },
        create: {
          providerId: entry.id,
          name: entry.name,
          category: entry.category,
          data: JSON.stringify(entry),
          enabled: true,
        },
        update: {
          name: entry.name,
          category: entry.category,
          data: JSON.stringify(entry),
        },
      });
      upserted++;
    }

    // mark settings
    await db.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        registryVersion: readmeVersion ?? "catalog",
        registryFetchedAt: new Date(),
      },
      update: {
        registryVersion: readmeVersion ?? "catalog",
        registryFetchedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      providersBootstrapped: upserted,
      version: readmeVersion ?? "catalog",
      source: "https://github.com/cheahjs/free-llm-api-resources",
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Bootstrap failed" },
      { status: 500 },
    );
  }
}

/** List the local registry + user key configs (masked). */
export async function GET() {
  const entries = await db.providerEntry.findMany({
    orderBy: { name: "asc" },
  });
  const configs = await db.providerConfig.findMany();
  const keyMap = new Map(configs.map((c) => [c.providerId, c.apiKeyMasked]));

  return Response.json({
    providers: entries.map((e) => {
      const data = JSON.parse(e.data);
      return {
        ...data,
        enabled: e.enabled,
        keyConfigured: keyMap.has(e.providerId),
        keyMasked: keyMap.get(e.providerId) ?? null,
      };
    }),
  });
}
