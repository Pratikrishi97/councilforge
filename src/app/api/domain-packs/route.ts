import { DOMAIN_PACKS } from "@/lib/domain-packs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List all domain packs from the catalog. */
export async function GET() {
  return Response.json({ packs: DOMAIN_PACKS });
}
