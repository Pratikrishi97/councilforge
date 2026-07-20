import { db } from "./db";
import { extractJson } from "./llm";
import {
  routeProvider,
  executeWithRouting,
  type RoutingDecision,
  type ProviderLogEntry,
} from "./provider-router";
import {
  UNDERSTAND_SYSTEM,
  understandUser,
  HYPOTHESES_SYSTEM,
  hypothesesUser,
  DEBATE_ROUND1_SYSTEM,
  debateRound1User,
  DEBATE_ROUND2_SYSTEM,
  debateRound2User,
  MODERATOR_SYSTEM,
  moderatorUser,
  REQUIREMENTS_SYSTEM,
  requirementsUser,
  GAPS_RISKS_SYSTEM,
  gapsRisksUser,
  STRATEGY_SYSTEM,
  strategyUser,
  generateSystem,
  generateUser,
  VALIDATE_SYSTEM,
  validateUser,
  REVISE_SYSTEM,
  reviseUser,
  VALIDATION_COUNCIL_SYSTEM,
  validationCouncilUser,
  METADATA_SYSTEM,
  metadataUser,
  RESEARCH_SYSTEM,
  researchUser,
  COMPETITOR_SYSTEM,
  competitorUser,
  FEATURE_REC_SYSTEM,
  featureRecUser,
  COST_ESTIMATE_SYSTEM,
  costEstimateUser,
  SPRINT_PLAN_SYSTEM,
  sprintPlanUser,
  ARCH_SIM_SYSTEM,
  archSimUser,
  KNOWLEDGE_GRAPH_SYSTEM,
  knowledgeGraphUser,
  DECISION_JOURNAL_SYSTEM,
  decisionJournalUser,
  SCENARIO_SYSTEM,
  scenarioUser,
  AI_VOTING_SYSTEM,
  aiVotingUser,
  DYNAMIC_COUNCIL_SYSTEM,
  dynamicCouncilUser,
  ACCEPTANCE_TEST_SYSTEM,
  acceptanceTestUser,
  BACKLOG_SYSTEM,
  backlogUser,
  ROADMAP_SYSTEM,
  roadmapUser,
  type SourceBundle,
  type ProjectMemory,
} from "./prompts";
import {
  fetchRepoIntelligence,
  summarizeTreeForModel,
  type RepoIntelligenceRaw,
} from "./github";
import { deriveMemory } from "./memory";
import { diffDocuments } from "./diff";
import type { DocType } from "./doc-types";
import { buildManifest } from "./manifest";
import { audit, AuditActions } from "./audit";
import { notify, NotificationTypes } from "./notifications";
import { recordPerformance } from "./provider-performance";
import {
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt,
} from "./evaluation";

/** Discriminated event stream the API serializes to SSE. */
export type PipelineEvent =
  | { type: "stage_start"; stage: StageKey; label: string }
  | { type: "stage_complete"; stage: StageKey; data: unknown }
  | { type: "stage_skipped"; stage: StageKey; reason: string }
  | { type: "doc_type_resolved"; docType: DocType; reason: string }
  | { type: "version_created"; projectId: string; versionId: string; versionNumber: number }
  | { type: "revision_applied"; focus: string }
  | { type: "provider_routed"; stage: string; decision: RoutingDecision }
  | { type: "gate_reached"; stage: StageKey; versionId: string; message: string }
  | { type: "manifest_built"; manifest: unknown }
  | { type: "error"; message: string }
  | { type: "complete"; projectId: string; versionId: string };

export type StageKey =
  | "ingest"
  | "understand"
  | "dynamic_council"
  | "research"
  | "hypotheses"
  | "debate_round1"
  | "debate_round2"
  | "moderator"
  | "ai_voting"
  | "requirements"
  | "gaps_risks"
  | "competitor_intel"
  | "feature_recs"
  | "strategy"
  | "generate"
  | "validate"
  | "revise"
  | "validation_council"
  | "acceptance_tests"
  | "backlog"
  | "roadmap"
  | "evaluation"
  | "cost_estimate"
  | "sprint_plan"
  | "arch_simulation"
  | "scenario_simulation"
  | "knowledge_graph"
  | "decision_journal"
  | "metadata";

export const STAGE_LABELS: Record<StageKey, string> = {
  ingest: "Collecting context & repository intelligence",
  understand: "Understanding source + repo intelligence",
  dynamic_council: "Adapting council to project domain",
  research: "Autonomous research agent",
  hypotheses: "Generating hypotheses",
  debate_round1: "Council debate — Round 1 (proposals)",
  debate_round2: "Council debate — Round 2 (responses)",
  moderator: "Moderator synthesis & consensus",
  ai_voting: "AI council weighted voting",
  requirements: "Discovering & inferring requirements",
  gaps_risks: "Detecting gaps & risks",
  competitor_intel: "Competitor intelligence",
  feature_recs: "Feature recommendations",
  strategy: "Selecting document strategy",
  generate: "Drafting the document",
  validate: "Self-critique & quality gates",
  revise: "Revising weak sections",
  validation_council: "Validation council review",
  acceptance_tests: "Generating acceptance tests",
  backlog: "Converting to backlog items",
  roadmap: "Roadmap intelligence",
  evaluation: "Evaluation & benchmarking",
  cost_estimate: "Cost estimation",
  sprint_plan: "Sprint planning",
  arch_simulation: "Architecture simulation",
  scenario_simulation: "Scenario simulation",
  knowledge_graph: "Knowledge graph update",
  decision_journal: "Decision journal update",
  metadata: "Traceability & metadata",
};

export const STAGE_ORDER: StageKey[] = [
  "ingest",
  "understand",
  "dynamic_council",
  "research",
  "hypotheses",
  "debate_round1",
  "debate_round2",
  "moderator",
  "ai_voting",
  "requirements",
  "gaps_risks",
  "competitor_intel",
  "feature_recs",
  "strategy",
  "generate",
  "validate",
  "revise",
  "validation_council",
  "acceptance_tests",
  "backlog",
  "roadmap",
  "evaluation",
  "cost_estimate",
  "sprint_plan",
  "arch_simulation",
  "scenario_simulation",
  "knowledge_graph",
  "decision_journal",
  "metadata",
];

export interface PipelineInput {
  projectId?: string;
  docType: DocType;
  sourceType: "repo" | "text" | "mixed";
  repoUrl?: string;
  text?: string;
  audience?: string;
  /** When enabled, the pipeline pauses at gate checkpoints. */
  gateMode?: "enabled" | "disabled";
  /** When resuming from a gate, the versionId to continue. */
  resumeVersionId?: string;
  /** User feedback when resuming from a gate (revision notes). */
  gateFeedback?: string;
}

