import type { DocType } from "./doc-types";
import { getDocType } from "./doc-types";

/**
 * Evaluation Engine — rubric-based scoring of generated documents.
 * Each document type has its own rubric. The engine scores each criterion
 * and produces an overall quality assessment.
 */

export interface RubricCriterion {
  criterion: string;
  weight: number; // 0-1, sum of all weights = 1
  description: string;
}

export interface RubricScore {
  criterion: string;
  weight: number;
  score: number; // 0-100
  status: "pass" | "warning" | "fail";
  note: string;
}

export interface EvaluationResult {
  rubricScores: RubricScore[];
  overallScore: number;
  results: {
    passed: string[];
    warnings: string[];
    failed: string[];
  };
  recommendations: {
    improved: string[];
    needsWork: string[];
  };
  benchmarkMode: "rubric" | "golden" | "synthetic" | "prior" | "feedback" | "human";
}

/** Rubrics per document type. */
const RUBRICS: Record<string, RubricCriterion[]> = {
  PRD: [
    { criterion: "Problem clarity", weight: 0.12, description: "Problem statement is specific, measurable, and user-centered." },
    { criterion: "Goal specificity", weight: 0.10, description: "Goals are SMART and tied to business outcomes." },
    { criterion: "Persona completeness", weight: 0.08, description: "Personas are realistic with needs and behaviors." },
    { criterion: "Requirement testability", weight: 0.15, description: "Each requirement has clear acceptance criteria." },
    { criterion: "Scope boundaries", weight: 0.10, description: "Non-goals and out-of-scope are explicit." },
    { criterion: "Success metrics", weight: 0.10, description: "Metrics are measurable with targets." },
    { criterion: "Risk coverage", weight: 0.10, description: "Key risks identified with mitigations." },
    { criterion: "Traceability", weight: 0.10, description: "Requirements trace to goals and acceptance criteria." },
    { criterion: "Rollout realism", weight: 0.08, description: "Rollout plan is phased and achievable." },
    { criterion: "Clarity & tone", weight: 0.07, description: "Writing is clear, professional, decision-ready." },
  ],
  BRD: [
    { criterion: "Business context", weight: 0.15, description: "Business need is clearly articulated." },
    { criterion: "Stakeholder identification", weight: 0.12, description: "All stakeholders identified with interests." },
    { criterion: "Process change clarity", weight: 0.12, description: "Current vs future state is clear." },
    { criterion: "Business rules", weight: 0.12, description: "Rules are specific and actionable." },
    { criterion: "Success measures", weight: 0.10, description: "KPIs are measurable." },
    { criterion: "Risk coverage", weight: 0.10, description: "Business risks identified." },
    { criterion: "Assumption clarity", weight: 0.10, description: "Assumptions are explicit." },
    { criterion: "Approval readiness", weight: 0.09, description: "Document is ready for sign-off." },
    { criterion: "Clarity & tone", weight: 0.10, description: "Writing is clear and professional." },
  ],
  FRD: [
    { criterion: "Functional scope", weight: 0.12, description: "All functional behaviors covered." },
    { criterion: "Actor roles", weight: 0.10, description: "All actors and permissions defined." },
    { criterion: "Workflow completeness", weight: 0.12, description: "All workflows documented." },
    { criterion: "Business rules", weight: 0.12, description: "Rules are specific and testable." },
    { criterion: "Field validations", weight: 0.12, description: "Validations are complete." },
    { criterion: "Exception handling", weight: 0.10, description: "Error cases covered." },
    { criterion: "Acceptance criteria", weight: 0.12, description: "Given/When/Then for key functions." },
    { criterion: "Clarity & tone", weight: 0.10, description: "Writing is clear and professional." },
  ],
  SOW: [
    { criterion: "Scope clarity", weight: 0.15, description: "Deliverables are specific and bounded." },
    { criterion: "Out-of-scope", weight: 0.10, description: "Exclusions are explicit." },
    { criterion: "Timeline realism", weight: 0.12, description: "Milestones are achievable." },
    { criterion: "Role clarity", weight: 0.10, description: "Responsibilities are assigned." },
    { criterion: "Assumptions", weight: 0.10, description: "Assumptions are explicit." },
    { criterion: "Acceptance criteria", weight: 0.12, description: "Sign-off criteria are measurable." },
    { criterion: "Change control", weight: 0.08, description: "Change process defined." },
    { criterion: "Risk coverage", weight: 0.10, description: "Delivery risks identified." },
    { criterion: "Clarity & tone", weight: 0.13, description: "Writing is clear and professional." },
  ],
  TECH_DESIGN: [
    { criterion: "Architecture clarity", weight: 0.15, description: "Architecture is well-described." },
    { criterion: "Component design", weight: 0.12, description: "Components and responsibilities clear." },
    { criterion: "Data flow", weight: 0.12, description: "Data flow is documented." },
    { criterion: "API design", weight: 0.12, description: "APIs are specified." },
    { criterion: "Security", weight: 0.12, description: "Security considerations covered." },
    { criterion: "Failure modes", weight: 0.10, description: "Failure scenarios analyzed." },
    { criterion: "Deployment", weight: 0.10, description: "Deployment strategy defined." },
    { criterion: "Tradeoffs", weight: 0.09, description: "Design tradeoffs explained." },
    { criterion: "Clarity & tone", weight: 0.08, description: "Writing is clear and professional." },
  ],
  AUDIT: [
    { criterion: "Coverage", weight: 0.15, description: "All areas audited." },
    { criterion: "Finding specificity", weight: 0.15, description: "Findings are specific and actionable." },
    { criterion: "Severity accuracy", weight: 0.12, description: "Severities are appropriate." },
    { criterion: "Recommendations", weight: 0.15, description: "Recommendations are practical." },
    { criterion: "Evidence", weight: 0.12, description: "Findings are evidence-backed." },
    { criterion: "Priority order", weight: 0.10, description: "Prioritization is sound." },
    { criterion: "Clarity & tone", weight: 0.11, description: "Writing is clear and professional." },
  ],
  ROADMAP: [
    { criterion: "Vision clarity", weight: 0.12, description: "Product vision is clear." },
    { criterion: "Phase sequencing", weight: 0.15, description: "Phases are logically ordered." },
    { criterion: "Milestone clarity", weight: 0.12, description: "Milestones are specific." },
    { criterion: "Dependency mapping", weight: 0.13, description: "Dependencies are identified." },
    { criterion: "Risk coverage", weight: 0.12, description: "Risks per phase identified." },
    { criterion: "Success measures", weight: 0.12, description: "Success metrics per phase." },
    { criterion: "Clarity & tone", weight: 0.14, description: "Writing is clear and professional." },
  ],
  GAP_ANALYSIS: [
    { criterion: "Current state", weight: 0.15, description: "Current state is well-described." },
    { criterion: "Gap inventory", weight: 0.15, description: "Gaps are comprehensive." },
    { criterion: "Impact analysis", weight: 0.15, description: "Impact of each gap is clear." },
    { criterion: "Root causes", weight: 0.12, description: "Root causes identified." },
    { criterion: "Recommendations", weight: 0.15, description: "Recommendations are practical." },
    { criterion: "Priority matrix", weight: 0.13, description: "Prioritization is sound." },
    { criterion: "Clarity & tone", weight: 0.15, description: "Writing is clear and professional." },
  ],
};

