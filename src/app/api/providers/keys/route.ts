import { db } from "@/lib/db";
import { maskApiKey } from "@/lib/provider-router";
import { PROVIDER_CATALOG } from "@/lib/provider-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Add or update an API key for a provider. Keys are masked in the response
 *  and never logged in plaintext. */
export async function POST(req: Request) {
  const body = await req.json();
  const providerId = String(body.providerId ?? "").trim();
  const apiKey = String(body.apiKey ?? "").trim();

  if (!providerId || !apiKey) {
    return Response.json({ error: "providerId and apiKey are required" }, { status: 400 });
  }

  const catalog = PROVIDER_CATALOG.find((p) => p.id === providerId);
  if (!catalog) {
    return Response.json({ error: `Unknown provider: ${providerId}` }, { status: 400 });
  }

  const masked = maskApiKey(apiKey);
  await db.providerConfig.upsert({
    where: { providerId },
    create: {
      providerId,
      apiKeyMasked: masked,
      apiKeyEnc: apiKey, // in production: encrypt at rest
      configured: true,
    },
    update: {
      apiKeyMasked: masked,
      apiKeyEnc: apiKey,
      configured: true,
    },
  });

  return Response.json({ success: true, providerId, keyMasked: masked });
}

/** List all configured keys (masked). */
export async function GET() {
  const configs = await db.providerConfig.findMany();
  return Response.json({
    keys: configs.map((c) => ({
      providerId: c.providerId,
      keyMasked: c.apiKeyMasked,
      configured: c.configured,
    })),
  });
}
