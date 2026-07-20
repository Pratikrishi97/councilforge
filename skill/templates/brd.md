# Template — BRD (Business Requirements Doc)

> Canonical section structure for a Business Requirements Document. The
> Generate stage must produce exactly these `##` headings, in this order.

## Document type metadata
- **ID:** `BRD`
- **Label:** Business Requirements Doc
- **Best for:** Business need, stakeholder goals, process change,
  organizational impact.
- **Accent color:** amber

## Canonical section structure (H2 headings, in order)

1. Title
2. Business context
3. Objectives
4. Current state
5. Future state
6. Stakeholders
7. Process changes
8. Business rules
9. Assumptions
10. Dependencies
11. Risks
12. Approvals
13. Success measures
14. Open issues

## Section guidance

### 1. Title
`# <Initiative Name> — Business Requirements Doc`
Include version, sponsor, status, date.

### 2. Business context
- The business situation driving this initiative.
- Market, regulatory, competitive, or internal pressures.
- What happens if we do nothing.

### 3. Objectives
- 3-5 business objectives, each with a measurable target.
- Tie each to a higher-level company goal or OKR.
- Mark `Confirmed` / `Inferred` / `Assumption`.

### 4. Current state
- How things work today. Be specific and honest, not aspirational.
- Baseline metrics (cost, time, error rate, satisfaction).
- Pain points with evidence.

### 5. Future state
- How things will work after the initiative.
- Target metrics with deltas from current state.
- Use a Mermaid flowchart to contrast current vs. future.

### 6. Stakeholders
- All stakeholders: sponsors, beneficiaries, payers, disruptees,
  veto-holders.
- For each: role, what they want, what they fear, influence level.
- Use a table.

### 7. Process changes
- What workflow changes for humans (not just the system).
- Training, change management, transition period.
- Use a Mermaid sequence diagram for the new process.

### 8. Business rules
- Enumerated list of business rules (regulatory, contractual,
  operational, policy).
- Each rule: ID, statement, source (regulation / contract / policy /
  inferred), enforcement point.

### 9. Assumptions
- Assumptions underpinning the business case.
- Each assumption: statement, impact if wrong, validation plan.
- Use a table.

### 10. Dependencies
- Internal initiatives, external partners, regulatory changes, hiring.
- Mark each with owner and risk.

### 11. Risks
- Top business / adoption / operational risks.
- Use a table: likelihood, impact, severity, mitigation, owner.

### 12. Approvals
- Required sign-offs: sponsor, finance, legal, compliance, security.
- Approval criteria and SLA per approver.

### 13. Success measures
- The metrics that prove the business objectives in §3 were met.
- Baseline, target, measurement cadence, owner.
- Use a table.

### 14. Open issues
- Unresolved business questions.
- Each: question, why it matters, who decides, blocks-what.

## Output rules
- Markdown only.
- At least one Mermaid diagram (current vs. future state in §5, or new
  process in §7).
- At least three tables (stakeholders, business rules, risks).
- Inline labels: `Confirmed`, `Inferred`, `Assumption`, `Risk`, `Gap`,
  `Open Question`, `Recommendation`.
- Do **not** include the assumptions / confidence / open-questions metadata
  sections — those belong in the metadata stage.

## Common mistakes to avoid
- Aspirational current state ("today, users struggle") instead of
  measurable baseline.
- Objectives without targets ("improve efficiency").
- Missing silent stakeholders (the people disrupted by the change).
- Business rules buried in feature descriptions instead of enumerated.
- Process changes that ignore human workflow and training.
- Approvals listed without criteria or SLA.
- Success measures that are vanity metrics.
