import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeParse<T = unknown>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const v = await db.docVersion.findUnique({ where: { id } });
  if (!v) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return Response.json({
    version: {
      id: v.id,
      projectId: v.projectId,
      versionNumber: v.versionNumber,
      parentVersionId: v.parentVersionId,
      docType: v.docType,
      docTypeReason: v.docTypeReason,
      sourceType: v.sourceType,
      sourceInput: v.sourceInput,
      audience: v.audience,
      status: v.status,
      errorMessage: v.errorMessage,
      revised: v.revised,
      revisionCount: v.revisionCount,
      revisionFocus: safeParse(v.revisionFocus),
      qualityScore: v.qualityScore,
      changeSummary: v.changeSummary,
      changedSections: safeParse(v.changedSections),
      createdAt: v.createdAt,
      contextMap: safeParse(v.contextMap),
      repoIntel: safeParse(v.repoIntel),
      hypotheses: safeParse(v.hypotheses),
      debate: safeParse(v.debate),
      debateRounds: safeParse(v.debateRounds),
      requirements: safeParse(v.requirements),
      gaps: safeParse(v.gaps),
      risks: safeParse(v.risks),
      strategy: safeParse(v.strategy),
      document: v.document,
      traceability: safeParse(v.traceability),
      assumptions: safeParse(v.assumptions),
      confidence: safeParse(v.confidence),
      openQuestions: safeParse(v.openQuestions),
      nextActions: safeParse(v.nextActions),
      qualityGates: safeParse(v.qualityGates),
      providerLog: safeParse(v.providerLog),
      validationCouncil: safeParse(v.validationCouncil),
      research: safeParse(v.research),
      competitorIntel: safeParse(v.competitorIntel),
      featureRecs: safeParse(v.featureRecs),
      costEstimate: safeParse(v.costEstimate),
      sprintPlan: safeParse(v.sprintPlan),
      archSimulation: safeParse(v.archSimulation),
      knowledgeGraph: safeParse(v.knowledgeGraph),
      decisionJournal: safeParse(v.decisionJournal),
      scenarioSimulation: safeParse(v.scenarioSimulation),
      aiVoting: safeParse(v.aiVoting),
      dynamicCouncil: safeParse(v.dynamicCouncil),
      gateState: safeParse(v.gateState),
      generationManifest: safeParse(v.generationManifest),
    },
  });
}
