# Template — SOW (Statement of Work)

> Canonical section structure for a Statement of Work. The Generate stage
> must produce exactly these `##` headings, in this order.

## Document type metadata
- **ID:** `SOW`
- **Label:** Statement of Work
- **Best for:** Scope, deliverables, roles, timeline, commercial execution.
- **Accent color:** violet

## Canonical section structure (H2 headings, in order)

1. Project overview
2. Engagement objective
3. Scope of work
4. In scope
5. Out of scope
6. Deliverables
7. Timeline
8. Roles and responsibilities
9. Assumptions
10. Dependencies
11. Acceptance criteria
12. Change control
13. Commercial notes
14. Risks
15. Sign-off criteria

## Section guidance

### 1. Project overview
- The engagement in 2-4 sentences.
- Client, vendor, engagement type (fixed-bid / T&M / retainer).
- Reference to the master agreement if one exists.

### 2. Engagement objective
- The single most important outcome this SOW delivers.
- How success will be judged (tie to §15 Sign-off criteria).

### 3. Scope of work
- Narrative description of the work to be performed.
- Phases or workstreams at a high level.
- Mark `Confirmed` / `Inferred` / `Assumption`.

### 4. In scope
- Bulleted list of specific deliverables, activities, and services
  included.

### 5. Out of scope
- Explicit list of what is excluded — every ambiguity here becomes a
  change order later.

### 6. Deliverables
- Each deliverable: ID, name, description, format, owner, acceptance
  criteria reference.
- Use a table.

### 7. Timeline
- Milestones (not just dates) — each milestone is a verifiable outcome.
- Use a Gantt-style table or a Mermaid Gantt diagram.
- Include dependencies between milestones.

### 8. Roles and responsibilities
- RACI matrix: who is Responsible, Accountable, Consulted, Informed per
  workstream.
- Use a table. Include both vendor and client roles.

### 9. Assumptions
- Assumptions underpinning the scope, timeline, and price.
- Each: statement, impact if wrong, who validates.
- Use a table.

### 10. Dependencies
- Client-provided inputs, third-party deliverables, prior-phase outputs.
- Each: dependency, owner, risk if delayed.

### 11. Acceptance criteria
- Per deliverable: what "done" looks like, objectively verifiable.
- Use a table or structured bullet list.

### 12. Change control
- How change requests are submitted, evaluated, approved, and priced.
- Who has authority to approve changes.

### 13. Commercial notes
- Pricing model, total price (or range), payment schedule, expenses,
  invoicing terms.
- Currency, taxes, late-payment terms.

### 14. Risks
- Top delivery / commercial / scope risks.
- Use a table: likelihood, impact, severity, mitigation, owner.

### 15. Sign-off criteria
- The conditions that must be met for final acceptance and project close.
- Who signs off, in what order, with what SLA.

## Output rules
- Markdown only.
- At least one Mermaid diagram (Gantt for timeline in §7, or RACI
  visualization in §8).
- At least four tables (deliverables, timeline, RACI, risks).
- Inline labels: `Confirmed`, `Inferred`, `Assumption`, `Risk`, `Gap`,
  `Open Question`, `Recommendation`.
- Do **not** include the assumptions / confidence / open-questions metadata
  sections — those belong in the metadata stage.

## Common mistakes to avoid
- Vague "out of scope" — every ambiguity becomes a change order.
- Deliverables without acceptance criteria.
- Timeline with dates but no verifiable milestones.
- RACI with multiple Accountable parties (should be one per workstream).
- Assumptions buried in prose instead of enumerated.
- No change control process — every change becomes a dispute.
- Commercial notes without payment schedule or late-payment terms.
- Sign-off criteria that aren't objectively verifiable.
