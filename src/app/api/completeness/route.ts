import { db } from "@/lib/db";
import { checkCompleteness } from "@/lib/completeness";

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

/** Return a CompletenessResult for a project. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

  const latestVersion = await db.docVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: "desc" },
    select: {
      document: true,
      requirements: true,
      traceability: true,
      qualityGates: true,
      qualityScore: true,
      validationCouncil: true,
      research: true,
      decisionJournal: true,
      knowledgeGraph: true,
      costEstimate: true,
      sprintPlan: true,
      archSimulation: true,
      scenarioSimulation: true,
      generationManifest: true,
    },
  });

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { memory: true },
  });

  const [
    decisions,
    research,
    knowledgeNodes,
    acceptanceTests,
    backlogItems,
    roadmapPhases,
    competitors,
    scenarios,
    feedback,
    policies,
  ] = await Promise.all([
    db.decisionJournal.count({ where: { projectId } }),
    db.researchEntry.count({ where: { projectId } }),
    db.knowledgeNode.count({ where: { projectId } }),
    db.acceptanceTest.count({ where: { projectId } }),
    db.backlogItem.count({ where: { projectId } }),
    db.roadmapPhase.count({ where: { projectId } }),
    db.competitor.count({ where: { projectId } }),
    db.scenario.count({ where: { projectId } }),
    db.userFeedback.count({ where: { projectId } }),
    db.policy.count({ where: { projectId } }),
  ]);

  const result = await checkCompleteness(
    projectId,
    latestVersion
      ? {
          document: latestVersion.document,
          requirements: latestVersion.requirements,
          traceability: latestVersion.traceability,
          qualityGates: latestVersion.qualityGates,
          qualityScore: latestVersion.qualityScore,
          validationCouncil: latestVersion.validationCouncil,
          research: latestVersion.research,
          decisionJournal: latestVersion.decisionJournal,
          knowledgeGraph: latestVersion.knowledgeGraph,
          costEstimate: latestVersion.costEstimate,
          sprintPlan: latestVersion.sprintPlan,
          archSimulation: latestVersion.archSimulation,
          scenarioSimulation: latestVersion.scenarioSimulation,
          generationManifest: latestVersion.generationManifest,
        }
      : null,
    {
      decisions,
      research,
      knowledgeNodes,
      acceptanceTests,
      backlogItems,
      roadmapPhases,
      competitors,
      scenarios,
      feedback,
    },
    project?.memory ? safeParse(project.memory) : null,
    policies,
  );

  return Response.json(result);
}
