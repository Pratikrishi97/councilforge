/**
 * Cross-Document Impact Propagator — when one artifact changes, identify
 * all impacted downstream artifacts and recommend updates.
 */

export interface ImpactPropagation {
  sourceArtifact: string;
  impactedArtifacts: { artifact: string; impact: string; severity: "high" | "medium" | "low" }[];
  recommendation: string;
}

const IMPACT_GRAPH: Record<string, { artifact: string; impact: string; severity: "high" | "medium" | "low" }[]> = {
  "BRD": [
    { artifact: "PRD", impact: "Product requirements may need updating to reflect business changes", severity: "high" },
    { artifact: "FRD", impact: "Functional requirements derived from BRD need review", severity: "high" },
    { artifact: "SOW", impact: "Scope and deliverables may shift", severity: "medium" },
    { artifact: "Acceptance Tests", impact: "Tests may need new business rule coverage", severity: "medium" },
    { artifact: "Roadmap", impact: "Phasing may need adjustment", severity: "low" },
  ],
  "PRD": [
    { artifact: "FRD", impact: "Functional requirements must be updated to match product changes", severity: "high" },
    { artifact: "SOW", impact: "Scope and timeline may change", severity: "high" },
    { artifact: "Acceptance Tests", impact: "Tests must be regenerated for changed requirements", severity: "high" },
    { artifact: "Backlog", impact: "Epics and stories need regeneration", severity: "high" },
    { artifact: "Roadmap", impact: "Delivery phases may need resequencing", severity: "medium" },
    { artifact: "Cost Estimate", impact: "Effort estimates may change", severity: "medium" },
    { artifact: "Sprint Plan", impact: "Sprint items need updating", severity: "medium" },
    { artifact: "Knowledge Graph", impact: "Requirement nodes need updating", severity: "high" },
    { artifact: "Traceability", impact: "Traceability matrix must be rebuilt", severity: "high" },
  ],
  "FRD": [
    { artifact: "Acceptance Tests", impact: "Tests must be regenerated", severity: "high" },
    { artifact: "Architecture", impact: "Technical design may need review", severity: "medium" },
    { artifact: "Backlog", impact: "Task breakdown may change", severity: "medium" },
  ],
  "Architecture": [
    { artifact: "Risks", impact: "New architecture risks must be assessed", severity: "high" },
    { artifact: "Cost Estimate", impact: "Infrastructure costs may change", severity: "medium" },
    { artifact: "Sprint Plan", impact: "Technical tasks need updating", severity: "medium" },
    { artifact: "Scenario Simulation", impact: "Failure modes need re-simulation", severity: "low" },
  ],
  "Roadmap": [
    { artifact: "Backlog", impact: "Items need re-prioritization per new phases", severity: "high" },
    { artifact: "Sprint Plan", impact: "Sprint sequencing must change", severity: "high" },
    { artifact: "Cost Estimate", impact: "Timeline affects cost", severity: "medium" },
  ],
  "Requirement": [
    { artifact: "Acceptance Tests", impact: "Tests for this requirement need updating", severity: "high" },
    { artifact: "Backlog", impact: "Linked stories/tasks need review", severity: "high" },
    { artifact: "Knowledge Graph", impact: "Graph node needs updating", severity: "high" },
    { artifact: "Traceability", impact: "Traceability row must be rebuilt", severity: "high" },
    { artifact: "Risks", impact: "New requirement may introduce new risks", severity: "medium" },
  ],
  "Policy": [
    { artifact: "Provider Selection", impact: "Provider routing may need to change per policy", severity: "high" },
    { artifact: "All Documents", impact: "Documents may need review for compliance", severity: "medium" },
  ],
  "Decision": [
    { artifact: "All Downstream Documents", impact: "Documents affected by this decision need review", severity: "medium" },
    { artifact: "Knowledge Graph", impact: "Decision node needs updating", severity: "medium" },
    { artifact: "Roadmap", impact: "Roadmap may need adjustment", severity: "low" },
  ],
  "Provider": [
    { artifact: "All Stages", impact: "Provider change affects all routed stages", severity: "medium" },
    { artifact: "Cost Estimate", impact: "Provider cost structure may change", severity: "low" },
  ],
};

export function propagateImpact(sourceArtifact: string): ImpactPropagation {
  const impacts = IMPACT_GRAPH[sourceArtifact] ?? [];
  return {
    sourceArtifact,
    impactedArtifacts: impacts,
    recommendation: impacts.length > 0
      ? `${impacts.length} artifacts are impacted by this ${sourceArtifact} change. Review and regenerate affected items.`
      : "No known downstream impacts.",
  };
}

/** Get all possible source artifacts for the impact UI. */
export function getImpactSources(): string[] {
  return Object.keys(IMPACT_GRAPH);
}
