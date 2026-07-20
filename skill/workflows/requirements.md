# Workflow — Requirements

## Stage
**Stage 4 of 10** — Requirement discovery with inference engine.

## Purpose
Derive a structured requirement set from the context map, hypotheses, and
council consensus. Apply an **inference engine**: for every user-facing
capability mentioned or implied, infer the standard supporting requirements
that teams typically need but may not state. Mark inferred items
`inferred: true`.

## Input requirements
- **Context map** (from `workflows/understand.md`)
- **Hypotheses** (optional)
- **Debate + consensus** (from `workflows/debate.md`)

## Inference engine — capability → typical needs

Apply judgment, non-exhaustive:

| Capability                | Typical supporting needs                                       |
|---------------------------|----------------------------------------------------------------|
| Authentication / login    | Password policy, forgot/reset, account lockout, MFA, session timeout, audit logging, role permissions, email verification |
| Payments                  | Pricing model, refunds, invoicing, idempotency, PCI scope      |
| Search                    | Filters, ranking, pagination, empty states, SLA                |
| Notifications             | Preferences, opt-out, retry, templating                        |
| File upload               | Type/size validation, storage, quota, access control           |
| Admin / config            | Role-based access, change audit, feature flags                 |
| Integrations / API        | Auth, rate limiting, versioning, error contract, retry         |
| Reporting / analytics     | Metric definitions, filters, export, access control           |

## Output format (JSON)
```json
{
  "functionalNeeds": [
    {
      "id": "F-001",
      "statement": "string — under 20 words",
      "capability": "string",
      "inferred": false,
      "confirmed": true,
      "priority": "must" | "should" | "could",
      "source": "explicit" | "inferred" | "memory"
    }
  ],
  "nonFunctionalNeeds": [
    {
      "id": "NF-001",
      "category": "performance" | "scalability" | "security" | "reliability" | "observability" | "accessibility" | "compliance" | "other",
      "statement": "string",
      "target": "string — measurable, e.g. 'p95 < 200ms'",
      "inferred": false
    }
  ],
  "businessRules": ["string"],
  "userFlows": [
    { "name": "string", "actor": "string", "steps": ["string"] }
  ],
  "edgeCases": ["string"],
  "exceptionHandling": ["string"],
  "acceptanceCriteria": [
    { "id": "AC-001", "given": "string", "when": "string", "then": "string", "requirementId": "F-001" }
  ],
  "reportingAndAnalytics": ["string"],
  "rolloutNeeds": ["string"],
  "permissionsAndRoles": [
    { "role": "string", "capabilities": ["string"] }
  ],
  "coverage": {
    "confirmedCount": 0,
    "inferredCount": 0,
    "mustCount": 0,
    "shouldCount": 0,
    "couldCount": 0
  }
}
```

## Provider routing recommendation
- **Latency profile**: medium (instruction-following heavy).
- **Context window**: medium (debate output + context map).
- **Recommended provider class**: strong instruction-following providers —
  OpenRouter (route to Claude/GPT/Gemini), Cohere, Mistral La Plateforme,
  Google AI Studio.
- **Avoid**: tiny-context providers (Cloudflare Workers AI at 8K) — the
  debate + context input won't fit.
- **Critical**: provider must support strict JSON output, or the validator
  will reject the stage.

## Validation rules
- 15-25 functional needs; 8-12 non-functional needs. Not 5, not 50.
- Every functional need must have an `id`, `statement` (≤ 20 words),
  `capability`, `priority`, and `source`.
- Every non-functional need must have a measurable `target`. "Fast" is not
  a target; "p95 < 200ms" is.
- Every acceptance criterion must be Given/When/Then and link via
  `requirementId` to a functional need.
- At least one acceptance criterion per `must`-priority functional need.
- `coverage.confirmedCount + coverage.inferredCount` must equal the total
  number of functional needs (sanity check).
- Inferred needs must have `inferred: true` and `source: "inferred"`.
- No field may invent stakeholders, metrics, or business rules not
  supported by the source or the inference engine.

## Failure modes
- **Exhaustive listing** — model lists every trivial variation. Mitigation:
  enforce 15-25 / 8-12 caps.
- **Untestable acceptance criteria** — "the system should work well".
  Mitigation: reject any `then` clause without an observable condition.
- **Inferred items unmarked** — model infers but sets `inferred: false`.
  Mitigation: post-process; cross-reference `source` field.
- **No non-functional needs** — model focuses only on features.
  Mitigation: require at least one need per category where relevant.