const DEFAULT_RUBRIC: RubricCriterion[] = [
  { criterion: "Completeness", weight: 0.20, description: "All essential sections present." },
  { criterion: "Clarity", weight: 0.15, description: "Writing is clear and unambiguous." },
  { criterion: "Testability", weight: 0.15, description: "Requirements are testable." },
  { criterion: "Consistency", weight: 0.15, description: "No contradictions." },
  { criterion: "Traceability", weight: 0.15, description: "Items trace to business goals." },
  { criterion: "Risk coverage", weight: 0.10, description: "Risks identified." },
  { criterion: "Clarity & tone", weight: 0.10, description: "Professional quality." },
];

export function getRubric(docType: string): RubricCriterion[] {
  return RUBRICS[docType] ?? DEFAULT_RUBRIC;
}

/**
 * Build the evaluation prompt for the LLM. The LLM scores each criterion
 * against the document and returns structured results.
 */
export function buildEvaluationSystemPrompt(docType: string): string {
  const rubric = getRubric(docType);
  const cfg = getDocType(docType as DocType);
  const rubricText = rubric
    .map(
      (r, i) =>
        `${i + 1}. ${r.criterion} (weight: ${r.weight}) — ${r.description}`,
    )
    .join("\n");

  return `You are the Evaluation Engine of an CouncilForge. You evaluate a generated ${cfg.label} against a rubric.

RUBRIC (score each criterion 0-100):
${rubricText}

Return a single JSON object (no other text):
{
  "rubricScores": [{ "criterion": string, "weight": number, "score": number, "status": "pass"|"warning"|"fail", "note": string }],
  "overallScore": number,
  "results": { "passed": [string], "warnings": [string], "failed": [string] },
  "recommendations": { "improved": [string], "needsWork": [string] }
}
- score >= 80 → "pass", 60-79 → "warning", < 60 → "fail"
- overallScore is the weighted average of criterion scores
- Be honest and specific. Cite concrete issues in notes.`;
}

export function buildEvaluationUserPrompt(
  docType: string,
  document: string,
  qualityGates: unknown,
): string {
  return `DOCUMENT TYPE: ${docType}

GENERATED DOCUMENT (Markdown):
${document.slice(0, 12000)}

QUALITY GATES (from validation):
${JSON.stringify(qualityGates, null, 2).slice(0, 2000)}

Evaluate the document against the rubric. Produce the JSON now.`;
}
