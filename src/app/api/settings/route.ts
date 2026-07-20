import { db } from "@/lib/db";
import { buildRoutingPlan } from "@/lib/provider-router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Get current app settings + the provider routing plan preview. */
export async function GET() {
  const settings = await db.appSettings.findUnique({ where: { id: "singleton" } });
  let routingPlan = null;
  try {
    routingPlan = await buildRoutingPlan();
  } catch {
    /* if no settings yet, routing plan may fail */
  }
  return Response.json({
    onboardingComplete: settings?.onboardingComplete ?? false,
    providerMode: settings?.providerMode ?? "free",
    registryVersion: settings?.registryVersion ?? null,
    routingPlan,
  });
}

/** Update provider mode without going through full onboarding (for the
 *  settings panel). */
export async function PATCH(req: Request) {
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
    update: { providerMode: mode },
  });
  return Response.json({ success: true, providerMode: mode });
}