const MAX_REVISIONS = 1;

/** Safe provider mode fetch (defaults to "free" if settings missing). */
async function getProviderModeSafe(): Promise<string> {
  try {
    const settings = await db.appSettings.findUnique({ where: { id: "singleton" } });
    return settings?.providerMode ?? "free";
  } catch {
    return "free";
  }
}

/** Stages where the pipeline pauses when gate mode is enabled. */
const GATE_POINTS: StageKey[] = [
  "understand",
  "moderator",
  "requirements",
  "validate",
];

/** Gate event — emitted when the pipeline reaches a checkpoint. */
export type GateEvent = {
  type: "gate_reached";
  stage: StageKey;
  versionId: string;
  message: string;
  data?: unknown;
};

/**
 * Helper: run a routed JSON stage (route → execute → parse JSON → log provider).
 * Also records an observability event for timing + status tracking.
 */
async function runJsonStage<T = unknown>(
  stage: string,
  role: string,
  system: string,
  user: string,
  providerLog: ProviderLogEntry[],
  projectId?: string,
  versionId?: string,
): Promise<{ data: T; decision: RoutingDecision }> {
  const startTime = Date.now();
  const decision = await routeProvider(role);
  let status = "success";
  try {
    const result = await executeWithRouting({
      decision,
      messages: { system, user },
      jsonMode: true,
      retries: 2,
    });
    const finalDecision = result.decision;
    providerLog.push({
      stage,
      role,
      decision: finalDecision,
      at: new Date().toISOString(),
    });
    const data = extractJson<T>(result.content);
    // record observability + provider performance
    if (finalDecision.fallback) status = "fallback";
    const duration = Date.now() - startTime;
    void db.observabilityEvent.create({
      data: {
        projectId: projectId ?? null,
        versionId: versionId ?? null,
        stage,
        providerId: finalDecision.providerId,
        durationMs: duration,
        tokenUsage: result.content.length + system.length + user.length,
        status,
        message: finalDecision.fallback ? `Fell back from ${finalDecision.fallbackFrom}` : null,
      },
    }).catch(() => {});
    void recordPerformance({
      providerId: finalDecision.providerId,
      stage,
      role,
      durationMs: duration,
      status,
      tokenUsage: result.content.length + system.length + user.length,
      projectId: projectId ?? undefined,
      versionId: versionId ?? undefined,
    });
    // notify on fallback
    if (finalDecision.fallback && projectId) {
      void notify({
        projectId,
        type: NotificationTypes.PROVIDER_FALLBACK,
        title: "Provider fallback",
        message: `${stage}: fell back from ${finalDecision.fallbackFrom} to ${finalDecision.providerName}`,
        severity: "low",
        details: { stage, providerId: finalDecision.providerId },
      });
    }
    return { data, decision: finalDecision };
  } catch (err) {
    void db.observabilityEvent.create({
      data: {
        projectId: projectId ?? null,
        versionId: versionId ?? null,
        stage,
        providerId: decision.providerId,
        durationMs: Date.now() - startTime,
        status: "error",
        message: err instanceof Error ? err.message.slice(0, 200) : "Unknown error",
      },
    }).catch(() => {});
    throw err;
  }
}

/** Helper: run a routed text stage (for document generation/revision). */
async function runTextStage(
  stage: string,
  role: string,
  system: string,
  user: string,
  providerLog: ProviderLogEntry[],
  projectId?: string,
  versionId?: string,
): Promise<{ content: string; decision: RoutingDecision }> {
  const startTime = Date.now();
  const decision = await routeProvider(role);
  let status = "success";
  try {
    const result = await executeWithRouting({
      decision,
      messages: { system, user },
      retries: 2,
    });
    providerLog.push({
      stage,
      role,
      decision: result.decision,
      at: new Date().toISOString(),
    });
    if (result.decision.fallback) status = "fallback";
    void db.observabilityEvent.create({
      data: {
        projectId: projectId ?? null,
        versionId: versionId ?? null,
        stage,
        providerId: result.decision.providerId,
        durationMs: Date.now() - startTime,
        tokenUsage: result.content.length + system.length + user.length,
        status,
        message: result.decision.fallback ? `Fell back from ${result.decision.fallbackFrom}` : null,
      },
    }).catch(() => {});
    return { content: result.content, decision: result.decision };
  } catch (err) {
    void db.observabilityEvent.create({
      data: {
        projectId: projectId ?? null,
        versionId: versionId ?? null,
        stage,
        providerId: decision.providerId,
        durationMs: Date.now() - startTime,
        status: "error",
        message: err instanceof Error ? err.message.slice(0, 200) : "Unknown error",
      },
    }).catch(() => {});
    throw err;
  }
}

