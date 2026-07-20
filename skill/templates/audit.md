# Template — Audit / Gap Analysis

> Canonical section structure for an Audit or Gap Analysis document. The
> Generate stage must produce exactly these `##` headings, in this order.
> This template also covers the `ROADMAP` and `GAP_ANALYSIS` document
> types — they share the same structure with slightly different emphasis.

## Document type metadata
- **ID:** `AUDIT` (also used as the base for `ROADMAP` and `GAP_ANALYSIS`)
- **Label:** Audit / Gap Analysis
- **Best for:** Reviewing quality, security, usability, consistency,
  readiness of an existing system, or identifying what is missing or weak.
- **Accent color:** orange

## Variant emphasis
| Variant         | Emphasis                                                       |
|-----------------|----------------------------------------------------------------|
| `AUDIT`         | Broad review: strengths, gaps, risks, recommendations.        |
| `GAP_ANALYSIS`  | Focus on what is missing; root-cause analysis; priority matrix.|
| `ROADMAP`       | Focus on sequencing, milestones, phased delivery.             |

When the strategy stage chooses `ROADMAP` or `GAP_ANALYSIS`, the Generate
stage follows the same section structure below but weights content toward
the variant's emphasis.

## Canonical section structure (H2 headings, in order)

1. Purpose
2. Source reviewed
3. Summary findings
4. Strengths
5. Gaps
6. Risks
7. Recommendations
8. Priority order
9. Estimated effort
10. Next actions

## Section guidance

### 1. Purpose
- Why this audit was commissioned.
- Scope of the review (what is in and out of review).
- Audience (engineering leadership, security, compliance, sponsor).
- Mark `Confirmed` / `Inferred` / `Assumption`.

### 2. Source reviewed
- What was reviewed: repo URL, commit SHA, document version, environment,
  date of review.
- What was NOT reviewed (closed-source dependencies, prod data, etc.).
- Methodology (static analysis, manual review, threat model, automated
  scan).

### 3. Summary findings
- 3-5 headline findings, each one sentence.
- Overall readiness verdict: `Approved` / `Approved with notes` /
  `Changes requested` / `Not ready`.
- Use a Mermaid diagram if the system structure adds clarity.

### 4. Strengths
- What the system does well. Be specific — "good test coverage" should
  cite the coverage percentage.
- 5-10 strengths. Use a bullet list.

### 5. Gaps
- Structured by the 10 gap categories (see `workflows/gaps-risks.md`).
- Each gap: ID, category, description, severity, recommended action,
  blocks-release.
- Use a table.

### 6. Risks
- Structured by the 6 risk categories (see `workflows/gaps-risks.md`).
- Each risk: ID, category, description, likelihood, impact, severity,
  mitigation, owner.
- Use a table.

### 7. Recommendations
- Actionable recommendations grouped by theme (security, performance,
  reliability, maintainability, compliance, UX).
- Each recommendation: what to do, why, expected impact, owner, priority.
- Use a table.

### 8. Priority order
- Recommendations sorted by priority (high / medium / low).
- Use a numbered list or table.
- Explain the prioritization logic.

### 9. Estimated effort
- Per recommendation: effort range (e.g. "2-3 dev-days"), skills required,
  dependencies.
- Use a table.
- State assumptions behind the estimates (team size, velocity).

### 10. Next actions
- The immediate next steps (this week, this sprint).
- Each: action, owner, due date, blocks-what.
- Use a table or bullet list.

## Output rules
- Markdown only.
- At least one Mermaid diagram (system structure in §3 or priority matrix
  visualization in §8).
- At least four tables (gaps, risks, recommendations, estimated effort).
- Inline labels: `Confirmed`, `Inferred`, `Assumption`, `Risk`, `Gap`,
  `Open Question`, `Recommendation`.
- Do **not** include the assumptions / confidence / open-questions metadata
  sections — those belong in the metadata stage.

## Variant-specific guidance

### For `ROADMAP` variant
- §3 Summary findings → "Roadmap summary" with vision and themes.
- §5 Gaps → "Capability gaps" — what capabilities are missing vs. the vision.
- §7 Recommendations → "Initiatives" — each initiative sequenced into a
  phase.
- §8 Priority order → "Phases" — Now / Next / Later or quarter-by-quarter.
- §9 Estimated effort → "Phase effort" — effort per phase.
- §10 Next actions → "Milestones" — verifiable outcomes per phase.
- Include a Mermaid Gantt diagram for the roadmap timeline.

### For `GAP_ANALYSIS` variant
- §3 Summary findings → "Gap summary" with overall gap severity.
- §4 Strengths → keep, but briefer.
- §5 Gaps → expand to include root-cause analysis per gap.
- §6 Risks → risks caused by the gaps.
- §7 Recommendations → "Closure plan" per gap.
- §8 Priority order → "Priority matrix" — impact × urgency 2x2.
- §9 Estimated effort → effort to close each gap.
- §10 Next actions → immediate closure steps.

## Common mistakes to avoid
- Vague findings ("the codebase has technical debt") without specifics.
- Recommendations without owners or effort estimates.
- Gaps not tied to a category — uncategorizable gaps can't be tracked.
- Risks without mitigations.
- No priority order — everything is "high priority".
- Estimated effort as single numbers instead of ranges.
- Next actions without owners or due dates.
- Readiness verdict that contradicts the gap severities.
