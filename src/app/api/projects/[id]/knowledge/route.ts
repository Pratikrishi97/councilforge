import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Get the knowledge graph for a project (nodes + edges). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [nodes, edges] = await Promise.all([
    db.knowledgeNode.findMany({
      where: { projectId: id },
      orderBy: { nodeType: "asc" },
    }),
    db.knowledgeEdge.findMany({ where: { projectId: id } }),
  ]);

  return Response.json({
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.nodeType,
      label: n.label,
      metadata: n.metadata ? JSON.parse(n.metadata) : {},
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      relation: e.relation,
    })),
    counts: {
      byType: nodes.reduce(
        (acc, n) => {
          acc[n.nodeType] = (acc[n.nodeType] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      total: nodes.length,
      edges: edges.length,
    },
  });
}