export async function* runPipeline(
  input: PipelineInput,
): AsyncGenerator<PipelineEvent> {
  const providerLog: ProviderLogEntry[] = [];

  // ---- load or create the project + version ----------------------------
  let projectId = input.projectId;
  let project: { id: string; name: string; sourceType: string; repoUrl: string | null; memory: string | null; repoDetails: string | null } | null = null;
  let parentVersionId: string | null = null;
  let versionNumber = 1;
  let memory: ProjectMemory = {};

  if (projectId) {
    project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      yield { type: "error", message: "Project not found." };
      return;
    }
    const latest = await db.docVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: "desc" },
    });
    if (latest) {
      parentVersionId = latest.id;
      versionNumber = latest.versionNumber + 1;
    }
    if (project.memory) {
      try {
        memory = JSON.parse(project.memory) as ProjectMemory;
      } catch {
        memory = {};
      }
    }
  } else {
    const titleSeed =
      input.repoUrl?.trim() ||
      input.text?.trim().slice(0, 80) ||
      "Untitled project";
    project = await db.project.create({
      data: {
        name: titleSeed,
        sourceType: input.sourceType,
        repoUrl: input.repoUrl ?? null,
      },
    });
    projectId = project.id;
  }

  const gateMode = input.gateMode ?? "disabled";
  const startedAt = new Date().toISOString();

  // ---- resume from a gate, or create a new version -------------------
  let version: { id: string; projectId: string; versionNumber: number; gateState: string | null; docType: string; sourceType: string; sourceInput: string; audience: string | null; parentVersionId: string | null };

  if (input.resumeVersionId) {
    // resuming from a gate — load the existing version
    version = await db.docVersion.findUnique({
      where: { id: input.resumeVersionId },
      select: {
        id: true,
        projectId: true,
        versionNumber: true,
        gateState: true,
        docType: true,
        sourceType: true,
        sourceInput: true,
        audience: true,
        parentVersionId: true,
      },
    });
    if (!version) {
      yield { type: "error", message: "Version not found for resume." };
      return;
    }
    projectId = version.projectId;
    // reload project memory
    project = await db.project.findUnique({ where: { id: projectId } });
    if (project?.memory) {
      try {
        memory = JSON.parse(project.memory) as ProjectMemory;
      } catch {
        memory = {};
      }
    }
    void audit({
      action: AuditActions.GATE_APPROVED,
      projectId,
      versionId: version.id,
      details: { feedback: input.gateFeedback ?? null },
    });
  } else {
    version = await db.docVersion.create({
      data: {
        projectId,
        versionNumber,
        parentVersionId,
        docType: input.docType,
        sourceType: input.sourceType,
        sourceInput: input.repoUrl
          ? input.repoUrl
          : (input.text ?? "").slice(0, 8000),
        audience: input.audience ?? null,
        status: "generating",
        gateState: JSON.stringify({
          mode: gateMode,
          currentGate: null,
          gatesPassed: [],
          userFeedback: null,
        }),
      },
    });
  }

  yield {
    type: "version_created",
    projectId,
    versionId: version.id,
    versionNumber: version.versionNumber,
  };

  /** Gate checkpoint helper — call after a gate-point stage completes.
   *  Returns true if the pipeline should pause (gate mode is on). */
  const shouldGate = (stage: StageKey): boolean => {
    return gateMode === "enabled" && GATE_POINTS.includes(stage);
  };

  const saveGateState = async (stage: StageKey) => {
    await db.docVersion.update({
      where: { id: version.id },
      data: {
        gateState: JSON.stringify({
          mode: gateMode,
          currentGate: stage,
          gatesPassed: GATE_POINTS.slice(0, GATE_POINTS.indexOf(stage) + 1),
          userFeedback: input.gateFeedback ?? null,
        }),
      },
    });
  };

  const emitProvider = (stage: string, decision: RoutingDecision) => ({
    type: "provider_routed" as const,
    stage,
    decision,
  });

  // Bound stage runners that automatically pass projectId + versionId for observability
  const runStage = <T = unknown>(
    stage: string,
    role: string,
    system: string,
    user: string,
  ) => runJsonStage<T>(stage, role, system, user, providerLog, projectId, version.id);
  const runText = (
    stage: string,
    role: string,
    system: string,
    user: string,
  ) => runTextStage(stage, role, system, user, providerLog, projectId, version.id);

  try {
    // ---- Stage: ingest ------------------------------------------------
    yield { type: "stage_start", stage: "ingest", label: STAGE_LABELS.ingest };

    let repoIntel: RepoIntelligenceRaw | null = null;
    if (input.sourceType === "repo" || input.sourceType === "mixed") {
      if (!input.repoUrl) {
        throw new Error("Repository URL is required for repo/mixed sources.");
      }
      repoIntel = await fetchRepoIntelligence(input.repoUrl);
      await db.project.update({
        where: { id: projectId },
        data: { repoDetails: JSON.stringify(repoIntel), repoUrl: input.repoUrl },
      });
    }

    const sourceBundle: SourceBundle = buildSourceBundle(input, repoIntel);
    await db.docVersion.update({
      where: { id: version.id },
      data: { repoIntel: repoIntel ? JSON.stringify(repoIntel) : null },
    });

    yield {
      type: "stage_complete",
      stage: "ingest",
      data: {
        sourceType: input.sourceType,
        repoUrl: input.repoUrl ?? null,
        isContinuation: !!parentVersionId,
        versionNumber,
        repoSummary: repoIntel
          ? {
              name: `${repoIntel.owner}/${repoIntel.repo}`,
              description: repoIntel.description,
              language: repoIntel.language,
              stars: repoIntel.stars,
              packageHints: repoIntel.packageHints,
              fileCount: repoIntel.tree.length,
              keyFiles: repoIntel.keyFiles.map((f) => f.path),
              hasReadme: !!repoIntel.readme,
            }
          : null,
      },
    };

    // ---- Stage: understand -------------------------------------------
    yield { type: "stage_start", stage: "understand", label: STAGE_LABELS.understand };
    const { data: contextMap, decision: understandDec } = await runStage(
      "understand",
      "solutionsArchitect",
      UNDERSTAND_SYSTEM,
      understandUser(sourceBundle, parentVersionId ? memory : undefined),
      providerLog,
    );
    yield emitProvider("understand", understandDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { contextMap: JSON.stringify(contextMap) },
    });
    yield { type: "stage_complete", stage: "understand", data: contextMap };

    // ---- gate checkpoint: after understand ---------------------------
    if (shouldGate("understand")) {
      await saveGateState("understand");
      yield {
        type: "gate_reached",
        stage: "understand",
        versionId: version.id,
        message: "Gate: Context collected. Review the context map and approve to continue.",
      };
      return;
    }

    // ---- Stage: dynamic council adaptation ---------------------------
    yield { type: "stage_start", stage: "dynamic_council", label: STAGE_LABELS.dynamic_council };
    const { data: dynamicCouncil, decision: dcDec } = await runStage(
      "dynamic_council",
      "moderator",
      DYNAMIC_COUNCIL_SYSTEM,
      dynamicCouncilUser(contextMap),
      providerLog,
    );
    yield emitProvider("dynamic_council", dcDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { dynamicCouncil: JSON.stringify(dynamicCouncil) },
    });
    yield { type: "stage_complete", stage: "dynamic_council", data: dynamicCouncil };

    // ---- Stage: autonomous research ----------------------------------
    yield { type: "stage_start", stage: "research", label: STAGE_LABELS.research };
    const { data: research, decision: resDec } = await runStage(
      "research",
      "businessAnalyst",
      RESEARCH_SYSTEM,
      researchUser(contextMap, null),
      providerLog,
    );
    yield emitProvider("research", resDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { research: JSON.stringify(research) },
    });
    // persist research entries to the project
    if (Array.isArray((research as { topics?: unknown[] })?.topics)) {
      for (const topic of (research as { topics: { topic?: string; evidenceSummary?: string; references?: unknown; confidence?: string; unresolvedGaps?: unknown[] }[] }).topics) {
        await db.researchEntry.create({
          data: {
            projectId,
            versionId: version.id,
            topic: topic.topic ?? "Untitled",
            evidenceSummary: topic.evidenceSummary ?? "",
            references: JSON.stringify(topic.references ?? []),
            confidence: topic.confidence ?? null,
            unresolvedGaps: JSON.stringify(topic.unresolvedGaps ?? []),
          },
        });
      }
    }
    yield { type: "stage_complete", stage: "research", data: research };

    // ---- Stage: hypotheses -------------------------------------------
    yield { type: "stage_start", stage: "hypotheses", label: STAGE_LABELS.hypotheses };
    const { data: hypotheses, decision: hypDec } = await runStage(
      "hypotheses",
      "productManager",
      HYPOTHESES_SYSTEM,
      hypothesesUser(contextMap),
      providerLog,
    );
    yield emitProvider("hypotheses", hypDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { hypotheses: JSON.stringify(hypotheses) },
    });
    yield { type: "stage_complete", stage: "hypotheses", data: hypotheses };

    // ---- Stage: debate round 1 ---------------------------------------
    yield { type: "stage_start", stage: "debate_round1", label: STAGE_LABELS.debate_round1 };
    const { data: round1, decision: r1Dec } = await runStage(
      "debate_round1",
      "moderator",
      DEBATE_ROUND1_SYSTEM,
      debateRound1User(contextMap, hypotheses),
      providerLog,
    );
    yield emitProvider("debate_round1", r1Dec);
    yield { type: "stage_complete", stage: "debate_round1", data: round1 };

    // ---- Stage: debate round 2 ---------------------------------------
    yield { type: "stage_start", stage: "debate_round2", label: STAGE_LABELS.debate_round2 };
    const { data: round2, decision: r2Dec } = await runStage(
      "debate_round2",
      "moderator",
      DEBATE_ROUND2_SYSTEM,
      debateRound2User(contextMap, round1),
      providerLog,
    );
    yield emitProvider("debate_round2", r2Dec);
    yield { type: "stage_complete", stage: "debate_round2", data: round2 };

    // ---- Stage: moderator --------------------------------------------
    yield { type: "stage_start", stage: "moderator", label: STAGE_LABELS.moderator };
    const { data: moderator, decision: modDec } = await runStage(
      "moderator",
      "moderator",
      MODERATOR_SYSTEM,
      moderatorUser(round1, round2),
      providerLog,
    );
    yield emitProvider("moderator", modDec);
    // store combined debate bundle
    const debateBundle = { round1, round2, moderator };
    await db.docVersion.update({
      where: { id: version.id },
      data: {
        debate: JSON.stringify(moderator),
        debateRounds: JSON.stringify(debateBundle),
      },
    });
    yield { type: "stage_complete", stage: "moderator", data: moderator };

    // ---- gate checkpoint: after moderator ----------------------------
    if (shouldGate("moderator")) {
      await saveGateState("moderator");
      yield {
        type: "gate_reached",
        stage: "moderator",
        versionId: version.id,
        message: "Gate: Council consensus reached. Review the debate and approve to continue.",
      };
      return;
    }

    // ---- Stage: requirements -----------------------------------------
    yield { type: "stage_start", stage: "requirements", label: STAGE_LABELS.requirements };
    const { data: requirements, decision: reqDec } = await runStage(
      "requirements",
      "businessAnalyst",
      REQUIREMENTS_SYSTEM,
      requirementsUser(contextMap, hypotheses, moderator),
      providerLog,
    );
    yield emitProvider("requirements", reqDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { requirements: JSON.stringify(requirements) },
    });
    yield { type: "stage_complete", stage: "requirements", data: requirements };

    // ---- gate checkpoint: after requirements -------------------------
    if (shouldGate("requirements")) {
      await saveGateState("requirements");
      yield {
        type: "gate_reached",
        stage: "requirements",
        versionId: version.id,
        message: "Gate: Requirements discovered. Review inferred/confirmed items and approve to continue.",
      };
      return;
    }

    // ---- Stage: gaps & risks -----------------------------------------
    yield { type: "stage_start", stage: "gaps_risks", label: STAGE_LABELS.gaps_risks };
    const { data: gapsRisks, decision: grDec } = await runStage(
      "gaps_risks",
      "securityReviewer",
      GAPS_RISKS_SYSTEM,
      gapsRisksUser(contextMap, requirements, moderator),
      providerLog,
    );
    yield emitProvider("gaps_risks", grDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: {
        gaps: JSON.stringify(gapsRisks.gaps ?? []),
        risks: JSON.stringify(gapsRisks.risks ?? []),
      },
    });
    yield { type: "stage_complete", stage: "gaps_risks", data: gapsRisks };

    // ---- Stage: competitor intelligence ------------------------------
    yield { type: "stage_start", stage: "competitor_intel", label: STAGE_LABELS.competitor_intel };
    const { data: competitorIntel, decision: ciDec } = await runStage(
      "competitor_intel",
      "businessAnalyst",
      COMPETITOR_SYSTEM,
      competitorUser(contextMap, requirements),
      providerLog,
    );
    yield emitProvider("competitor_intel", ciDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { competitorIntel: JSON.stringify(competitorIntel) },
    });
    // persist competitors
    if (Array.isArray((competitorIntel as { competitors?: unknown[] })?.competitors)) {
      for (const c of (competitorIntel as { competitors: { name?: string; strengths?: string[]; weaknesses?: string[]; features?: string[]; gaps?: string[]; differentiation?: string[]; strategicRecommendations?: string[] }[] }).competitors) {
        await db.competitor.create({
          data: {
            projectId,
            name: c.name ?? "Unknown",
            strengths: JSON.stringify(c.strengths ?? []),
            weaknesses: JSON.stringify(c.weaknesses ?? []),
            features: JSON.stringify(c.features ?? []),
            gaps: JSON.stringify(c.gaps ?? []),
            differentiation: JSON.stringify(c.differentiation ?? []),
            strategicRecommendations: JSON.stringify(c.strategicRecommendations ?? []),
          },
        });
      }
    }
    yield { type: "stage_complete", stage: "competitor_intel", data: competitorIntel };

    // ---- Stage: feature recommendations ------------------------------
    yield { type: "stage_start", stage: "feature_recs", label: STAGE_LABELS.feature_recs };
    const { data: featureRecs, decision: frDec } = await runStage(
      "feature_recs",
      "productManager",
      FEATURE_REC_SYSTEM,
      featureRecUser(contextMap, requirements, gapsRisks),
      providerLog,
    );
    yield emitProvider("feature_recs", frDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { featureRecs: JSON.stringify(featureRecs) },
    });
    yield { type: "stage_complete", stage: "feature_recs", data: featureRecs };

    // ---- Stage: strategy ---------------------------------------------
    yield { type: "stage_start", stage: "strategy", label: STAGE_LABELS.strategy };
    const { data: strategy, decision: stratDec } = await runJsonStage<{
      chosenType: DocType;
      reason: string;
      alternativesConsidered?: { type: string; whyRejected: string }[];
      confidence?: string;
      recommendedCompanionDocs?: string[];
    }>(
      "strategy",
      "moderator",
      STRATEGY_SYSTEM,
      strategyUser(input.docType, contextMap, gapsRisks),
      providerLog,
    );
    yield emitProvider("strategy", stratDec);

    let finalDocType: DocType = input.docType;
    if (input.docType === "AUTO") {
      finalDocType = strategy.chosenType;
    }
    await db.docVersion.update({
      where: { id: version.id },
      data: {
        strategy: JSON.stringify(strategy),
        docType: finalDocType,
        docTypeReason: strategy.reason,
      },
    });
    yield { type: "doc_type_resolved", docType: finalDocType, reason: strategy.reason };
    yield { type: "stage_complete", stage: "strategy", data: strategy };

    // ---- Stage: generate the document --------------------------------
    yield { type: "stage_start", stage: "generate", label: STAGE_LABELS.generate };
    let priorDocument: string | null = null;
    if (parentVersionId) {
      const parent = await db.docVersion.findUnique({
        where: { id: parentVersionId },
        select: { document: true },
      });
      priorDocument = parent?.document ?? null;
    }
    const { content: document, decision: genDec } = await runText(
      "generate",
      "moderator",
      generateSystem(finalDocType),
      generateUser(
        finalDocType,
        contextMap,
        moderator,
        requirements,
        gapsRisks,
        strategy,
        input.audience,
        undefined,
        priorDocument ?? undefined,
      ),
      providerLog,
    );
    yield emitProvider("generate", genDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { document },
    });
    yield { type: "stage_complete", stage: "generate", data: document };

    // ---- Stage: validate ---------------------------------------------
    yield { type: "stage_start", stage: "validate", label: STAGE_LABELS.validate };
    const { data: validation, decision: valDec } = await runJsonStage<{
      qualityScore: number;
      qualityGates: { gate: string; status: string; note: string }[];
      needsRevision: boolean;
      revisionFocus: { sections: string[]; focus: string } | null;
      strengths: string[];
      weaknesses: string[];
      contradictionsFound: string[];
    }>(
      "validate",
      "qaLead",
      VALIDATE_SYSTEM,
      validateUser(finalDocType, document, requirements, gapsRisks, 0),
      providerLog,
    );
    yield emitProvider("validate", valDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: {
        qualityGates: JSON.stringify(validation.qualityGates ?? []),
        qualityScore: typeof validation.qualityScore === "number" ? validation.qualityScore : null,
      },
    });
    yield { type: "stage_complete", stage: "validate", data: validation };

    // ---- gate checkpoint: after validate -----------------------------
    if (shouldGate("validate")) {
      await saveGateState("validate");
      yield {
        type: "gate_reached",
        stage: "validate",
        versionId: version.id,
        message: "Gate: Validation complete. Review quality gates and approve to finalize.",
      };
      return;
    }

    // ---- Stage: revise (conditional) ---------------------------------
    let finalDocument = document;
    let revised = false;
    if (validation.needsRevision && validation.revisionFocus && MAX_REVISIONS > 0) {
      yield { type: "stage_start", stage: "revise", label: STAGE_LABELS.revise };
      const focusText = `${validation.revisionFocus.focus}\n\nAffected sections: ${validation.revisionFocus.sections.join(", ")}`;
      const { content: revisedDoc, decision: revDec } = await runText(
        "revise",
        "moderator",
        REVISE_SYSTEM,
        reviseUser(document, focusText, requirements),
        providerLog,
      );
      yield emitProvider("revise", revDec);
      finalDocument = revisedDoc;
      revised = true;
      await db.docVersion.update({
        where: { id: version.id },
        data: {
          document: revisedDoc,
          revised: true,
          revisionCount: 1,
          revisionFocus: JSON.stringify(validation.revisionFocus),
        },
      });
      yield { type: "revision_applied", focus: validation.revisionFocus.focus };
      yield { type: "stage_complete", stage: "revise", data: revisedDoc };
    } else {
      yield {
        type: "stage_skipped",
        stage: "revise",
        reason: validation.needsRevision
          ? "Revision limit reached; reporting remaining weaknesses."
          : "Document passed validation — no revision needed.",
      };
    }

    // ---- Stage: validation council -----------------------------------
    yield { type: "stage_start", stage: "validation_council", label: STAGE_LABELS.validation_council };
    const { data: valCouncil, decision: vcDec } = await runStage(
      "validation_council",
      "qaLead",
      VALIDATION_COUNCIL_SYSTEM,
      validationCouncilUser(finalDocType, finalDocument, requirements),
      providerLog,
    );
    yield emitProvider("validation_council", vcDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { validationCouncil: JSON.stringify(valCouncil) },
    });
    yield { type: "stage_complete", stage: "validation_council", data: valCouncil };

    // ---- Stage: acceptance tests -------------------------------------
    yield { type: "stage_start", stage: "acceptance_tests", label: STAGE_LABELS.acceptance_tests };
    const { data: acceptanceTests, decision: atDec } = await runStage(
      "acceptance_tests",
      "qaLead",
      ACCEPTANCE_TEST_SYSTEM,
      acceptanceTestUser(requirements),
      providerLog,
    );
    yield emitProvider("acceptance_tests", atDec);
    // persist acceptance tests
    if (Array.isArray((acceptanceTests as { tests?: unknown[] })?.tests)) {
      for (const t of (acceptanceTests as { tests: { requirementId?: string; testId?: string; given?: string; when?: string; then?: string; testType?: string }[] }).tests) {
        await db.acceptanceTest.create({
          data: {
            projectId,
            versionId: version.id,
            requirementId: t.requirementId ?? "unknown",
            testId: t.testId ?? "AT-?",
            given: t.given ?? "",
            when: t.when ?? "",
            then: t.then ?? "",
            testType: t.testType ?? "positive",
          },
        });
      }
    }
    yield { type: "stage_complete", stage: "acceptance_tests", data: acceptanceTests };

    // ---- Stage: backlog conversion -----------------------------------
    yield { type: "stage_start", stage: "backlog", label: STAGE_LABELS.backlog };
    const { data: backlog, decision: blDec } = await runStage(
      "backlog",
      "productManager",
      BACKLOG_SYSTEM,
      backlogUser(requirements),
      providerLog,
    );
    yield emitProvider("backlog", blDec);
    // persist backlog items
    const bl = backlog as { epics?: { id?: string; title?: string; description?: string; requirementIds?: string[] }[]; stories?: { id?: string; epicId?: string; title?: string; description?: string; effort?: string; requirementId?: string }[]; tasks?: { id?: string; storyId?: string; title?: string; effort?: string }[]; milestones?: { name?: string; criteria?: string }[] };
    if (Array.isArray(bl?.epics)) {
      for (const e of bl.epics) {
        await db.backlogItem.create({
          data: { projectId, versionId: version.id, itemType: "epic", title: e.title ?? "Untitled epic", description: e.description ?? null, requirementId: (e.requirementIds ?? [])[0] ?? null, priority: "high", effort: "L" },
        });
      }
    }
    if (Array.isArray(bl?.stories)) {
      for (const s of bl.stories) {
        await db.backlogItem.create({
          data: { projectId, versionId: version.id, itemType: "story", title: s.title ?? "Untitled story", description: s.description ?? null, requirementId: s.requirementId ?? null, priority: "medium", effort: s.effort ?? "M" },
        });
      }
    }
    if (Array.isArray(bl?.tasks)) {
      for (const t of bl.tasks) {
        await db.backlogItem.create({
          data: { projectId, versionId: version.id, itemType: "task", title: t.title ?? "Untitled task", priority: "medium", effort: t.effort ?? "S" },
        });
      }
    }
    if (Array.isArray(bl?.milestones)) {
      for (const m of bl.milestones) {
        await db.backlogItem.create({
          data: { projectId, versionId: version.id, itemType: "milestone", title: m.name ?? "Milestone", description: m.criteria ?? null, priority: "high" },
        });
      }
    }
    yield { type: "stage_complete", stage: "backlog", data: backlog };

    // ---- Stage: roadmap intelligence ---------------------------------
    yield { type: "stage_start", stage: "roadmap", label: STAGE_LABELS.roadmap };
    const { data: roadmap, decision: rmDec } = await runStage(
      "roadmap",
      "deliveryManager",
      ROADMAP_SYSTEM,
      roadmapUser(requirements, null),
      providerLog,
    );
    yield emitProvider("roadmap", rmDec);
    // persist roadmap phases
    if (Array.isArray((roadmap as { phases?: unknown[] })?.phases)) {
      for (const p of (roadmap as { phases: { phaseNumber?: number; phaseName?: string; description?: string; features?: string[]; dependencies?: string[]; risks?: string[]; targetDate?: string; confidence?: string; parallelizable?: boolean }[] }).phases) {
        await db.roadmapPhase.create({
          data: {
            projectId,
            phaseNumber: p.phaseNumber ?? 1,
            phaseName: p.phaseName ?? "Phase",
            description: p.description ?? null,
            contents: JSON.stringify({ features: p.features ?? [], dependencies: p.dependencies ?? [], risks: p.risks ?? [], parallelizable: p.parallelizable ?? false }),
            targetDate: p.targetDate ?? null,
            confidence: p.confidence ?? "medium",
          },
        });
      }
    }
    yield { type: "stage_complete", stage: "roadmap", data: roadmap };

    // ---- Stage: evaluation -------------------------------------------
    yield { type: "stage_start", stage: "evaluation", label: STAGE_LABELS.evaluation };
    const { data: evaluation, decision: evalDec } = await runStage(
      "evaluation",
      "qaLead",
      buildEvaluationSystemPrompt(finalDocType),
      buildEvaluationUserPrompt(finalDocType, finalDocument, validation),
      providerLog,
    );
    yield emitProvider("evaluation", evalDec);
    // persist evaluation
    const evalResult = evaluation as { rubricScores?: unknown; overallScore?: number; results?: unknown; recommendations?: unknown; benchmarkMode?: string };
    await db.evaluation.create({
      data: {
        projectId,
        versionId: version.id,
        docType: finalDocType,
        rubricScores: JSON.stringify(evalResult.rubricScores ?? []),
        overallScore: typeof evalResult.overallScore === "number" ? evalResult.overallScore : 0,
        results: JSON.stringify(evalResult.results ?? {}),
        recommendations: JSON.stringify(evalResult.recommendations ?? {}),
        benchmarkMode: "rubric",
      },
    });
    yield { type: "stage_complete", stage: "evaluation", data: evaluation };

    // ---- Stage: cost estimation --------------------------------------
    yield { type: "stage_start", stage: "cost_estimate", label: STAGE_LABELS.cost_estimate };
    const { data: costEstimate, decision: costDec } = await runStage(
      "cost_estimate",
      "deliveryManager",
      COST_ESTIMATE_SYSTEM,
      costEstimateUser(contextMap, requirements),
      providerLog,
    );
    yield emitProvider("cost_estimate", costDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { costEstimate: JSON.stringify(costEstimate) },
    });
    yield { type: "stage_complete", stage: "cost_estimate", data: costEstimate };

    // ---- Stage: sprint planning --------------------------------------
    yield { type: "stage_start", stage: "sprint_plan", label: STAGE_LABELS.sprint_plan };
    const { data: sprintPlan, decision: spDec } = await runStage(
      "sprint_plan",
      "deliveryManager",
      SPRINT_PLAN_SYSTEM,
      sprintPlanUser(contextMap, requirements, costEstimate),
      providerLog,
    );
    yield emitProvider("sprint_plan", spDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { sprintPlan: JSON.stringify(sprintPlan) },
    });
    yield { type: "stage_complete", stage: "sprint_plan", data: sprintPlan };

    // ---- Stage: architecture simulation ------------------------------
    yield { type: "stage_start", stage: "arch_simulation", label: STAGE_LABELS.arch_simulation };
    const { data: archSim, decision: asDec } = await runStage(
      "arch_simulation",
      "solutionsArchitect",
      ARCH_SIM_SYSTEM,
      archSimUser(contextMap, requirements),
      providerLog,
    );
    yield emitProvider("arch_simulation", asDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { archSimulation: JSON.stringify(archSim) },
    });
    yield { type: "stage_complete", stage: "arch_simulation", data: archSim };

    // ---- Stage: scenario simulation ----------------------------------
    yield { type: "stage_start", stage: "scenario_simulation", label: STAGE_LABELS.scenario_simulation };
    const { data: scenarios, decision: scDec } = await runStage(
      "scenario_simulation",
      "moderator",
      SCENARIO_SYSTEM,
      scenarioUser(contextMap, requirements, archSim),
      providerLog,
    );
    yield emitProvider("scenario_simulation", scDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { scenarioSimulation: JSON.stringify(scenarios) },
    });
    // persist scenarios
    if (Array.isArray((scenarios as { scenarios?: unknown[] })?.scenarios)) {
      for (const s of (scenarios as { scenarios: { question?: string; implications?: unknown; recommendation?: string }[] }).scenarios) {
        await db.scenario.create({
          data: {
            projectId,
            question: s.question ?? "Untitled",
            implications: JSON.stringify(s.implications ?? {}),
            recommendation: s.recommendation ?? null,
          },
        });
      }
    }
    yield { type: "stage_complete", stage: "scenario_simulation", data: scenarios };

    // ---- Stage: metadata (traceability) ------------------------------
    yield { type: "stage_start", stage: "metadata", label: STAGE_LABELS.metadata };
    const { data: metadata, decision: metaDec } = await runStage(
      "metadata",
      "moderator",
      METADATA_SYSTEM,
      metadataUser(finalDocType, finalDocument, requirements, gapsRisks, revised),
      providerLog,
    );
    yield emitProvider("metadata", metaDec);

    let changedSections: { added: string[]; removed: string[]; changed: string[] } | null = null;
    let changeSummary =
      (metadata.changeSummary as string) ??
      (parentVersionId
        ? `Version ${versionNumber}: refined requirements and regenerated document.`
        : `Version ${versionNumber}: initial generation.`);
    if (parentVersionId && priorDocument) {
      const diff = diffDocuments(priorDocument, finalDocument);
      changedSections = {
        added: diff.sections.filter((s) => s.status === "added").map((s) => s.heading),
        removed: diff.sections.filter((s) => s.status === "removed").map((s) => s.heading),
        changed: diff.sections.filter((s) => s.status === "changed").map((s) => s.heading),
      };
      if (changedSections.added.length || changedSections.changed.length) {
        changeSummary += ` Changed: ${changedSections.changed.join(", ") || "none"}. Added: ${changedSections.added.join(", ") || "none"}.`;
      }
    }

    await db.docVersion.update({
      where: { id: version.id },
      data: {
        traceability: JSON.stringify(metadata.traceability ?? []),
        assumptions: JSON.stringify(metadata.assumptions ?? []),
        confidence: JSON.stringify(metadata.confidence ?? {}),
        openQuestions: JSON.stringify(metadata.openQuestions ?? []),
        nextActions: JSON.stringify(metadata.nextActions ?? []),
        changeSummary,
        changedSections: changedSections ? JSON.stringify(changedSections) : null,
        providerLog: JSON.stringify(providerLog),
      },
    });
    yield { type: "stage_complete", stage: "metadata", data: metadata };

    // ---- Stage: decision journal -------------------------------------
    yield { type: "stage_start", stage: "decision_journal", label: STAGE_LABELS.decision_journal };
    const { data: decisionJournal, decision: djDec } = await runStage(
      "decision_journal",
      "moderator",
      DECISION_JOURNAL_SYSTEM,
      decisionJournalUser(moderator, strategy, valCouncil),
      providerLog,
    );
    yield emitProvider("decision_journal", djDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { decisionJournal: JSON.stringify(decisionJournal) },
    });
    // persist decisions to the project's decision journal
    if (Array.isArray((decisionJournal as { decisions?: unknown[] })?.decisions)) {
      for (const dec of (decisionJournal as { decisions: { decision?: string; rationale?: string; alternativesConsidered?: unknown; tradeoffs?: string[]; supportedBy?: string[]; objectedBy?: unknown; confidence?: string; affectedDocuments?: string[] }[] }).decisions) {
        await db.decisionJournal.create({
          data: {
            projectId,
            versionId: version.id,
            decision: dec.decision ?? "",
            rationale: dec.rationale ?? "",
            alternativesConsidered: JSON.stringify(dec.alternativesConsidered ?? []),
            tradeoffs: JSON.stringify(dec.tradeoffs ?? []),
            supportedBy: JSON.stringify(dec.supportedBy ?? []),
            objectedBy: JSON.stringify(dec.objectedBy ?? []),
            confidence: dec.confidence ?? null,
            affectedDocuments: JSON.stringify(dec.affectedDocuments ?? []),
          },
        });
      }
    }
    yield { type: "stage_complete", stage: "decision_journal", data: decisionJournal };

    // ---- Stage: AI voting --------------------------------------------
    yield { type: "stage_start", stage: "ai_voting", label: STAGE_LABELS.ai_voting };
    const { data: aiVoting, decision: avDec } = await runStage(
      "ai_voting",
      "moderator",
      AI_VOTING_SYSTEM,
      aiVotingUser(moderator, decisionJournal),
      providerLog,
    );
    yield emitProvider("ai_voting", avDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { aiVoting: JSON.stringify(aiVoting) },
    });
    yield { type: "stage_complete", stage: "ai_voting", data: aiVoting };

    // ---- Stage: knowledge graph --------------------------------------
    yield { type: "stage_start", stage: "knowledge_graph", label: STAGE_LABELS.knowledge_graph };
    const { data: knowledgeGraph, decision: kgDec } = await runStage(
      "knowledge_graph",
      "solutionsArchitect",
      KNOWLEDGE_GRAPH_SYSTEM,
      knowledgeGraphUser(contextMap, requirements, metadata),
      providerLog,
    );
    yield emitProvider("knowledge_graph", kgDec);
    await db.docVersion.update({
      where: { id: version.id },
      data: { knowledgeGraph: JSON.stringify(knowledgeGraph) },
    });
    // persist knowledge graph nodes + edges to the project
    const kg = knowledgeGraph as { nodes?: { id: string; type: string; label: string; metadata?: unknown }[]; edges?: { source: string; target: string; relation: string }[] };
    if (Array.isArray(kg.nodes)) {
      // clear old nodes for this project (graph is rebuilt per version)
      await db.knowledgeEdge.deleteMany({ where: { projectId } });
      await db.knowledgeNode.deleteMany({ where: { projectId } });
      for (const node of kg.nodes) {
        await db.knowledgeNode.create({
          data: {
            projectId,
            nodeType: node.type,
            label: node.label,
            metadata: JSON.stringify(node.metadata ?? {}),
            sourceVersionId: version.id,
          },
        });
      }
      // re-insert edges with resolved node ids (match by label since KG ids are local)
      if (Array.isArray(kg.edges)) {
        const nodeByLocalId = new Map(kg.nodes.map((n) => [n.id, n.label]));
        const dbNodes = await db.knowledgeNode.findMany({ where: { projectId } });
        const dbNodeByLabel = new Map(dbNodes.map((n) => [n.label, n.id]));
        for (const edge of kg.edges) {
          const sourceLabel = nodeByLocalId.get(edge.source) ?? edge.source;
          const targetLabel = nodeByLocalId.get(edge.target) ?? edge.target;
          const sourceDbId = dbNodeByLabel.get(sourceLabel);
          const targetDbId = dbNodeByLabel.get(targetLabel);
          if (sourceDbId && targetDbId) {
            await db.knowledgeEdge.create({
              data: {
                projectId,
                sourceId: sourceDbId,
                targetId: targetDbId,
                relation: edge.relation,
              },
            });
          }
        }
      }
    }
    yield { type: "stage_complete", stage: "knowledge_graph", data: knowledgeGraph };

    // ---- final status update (save the full provider log + mark complete) ----
    await db.docVersion.update({
      where: { id: version.id },
      data: {
        providerLog: JSON.stringify(providerLog),
        status: "complete",
      },
    });

    // ---- update project memory ---------------------------------------
    const newMemory = deriveMemory(
      contextMap as Record<string, unknown>,
      requirements as Record<string, unknown>,
      gapsRisks as { gaps?: unknown[]; risks?: unknown[] },
      metadata as Record<string, unknown>,
      finalDocument,
    );
    const mergedMemory: ProjectMemory = {
      goals: newMemory.goals,
      stakeholders: newMemory.stakeholders,
      decisions: [...(memory.decisions ?? []), ...newMemory.decisions].slice(-20),
      assumptions: newMemory.assumptions,
      risks: newMemory.risks,
      openQuestions: newMemory.openQuestions,
      priorSummary: newMemory.priorSummary,
    };
    await db.project.update({
      where: { id: projectId },
      data: {
        memory: JSON.stringify(mergedMemory),
        name: (contextMap as { projectName?: string })?.projectName || project.name,
      },
    });

    // ---- build generation manifest (prompt/version tracking) ----------
    const manifest = buildManifest({
      providerMode: await getProviderModeSafe(),
      providerLog,
      activeRoles: ["moderator", "productManager", "businessAnalyst", "solutionsArchitect", "engineeringLead", "qaLead", "securityReviewer", "uxReviewer", "deliveryManager"],
      debateRounds: 2,
      revised,
      qualityScore: typeof validation.qualityScore === "number" ? validation.qualityScore : null,
      validationVerdict: (valCouncil as { consensus?: { overallVerdict?: string } })?.consensus?.overallVerdict ?? null,
      docType: finalDocType,
      docTypeReason: strategy.reason,
      totalStages: STAGE_ORDER.length,
      gateMode,
      startedAt,
    });
    await db.docVersion.update({
      where: { id: version.id },
      data: { generationManifest: JSON.stringify(manifest) },
    });
    yield { type: "manifest_built", manifest };

    void audit({
      action: AuditActions.GENERATE,
      projectId,
      versionId: version.id,
      details: {
        docType: finalDocType,
        versionNumber: version.versionNumber,
        qualityScore: manifest.qualityScore,
        revised,
        gateMode,
      },
    });

    // notify: generation complete
    void notify({
      projectId,
      type: NotificationTypes.GENERATION_COMPLETE,
      title: "Generation complete",
      message: `Version ${version.versionNumber} (${finalDocType}) generated successfully.${revised ? " Document was revised." : ""}`,
      severity: "low",
      details: { versionId: version.id, docType: finalDocType, qualityScore: manifest.qualityScore },
    });

    yield { type: "complete", projectId, versionId: version.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed.";
    await db.docVersion.update({
      where: { id: version.id },
      data: {
        status: "error",
        errorMessage: message,
        providerLog: JSON.stringify(providerLog),
      },
    });
    // notify: generation failed
    void notify({
      projectId,
      type: NotificationTypes.GENERATION_FAILED,
      title: "Generation failed",
      message: `Version ${version.versionNumber} failed: ${message.slice(0, 120)}`,
      severity: "high",
      details: { versionId: version.id, error: message },
    });
    yield { type: "error", message };
  }
}

