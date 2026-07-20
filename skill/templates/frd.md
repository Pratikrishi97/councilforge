# Template — FRD (Functional Requirements Doc)

> Canonical section structure for a Functional Requirements Document. The
> Generate stage must produce exactly these `##` headings, in this order.

## Document type metadata
- **ID:** `FRD`
- **Label:** Functional Requirements Doc
- **Best for:** Functional behavior, validations, business rules, system
  responses.
- **Accent color:** cyan

## Canonical section structure (H2 headings, in order)

1. Overview
2. Functional scope
3. Actor roles
4. Workflows
5. Business rules
6. Field validations
7. Exceptions
8. Notifications
9. Permissions
10. Audit logging
11. Reports
12. Acceptance criteria

## Section guidance

### 1. Overview
- What system or capability this FRD specifies.
- Relationship to the parent PRD/BRD if one exists.
- Scope boundary in one paragraph.

### 2. Functional scope
- In-scope capabilities (bullet list).
- Out-of-scope capabilities (explicit — every "yes" is a "no").
- Mark each `Confirmed` / `Inferred` / `Assumption`.

### 3. Actor roles
- Every actor that interacts with the system: end users, admins,
  integrations, background jobs.
- For each: role, capabilities, authentication method.
- Use a table.

### 4. Workflows
- 3-8 functional workflows, each with a name, actor, and ordered steps.
- Use a Mermaid flowchart or sequence diagram for the most complex flow.
- Cover the happy path AND at least one exception path per workflow.

### 5. Business rules
- Enumerated list. Each rule: ID, statement, source, enforcement point
  (UI / API / data layer / batch).
- Use a table.

### 6. Field validations
- Per field: name, type, required, format, min/max, custom validation,
  error message.
- Use a table. Cover both UI and API validation.

### 7. Exceptions
- Enumerated exception scenarios.
- For each: trigger, system response, user-facing message, recovery path.
- Use a table.

### 8. Notifications
- Each notification: trigger, channel (email / push / in-app / SMS),
  template, opt-out, retry policy.
- Use a table.

### 9. Permissions
- Role × capability matrix.
- Use a table. Mark `Confirmed` / `Inferred` / `Assumption`.

### 10. Audit logging
- What events are logged: actor, action, target, timestamp, outcome.
- Retention period, access control, tamper-evidence.
- Use a table or bullet list.

### 11. Reports
- Each report: name, purpose, filters, audience, cadence, export format.
- Use a table.

### 12. Acceptance criteria
- Given/When/Then format, one per functional requirement.
- Each AC links to a requirement or workflow.
- Use a table or structured bullet list.

## Output rules
- Markdown only.
- At least one Mermaid diagram (workflow in §4).
- At least four tables (actor roles, business rules, field validations,
  permissions).
- Inline labels: `Confirmed`, `Inferred`, `Assumption`, `Risk`, `Gap`,
  `Open Question`, `Recommendation`.
- Do **not** include the assumptions / confidence / open-questions metadata
  sections — those belong in the metadata stage.

## Common mistakes to avoid
- Field validations that say "validate email" without specifying the regex
  or the error message.
- Exceptions that say "show error" without the user-facing message or
  recovery path.
- Permissions matrix that omits the API layer (only checks UI).
- Audit logging without retention or tamper-evidence.
- Workflows that cover only the happy path.
- Business rules without an enforcement point.
- Acceptance criteria that aren't testable.
