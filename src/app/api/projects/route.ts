import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      sourceType: true,
      repoUrl: true,
      createdAt: true,
      updatedAt: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: {
          id: true,
          versionNumber: true,
          docType: true,
          status: true,
          qualityScore: true,
          createdAt: true,
        },
      },
      _count: { select: { versions: true } },
    },
  });
  return Response.json({ projects });
}
