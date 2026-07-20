# Template — PRD (Product Requirements Doc)

> Canonical section structure for a Product Requirements Document. The
> Generate stage must produce exactly these `##` headings, in this order.
> Source of truth for the structure; content is filled by the pipeline.

## Document type metadata
- **ID:** `PRD`
- **Label:** Product Requirements Doc
- **Best for:** Product behavior, user needs, features, flows, measurable
  outcomes.
- **Accent color:** emerald

## Canonical section structure (H2 headings, in order)

1. Title
2. Summary
3. Problem statement
4. Goals
5. Non-goals
6. Personas
7. User journeys
8. Requirements
9. Success metrics
10. Analytics
11. Dependencies
12. Risks
13. Rollout plan
14. Open questions
15. Acceptance criteria

## Section guidance

### 1. Title
`# <Product Name> — Product Requirements Doc`
Include version, owner, status (Draft / In Review / Approved), and date.

### 2. Summary
2-4 sentences. What is this product, who is it for, what changes in this
release. Concrete language; no marketing fluff.

### 3. Problem statement
- The specific problem being solved.
- Evidence the problem exists (data, user research, support tickets,
  business impact).
- Who feels the pain today and how.

### 4. Goals
- 3-5 measurable goals for this release.
- Each goal must have a success threshold (e.g. "reduce time-to-first-value
  from 8 min to under 3 min").
- Mark each `Confirmed` / `Inferred` / `Assumption`.

### 5. Non-goals
- Explicit list of what is **out of scope** for this release.
- State why each is excluded (deferred, deprioritized, not aligned).

### 6. Personas
- Primary persona (one) and secondary personas (1-3).
- For each: role, context, goals, frustrations, success definition.
- Use a table.

### 7. User journeys
- 2-5 end-to-end journeys from entry to value to confirmation.
- Include at least one Mermaid sequence or flowchart diagram.
- Name the actor, the steps, and the success state.

### 8. Requirements
- Functional needs (15-25), grouped by capability.
- Non-functional needs (8-12), grouped by category.
- Each requirement has an ID, priority (must/should/could), and source
  label (Confirmed / Inferred / Assumption).
- Use bullet lists; use a table for the priority summary.

### 9. Success metrics
- The metrics that prove the goals in §4 were met.
- Each metric: definition, baseline, target, measurement cadence, owner.
- Use a table.

### 10. Analytics
- Events to instrument.
- Funnels and dashboards to build.
- Data retention and privacy considerations.

### 11. Dependencies
- Internal teams, external services, data sources, prior features that
  must ship first.
- Mark each dependency with owner and risk if delayed.

### 12. Risks
- Top 5-10 risks with likelihood, impact, severity, mitigation, owner.
- Use a table. Pull from the gaps/risks stage output.

### 13. Rollout plan
- Phased rollout (internal → beta → GA → 100%).
- Feature flags, canary percentage, rollback triggers.
- Communication plan: who is told what, when.

### 14. Open questions
- Unresolved questions that need a decision before or during delivery.
- For each: the question, why it matters, who decides, blocks-what.
- Use a table or bullet list.

### 15. Acceptance criteria
- Given/When/Then format, one per must-priority requirement.
- Each AC links to its requirement ID.
- Use a table or structured bullet list.

## Output rules
- Markdown only.
- At least one Mermaid diagram (in §7 User journeys or §13 Rollout plan).
- At least three tables (personas, requirements summary, risks).
- Inline labels: `Confirmed`, `Inferred`, `Assumption`, `Risk`, `Gap`,
  `Open Question`, `Recommendation`.
- Do **not** include assumptions / confidence / open-questions-as-metadata
  sections — those belong in the metadata stage, not the PRD body.

## Common mistakes to avoid
- Stub problem statement ("we want to improve the user experience").
- Goals without thresholds.
- Non-goals omitted (every "yes" is a "no" — make the "no"s explicit).
- Personas that are "everyone".
- Requirements without IDs or priorities.
- Success metrics that are vanity metrics (signups) instead of health
  metrics (retention, task completion).
- Risks without owners.
- Rollout plan that's "ship to 100% on day one".
- Acceptance criteria that aren't testable.
