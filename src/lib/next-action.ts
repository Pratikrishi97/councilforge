/**
 * Next-Best-Action Engine — suggests the most valuable next action
 * based on the project's current state.
 */

export interface NextAction {
  action: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  category: "context" | "refine" | "validate" | "deliver" | "review" | "export";
}

export interface NextActionInput {
  hasDocument: boolean;
  qualityScore: number | null;
  openQuestionCount: number;
  unresolvedRiskCount: number;
  pendingDecisions: number;
  traceabilityCoverage: number; // 0-100
  hasValidationCouncil: boolean;
  validationVerdict: string | null;
  versionCount: number;
  daysSinceUpdate: number;
  hasBacklog: boolean;
  hasAcceptanceTests: boolean;
}

export function recommendNextActions(input: NextActionInput): NextAction[] {
  const actions: NextAction[] = [];

  // No document yet — start here
  if (!input.hasDocument) {
    actions.push({
      action: "Generate your first document",
      rationale: "No document has been generated yet. Provide source material and run the pipeline.",
      priority: "high",
      category: "context",
    });
    return actions;
  }

  // Stale document
  if (input.daysSinceUpdate > 14) {
    actions.push({
      action: "Generate a new version",
      rationale: `The document is ${input.daysSinceUpdate} days old. Context may have drifted.`,
      priority: "high",
      category: "refine",
    });
  }

  // Low quality score
  if (input.qualityScore !== null && input.qualityScore < 70) {
    actions.push({
      action: "Revise the document",
      rationale: `Quality score is ${input.qualityScore}/100. Address validation failures.`,
      priority: "high",
      category: "refine",
    });
  }

  // Open questions
  if (input.openQuestionCount > 3) {
    actions.push({
      action: `Resolve ${input.openQuestionCount} open questions`,
      rationale: "Too many unresolved questions block decision readiness.",
      priority: "medium",
      category: "review",
    });
  }

  // Unresolved risks
  if (input.unresolvedRiskCount > 0) {
    actions.push({
      action: `Review ${input.unresolvedRiskCount} unresolved risks`,
      rationale: "Risks need mitigations or explicit acceptance.",
      priority: "medium",
      category: "review",
    });
  }

  // Pending decisions
  if (input.pendingDecisions > 0) {
    actions.push({
      action: `Make ${input.pendingDecisions} pending decisions`,
      rationale: "The council flagged decisions that need human input.",
      priority: "medium",
      category: "review",
    });
  }

  // Low traceability
  if (input.traceabilityCoverage < 50) {
    actions.push({
      action: "Improve traceability coverage",
      rationale: "Requirements aren't fully linked to tests and releases.",
      priority: "medium",
      category: "validate",
    });
  }

  // No acceptance tests
  if (!input.hasAcceptanceTests) {
    actions.push({
      action: "Generate acceptance tests",
      rationale: "Tests haven't been generated from requirements yet.",
      priority: "medium",
      category: "validate",
    });
  }

  // No backlog
  if (!input.hasBacklog) {
    actions.push({
      action: "Convert requirements to backlog items",
      rationale: "Turn approved requirements into epics, stories, and tasks.",
      priority: "low",
      category: "deliver",
    });
  }

  // Validation verdict
  if (input.validationVerdict === "changes-requested") {
    actions.push({
      action: "Address validation council feedback",
      rationale: "The validation council requested changes before approval.",
      priority: "high",
      category: "validate",
    });
  }

  // If everything looks good, suggest export
  if (
    input.qualityScore !== null &&
    input.qualityScore >= 75 &&
    input.openQuestionCount <= 3 &&
    input.validationVerdict !== "changes-requested"
  ) {
    actions.push({
      action: "Export to delivery tools",
      rationale: "Document quality is high. Export to Jira/Linear/GitHub or download.",
      priority: "low",
      category: "export",
    });
  }

  // Always suggest a context collection if version count is low
  if (input.versionCount <= 1) {
    actions.push({
      action: "Add more context",
      rationale: "Provide additional notes, repo links, or specs to improve the next version.",
      priority: "low",
      category: "context",
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions.slice(0, 6);
}
