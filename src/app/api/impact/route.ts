import {
  propagateImpact,
  getImpactSources,
} from "@/lib/impact-propagator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/impact
 *  - No `source` query: return the list of available source artifacts.
 *  - With `?source=PRD`: return the impact propagation for that source.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source");

  if (!source) {
    return Response.json({ sources: getImpactSources() });
  }

  const result = propagateImpact(source);
  return Response.json(result);
}
