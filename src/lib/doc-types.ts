/**
 * Document type registry — defines every artifact the skill can produce,
 * including the structure the LLM must follow and metadata for the UI.
 */

export type DocType =
  | "AUTO"
  | "PRD"
  | "BRD"
  | "FRD"
  | "SOW"
  | "TECH_DESIGN"
  | "AUDIT"
  | "ROADMAP"
  | "GAP_ANALYSIS";

export interface DocTypeConfig {
  id: DocType;
  label: string;
  short: string;
  description: string;
  whenToUse: string;
  /** Ordered list of section headings the generated document must contain. */
  structure: string[];
  accent: string; // tailwind text color class for the badge
  icon: string; // lucide icon name (resolved in UI)
}

export const DOC_TYPES: DocTypeConfig[] = [
  {
    id: "AUTO",
    label: "Auto-detect",
    short: "AUTO",
    description:
      "Let the engine infer the best document type from the source material and explain the choice.",
    whenToUse: "Use when the destination artifact is unclear.",
    structure: [
      "Decision rationale",
      "Recommended document type",
      "Brief justification",
    ],
    accent: "text-foreground",
    icon: "Sparkles",
  },
  {
    id: "PRD",
    label: "Product Requirements Doc",
    short: "PRD",
    description:
      "Product behavior, user needs, features, flows, and measurable outcomes.",
    whenToUse:
      "Focus is product behavior, user needs, features, flows, measurable outcomes.",
    structure: [
      "Title",
      "Summary",
      "Problem statement",
      "Goals",
      "Non-goals",
      "Personas",
      "User journeys",
      "Requirements",
      "Success metrics",
      "Analytics",
      "Dependencies",
      "Risks",
      "Rollout plan",
      "Open questions",
      "Acceptance criteria",
    ],
    accent: "text-emerald-600 dark:text-emerald-400",
    icon: "Target",
  },
  {
    id: "BRD",
    label: "Business Requirements Doc",
    short: "BRD",
    description:
      "Business need, stakeholder goals, process change, organizational impact.",
    whenToUse:
      "Focus is business need, stakeholder goals, process change, organizational impact.",
    structure: [
      "Title",
      "Business context",
      "Objectives",
      "Current state",
      "Future state",
      "Stakeholders",
      "Process changes",
      "Business rules",
      "Assumptions",
      "Dependencies",
      "Risks",
      "Approvals",
      "Success measures",
      "Open issues",
    ],
    accent: "text-amber-600 dark:text-amber-400",
    icon: "Briefcase",
  },
  {
    id: "FRD",
    label: "Functional Requirements Doc",
    short: "FRD",
    description:
      "Functional behavior, validations, business rules, system responses.",
    whenToUse:
      "Focus is functional behavior, validations, business rules, system responses.",
    structure: [
      "Overview",
      "Functional scope",
      "Actor roles",
      "Workflows",
      "Business rules",
      "Field validations",
      "Exceptions",
      "Notifications",
      "Permissions",
      "Audit logging",
      "Reports",
      "Acceptance criteria",
    ],
    accent: "text-cyan-600 dark:text-cyan-400",
    icon: "ListChecks",
  },
  {
    id: "SOW",
    label: "Statement of Work",
    short: "SOW",
    description:
      "Scope, deliverables, roles, timeline, assumptions, responsibilities.",
    whenToUse:
      "Focus is scope, deliverables, roles, timeline, commercial execution.",
    structure: [
      "Project overview",
      "Engagement objective",
      "Scope of work",
      "In scope",
      "Out of scope",
      "Deliverables",
      "Timeline",
      "Roles and responsibilities",
      "Assumptions",
      "Dependencies",
      "Acceptance criteria",
      "Change control",
      "Commercial notes",
      "Risks",
      "Sign-off criteria",
    ],
    accent: "text-violet-600 dark:text-violet-400",
    icon: "FileSignature",
  },
  {
    id: "TECH_DESIGN",
    label: "Technical Design Doc",
    short: "TECH",
    description:
      "Architecture, components, interfaces, data flow, APIs, deployment.",
    whenToUse:
      "Focus is architecture, components, interfaces, data flow, APIs, deployment.",
    structure: [
      "Architecture overview",
      "Problem statement",
      "Current system",
      "Proposed solution",
      "Components",
      "Data flow",
      "APIs",
      "Database changes",
      "Security",
      "Observability",
      "Deployment",
      "Failure modes",
      "Testing approach",
      "Tradeoffs",
      "Rollout strategy",
    ],
    accent: "text-rose-600 dark:text-rose-400",
    icon: "Cpu",
  },
  {
    id: "AUDIT",
    label: "Audit / Gap Analysis",
    short: "AUDIT",
    description:
      "Review quality, security, usability, readiness; identify gaps and recommendations.",
    whenToUse:
      "Goal is to review quality, security, usability, consistency, readiness or identify gaps.",
    structure: [
      "Purpose",
      "Source reviewed",
      "Summary findings",
      "Strengths",
      "Gaps",
      "Risks",
      "Recommendations",
      "Priority order",
      "Estimated effort",
      "Next actions",
    ],
    accent: "text-orange-600 dark:text-orange-400",
    icon: "ShieldCheck",
  },
  {
    id: "ROADMAP",
    label: "Roadmap",
    short: "ROAD",
    description:
      "Sequencing, milestones, phased delivery, release planning.",
    whenToUse: "Focus is sequencing, milestones, phased delivery, release planning.",
    structure: [
      "Vision",
      "Themes",
      "Phases",
      "Milestones",
      "Dependencies",
      "Risks",
      "Success measures",
      "Open questions",
    ],
    accent: "text-teal-600 dark:text-teal-400",
    icon: "Map",
  },
  {
    id: "GAP_ANALYSIS",
    label: "Gap Analysis",
    short: "GAP",
    description:
      "Identify what is missing or weak in an existing product or repo.",
    whenToUse:
      "Input describes an existing product or repo; goal is to identify what is missing or weak.",
    structure: [
      "Purpose",
      "Current state assessment",
      "Gap inventory",
      "Impact analysis",
      "Root causes",
      "Recommendations",
      "Priority matrix",
      "Next actions",
    ],
    accent: "text-pink-600 dark:text-pink-400",
    icon: "Search",
  },
];

export const DOC_TYPE_MAP: Record<DocType, DocTypeConfig> = DOC_TYPES.reduce(
  (acc, d) => {
    acc[d.id] = d;
    return acc;
  },
  {} as Record<DocType, DocTypeConfig>,
);

export function getDocType(id: string): DocTypeConfig {
  return DOC_TYPE_MAP[id as DocType] ?? DOC_TYPE_MAP.AUTO;
}

/** Canonical strategy-selection rules — shared by the strategy prompt + UI. */
export const STRATEGY_RULES = `Document strategy selection rules:
- BRD when the focus is business need, stakeholder goals, process change, organizational impact.
- PRD when the focus is product behavior, user needs, features, flows, measurable outcomes.
- FRD when the focus is functional behavior, validations, business rules, system responses.
- SOW when the focus is scope, deliverables, roles, timeline, commercial execution.
- TECH_DESIGN when the focus is architecture, components, interfaces, data flow, APIs, deployment.
- AUDIT / GAP_ANALYSIS when evaluating an existing repo or document for quality, readiness, or missing pieces.
- ROADMAP when sequencing, milestones, phased delivery, or release planning matter more than specification.`;