function buildSourceBundle(
  input: PipelineInput,
  repoIntel: RepoIntelligenceRaw | null,
): SourceBundle {
  if (input.sourceType === "repo") {
    if (!repoIntel) {
      throw new Error("Repository intelligence could not be fetched.");
    }
    const material = [
      `# Repository: ${repoIntel.owner}/${repoIntel.repo}`,
      `URL: ${repoIntel.url}`,
      repoIntel.description ? `Description: ${repoIntel.description}` : "",
      repoIntel.language ? `Primary language: ${repoIntel.language}` : "",
      `Default branch: ${repoIntel.defaultBranch}`,
      repoIntel.topics.length ? `Topics: ${repoIntel.topics.join(", ")}` : "",
      repoIntel.packageHints.length
        ? `Detected stack signals: ${repoIntel.packageHints.join(", ")}`
        : "",
      "",
      "## README",
      repoIntel.readme?.slice(0, 12000) ?? "(no README found)",
      "",
      "## File tree + key files (summarized)",
      summarizeTreeForModel(repoIntel.tree, repoIntel.keyFiles),
    ]
      .filter(Boolean)
      .join("\n");
    return {
      sourceType: "repo",
      sourceDescription: `GitHub repository ${repoIntel.owner}/${repoIntel.repo}`,
      material,
    };
  }

  const textPart = (input.text ?? "").trim();
  if (!textPart && !repoIntel) {
    throw new Error("No source material was provided.");
  }
  const parts: string[] = [];
  if (textPart) {
    parts.push("## Notes / requirements / code provided by the user");
    parts.push(textPart.slice(0, 16000));
  }
  if (repoIntel) {
    parts.push("");
    parts.push(`## Reference repository: ${repoIntel.owner}/${repoIntel.repo}`);
    if (repoIntel.description) parts.push(`Description: ${repoIntel.description}`);
    if (repoIntel.readme) {
      parts.push("");
      parts.push("### README excerpt");
      parts.push(repoIntel.readme.slice(0, 6000));
    }
    parts.push("");
    parts.push("### File tree + key files (summarized)");
    parts.push(summarizeTreeForModel(repoIntel.tree, repoIntel.keyFiles));
  }
  return {
    sourceType: input.sourceType,
    sourceDescription:
      input.sourceType === "mixed"
        ? "User notes + a reference GitHub repository"
        : "User-provided notes, requirements, and/or code",
    material: parts.join("\n"),
  };
}
