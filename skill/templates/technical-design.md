# Template — Technical Design Doc

> Canonical section structure for a Technical Design Document. The Generate
> stage must produce exactly these `##` headings, in this order.

## Document type metadata
- **ID:** `TECH_DESIGN`
- **Label:** Technical Design Doc
- **Best for:** Architecture, components, interfaces, data flow, APIs,
  deployment.
- **Accent color:** rose

## Canonical section structure (H2 headings, in order)

1. Architecture overview
2. Problem statement
3. Current system
4. Proposed solution
5. Components
6. Data flow
7. APIs
8. Database changes
9. Security
10. Observability
11. Deployment
12. Failure modes
13. Testing approach
14. Tradeoffs
15. Rollout strategy

## Section guidance

### 1. Architecture overview
- One-paragraph summary of the design.
- A Mermaid diagram showing the major components and their relationships
  (C4-context or component diagram).
- Architecture style label (modular monolith / microservices / serverless /
  event-driven).

### 2. Problem statement
- The technical problem this design solves.
- Constraints (scale, latency, cost, team, time, existing systems).

### 3. Current system
- How it works today. Be specific — include a diagram if helpful.
- Pain points, bottlenecks, tech debt relevant to this design.
- Mark `Confirmed` / `Inferred` / `Assumption`.

### 4. Proposed solution
- The design at a conceptual level.
- Why this approach over alternatives (tie to §14 Tradeoffs).
- Key decisions and their rationale.

### 5. Components
- Each component: name, responsibility, owner (team), tech stack,
  dependencies, API surface.
- Use a table or one H3 per component.

### 6. Data flow
- How data moves through the system end-to-end.
- Use a Mermaid sequence or flowchart diagram.
- Cover the happy path AND at least one failure path.

### 7. APIs
- Each API endpoint or event: name, method, request schema, response
  schema, auth, rate limit, versioning.
- Use fenced code blocks for JSON schemas.
- Specify the error contract.

### 8. Database changes
- Schema changes (tables, columns, indexes, migrations).
- Data migrations and backfill strategy.
- Rollback plan for schema changes.
- Use fenced code blocks for DDL.

### 9. Security
- Threat model summary (assets, actors, trust boundaries).
- Authentication, authorization, session management.
- Data protection (encryption at rest, in transit, PII handling).
- Audit logging.
- Mark `Confirmed` / `Inferred` / `Assumption`.

### 10. Observability
- Metrics, logs, traces — what is captured, where it goes, retention.
- Dashboards and alerts (with thresholds and on-call routing).
- SLOs and error budgets.

### 11. Deployment
- Environments (dev / staging / prod).
- CI/CD pipeline.
- Infrastructure-as-code references.
- Release strategy (blue-green, canary, feature flags).

### 12. Failure modes
- Top failure scenarios: trigger, detection, impact, recovery.
- Use a table. Include at least: dependency outage, region failure, data
  corruption, traffic spike.

### 13. Testing approach
- Test pyramid: unit, integration, contract, e2e, load, chaos.
- Coverage targets per layer.
- Test data strategy.

### 14. Tradeoffs
- Alternatives considered, why rejected.
- Explicit tradeoffs accepted (latency vs. cost, consistency vs.
  availability, build vs. buy).
- Use a table.

### 15. Rollout strategy
- Phased rollout plan with gates between phases.
- Feature-flag strategy.
- Rollback plan and rollback-verification.
- Communication plan.

## Output rules
- Markdown only.
- At least two Mermaid diagrams (architecture overview in §1, data flow
  in §6 — additional diagrams encouraged).
- At least three tables (components, failure modes, tradeoffs).
- Fenced code blocks for all schemas, DDL, and pseudo-APIs.
- Inline labels: `Confirmed`, `Inferred`, `Assumption`, `Risk`, `Gap`,
  `Open Question`, `Recommendation`.
- Do **not** include the assumptions / confidence / open-questions metadata
  sections — those belong in the metadata stage.

## Common mistakes to avoid
- Architecture overview without a diagram.
- APIs without an error contract.
- Database changes without a rollback plan.
- Failure modes that cover only "the dependency is down" — also cover
  data corruption, partial failure, and traffic spikes.
- Observability that lists tools but not SLOs or alert thresholds.
- Tradeoffs section that justifies the chosen approach without honestly
  weighing the rejected alternatives.
- Rollout strategy that ships to 100% on day one with no gates.
- Security section that lists controls without a threat model.
