import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Get onboarding state + settings. */
export async function GET() {
  const settings = await db.appSettings.findUnique({ where: { id: "singleton" } });
  return Response.json({
    onboardingComplete: settings?.onboardingComplete ?? false,
    providerMode: settings?.providerMode ?? "free",
    registryVersion: settings?.registryVersion ?? null,
    registryFetchedAt: settings?.registryFetchedAt ?? null,
    registrySource:
      settings?.registrySource ??
      "https://github.com/cheahjs/free-llm-api-resources",
  });
}

/** Complete onboarding: set mode + mark complete. */
export async function POST(req: Request) {
  const body = await req.json();
  const mode = body.providerMode;
  const valid = ["own-keys", "free", "hybrid", "local"];
  if (!valid.includes(mode)) {
    return Response.json({ error: "Invalid provider mode" }, { status: 400 });
  }
  await db.appSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      onboardingComplete: true,
      providerMode: mode,
    },
    update: {
      onboardingComplete: true,
      providerMode: mode,
    },
  });
  return Response.json({ success: true, providerMode: mode });
}
