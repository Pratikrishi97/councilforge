import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeParse<T = unknown>(v: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

/** List acceptance tests for a project, with coverage stats. Coverage is
 *  computed against the latest version's functional needs. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const tests = await db.acceptanceTest.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Coverage: total requirements = functionalNeeds from latest version's
  // requirements JSON (fallback to KnowledgeNode count if absent).
  const latestVersion = await db.docVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: "desc" },
    select: { requirements: true },
  });

  let totalRequirements = 0;
  if (latestVersion?.requirements) {
    const reqs = safeParse<{
      functionalNeeds?: { id?: string }[];
    }>(latestVersion.requirements);
    if (reqs?.functionalNeeds && Array.isArray(reqs.functionalNeeds)) {
      totalRequirements = reqs.functionalNeeds.length;
    }
  }
  if (totalRequirements === 0) {
    const nodeCount = await db.knowledgeNode.count({
      where: { projectId, nodeType: "requirement" },
    });
    totalRequirements = nodeCount;
  }

  const testedRequirementIds = new Set(
    tests.map((t) => t.requirementId).filter(Boolean),
  );
  const withTests = testedRequirementIds.size;
  const withoutTests = Math.max(0, totalRequirements - withTests);
  const percent =
    totalRequirements === 0
      ? 0
      : Math.round((withTests / totalRequirements) * 100);

  return Response.json({
    tests: tests.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      versionId: t.versionId,
      requirementId: t.requirementId,
      testId: t.testId,
      given: t.given,
      when: t.when,
      then: t.then,
      testType: t.testType,
      status: t.status,
      createdAt: t.createdAt,
    })),
    coverage: {
      total: totalRequirements,
      withTests,
      withoutTests,
      percent,
    },
  });
}
