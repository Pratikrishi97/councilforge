import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Delete a provider key configuration. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.providerConfig.deleteMany({ where: { providerId: id } });
  return Response.json({ success: true, providerId: id });
}
