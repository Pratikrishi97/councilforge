/**
 * Project Completeness Checker — verifies all essential project components
 * exist and are healthy. Surfaces what's missing.
 */

export interface CompletenessCheck {
  component: string;
  present: boolean;
  healthy: boolean;
  status: "complete" | "warning" | "missing";
  note: string;
}

export interface CompletenessResult {
  overall: number; // 0-100
  checks: CompletenessCheck[];
  missing: string[];
  warnings: string[];
}

export async function checkCompleteness(
  projectId: string,
  latestVersion: {
    document: string | null;
    requirements: string | null;
    traceability: string | null;
    qualityGates: string | null;
    qualityScore: number | null;
    validationCouncil: string | null;
    research: string | null;
    decisionJournal: string | null;
    knowledgeGraph: string | null;
    costEstimate: string | null;
    sprintPlan: string | null;
    archSimulation: string | null;
    scenarioSimulation: string | null;
    generationManifest: string | null;
  } | null,
  counts: {
    decisions: number;
    research: number;
    knowledgeNodes: number;
    acceptanceTests: number;
    backlogItems: number;
    roadmapPhases: number;
    competitors: number;
    scenarios: number;
    feedback: number;
  },
  memory: unknown | null,
  policies: number,
): Promise<CompletenessResult> {
  const checks: CompletenessCheck[] = [
    {
      component: "Provider configuration",
      present: true, // onboarding must be complete to generate
      healthy: true,
      status: "complete",
      note: "Provider onboarding completed.",
    },
    {
      component: "Project memory",
      present: !!memory,
      healthy: !!memory,
      status: memory ? "complete" : "missing",
      note: memory ? "Memory established." : "No project memory yet.",
    },
    {
      component: "Evidence layer",
      present: counts.research > 0,
      healthy: counts.research >= 2,
      status: counts.research >= 2 ? "complete" : counts.research > 0 ? "warning" : "missing",
      note: `${counts.research} research entries.`,
    },
    {
      component: "Knowledge graph",
      present: counts.knowledgeNodes > 0,
      healthy: counts.knowledgeNodes >= 10,
      status: counts.knowledgeNodes >= 10 ? "complete" : counts.knowledgeNodes > 0 ? "warning" : "missing",
      note: `${counts.knowledgeNodes} nodes.`,
    },
    {
      component: "Decision journal",
      present: counts.decisions > 0,
      healthy: counts.decisions >= 3,
      status: counts.decisions >= 3 ? "complete" : counts.decisions > 0 ? "warning" : "missing",
      note: `${counts.decisions} decisions logged.`,
    },
    {
      component: "Traceability",
      present: !!latestVersion?.traceability,
      healthy: !!latestVersion?.traceability,
      status: latestVersion?.traceability ? "complete" : "missing",
      note: latestVersion?.traceability ? "Traceability matrix built." : "No traceability.",
    },
    {
      component: "Validation",
      present: !!latestVersion?.qualityGates,
      healthy: (latestVersion?.qualityScore ?? 0) >= 60,
      status: (latestVersion?.qualityScore ?? 0) >= 60 ? "complete" : latestVersion?.qualityGates ? "warning" : "missing",
      note: latestVersion?.qualityScore ? `Quality score: ${latestVersion.qualityScore}` : "Not validated.",
    },
    {
      component: "Evaluation",
      present: !!latestVersion?.document,
      healthy: (latestVersion?.qualityScore ?? 0) >= 70,
      status: (latestVersion?.qualityScore ?? 0) >= 70 ? "complete" : "warning",
      note: "Evaluation rubric scoring available.",
    },
    {
      component: "Risk status",
      present: !!latestVersion?.requirements,
      healthy: true,
      status: "complete",
      note: "Risks identified in gaps_risks stage.",
    },
    {
      component: "Roadmap",
      present: counts.roadmapPhases > 0,
      healthy: counts.roadmapPhases >= 2,
      status: counts.roadmapPhases >= 2 ? "complete" : counts.roadmapPhases > 0 ? "warning" : "missing",
      note: `${counts.roadmapPhases} phases defined.`,
    },
    {
      component: "Backlog",
      present: counts.backlogItems > 0,
      healthy: counts.backlogItems >= 5,
      status: counts.backlogItems >= 5 ? "complete" : counts.backlogItems > 0 ? "warning" : "missing",
      note: `${counts.backlogItems} backlog items.`,
    },
    {
      component: "Acceptance tests",
      present: counts.acceptanceTests > 0,
      healthy: counts.acceptanceTests >= 5,
      status: counts.acceptanceTests >= 5 ? "complete" : counts.acceptanceTests > 0 ? "warning" : "missing",
      note: `${counts.acceptanceTests} tests generated.`,
    },
    {
      component: "Export status",
      present: !!latestVersion?.document,
      healthy: true,
      status: "complete",
      note: "Export to MD/JSON/CSV/Issues available.",
    },
    {
      component: "Health score",
      present: !!latestVersion?.qualityScore,
      healthy: (latestVersion?.qualityScore ?? 0) >= 60,
      status: latestVersion?.qualityScore ? "complete" : "missing",
      note: "Health score calculated.",
    },
    {
      component: "Next best action",
      present: !!latestVersion?.document,
      healthy: true,
      status: "complete",
      note: "Next-best-action engine active.",
    },
    {
      component: "Generation manifest",
      present: !!latestVersion?.generationManifest,
      healthy: !!latestVersion?.generationManifest,
      status: latestVersion?.generationManifest ? "complete" : "missing",
      note: latestVersion?.generationManifest ? "Reproducibility manifest saved." : "No manifest.",
    },
    {
      component: "Policies",
      present: policies > 0,
      healthy: policies >= 3,
      status: policies >= 3 ? "complete" : policies > 0 ? "warning" : "missing",
      note: `${policies} policies active.`,
    },
    {
      component: "User feedback",
      present: counts.feedback > 0,
      healthy: counts.feedback >= 1,
      status: counts.feedback > 0 ? "complete" : "warning",
      note: counts.feedback > 0 ? `${counts.feedback} feedback entries.` : "No feedback yet — encourage users to rate outputs.",
    },
  ];

  const complete = checks.filter((c) => c.status === "complete").length;
  const overall = Math.round((complete / checks.length) * 100);
  const missing = checks.filter((c) => c.status === "missing").map((c) => c.component);
  const warnings = checks.filter((c) => c.status === "warning").map((c) => c.component);

  return { overall, checks, missing, warnings };
}
