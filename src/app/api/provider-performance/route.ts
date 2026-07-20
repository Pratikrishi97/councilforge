import { getProviderStats } from "@/lib/provider-performance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Return aggregated provider performance stats. */
export async function GET() {
  const stats = await getProviderStats();
  return Response.json({ stats });
}
