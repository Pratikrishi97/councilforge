# Workflow — Validate

## Stage
**Stage 8 of 10** — Self-critique, quality gates, and revision decision.

## Purpose
Critically evaluate the generated document against ten quality gates.
Decide whether a revision pass is needed. If yes, route to a single
revision pass (Stage 9, optional) targeting the weakest sections. Then
run a multi-role **Validation Council** for the final sign-off.

## Input requirements
- **Document type** (from `workflows/strategy.md`)
- **Generated document** (Markdown, from `workflows/generate.md`)
- **Requirements** (from `workflows/requirements.md`)
- **Gaps & risks** (from `workflows/gaps-risks.md`)
- **Revision count so far** (0 or 1; max 1 revision allowed)

## Sub-stages
| Sub-stage          | What happens                                          |
|--------------------|-------------------------------------------------------|
| 8a Quality gates   | Run 10 gates, produce `pass`/`warn`/`fail` per gate.  |
| 8b Revision decision | If any gate fails or a contradiction is found, set `needsRevision: true`. |
| 8c (Conditional) Revision | Re-generate targeting the weak sections. |
| 8d Validation Council | Five reviewers independently evaluate; produce consensus verdict. |

## Quality gates
1. `completeness` — every template section present and substantive.
2. `consistency` — no internal contradictions; terminology stable.
3. `clarity` — concrete language; minimal jargon; no vague statements.
4. `testability` — every requirement has testable acceptance criteria.
5. `feasibility` — requirements are achievable with stated constraints.
6. `ownership` — every action item, risk, and decision has an owner.
7. `risk_coverage` — risks from Stage 5 are addressed in the document.
8. `scope_boundaries` — non-goals are explicit; scope is bounded.
9. `traceability` — business objective → requirement → feature → AC → test → release item → owner.
10. `document_correctness` — output follows the template structure and Markdown rules.

See `validators/completeness.md`, `validators/consistency.md`, and
`validators/quality-score.md` for detailed gate rules.

## Output format — quality gates (JSON)
```json
{
  "qualityScore": 0,
  "qualityGates": [
    { "gate": "completeness", "status": "pass" | "warn" | "fail", "note": "string — under 15 words" }
  ],
  "needsRevision": false,
  "revisionFocus": { "sections": ["string"], "focus": "string" } | null,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "contradictionsFound": ["string"]
}
```

- `qualityScore` is 0-100.
- `needsRevision: true` **only** when a gate FAILS or a contradiction is
  found.
- Limit revision to the weakest sections; do not request a full rewrite.
- If `revisionCount` is already 1, set `needsRevision: false` and report
  remaining weaknesses as open questions instead.

## Output format — Validation Council (JSON)
```json
{
  "reviews": {
    "qaLead": {
      "issues": [
        { "severity": "high" | "medium" | "low", "issue": "string", "recommendation": "string" }
      ],
      "verdict": "approve" | "approve-with-notes" | "request-changes"
    },
    "securityReviewer": { "issues": [/* same shape */], "verdict": "..." },
    "engineeringLead": { "issues": [/* same shape */], "verdict": "..." },
    "uxReviewer": { "issues": [/* same shape */], "verdict": "..." },
    "deliveryManager": { "issues": [/* same shape */], "verdict": "..." }
  },
  "consensus": {
    "overallVerdict": "approved" | "approved-with-notes" | "changes-requested",
    "criticalIssues": ["string"],
    "recommendations": ["string"],
    "deliveryReady": false
  }
}
```

- Each reviewer's `issues` array has 1-3 items (or empty if none found).
- `deliveryReady` is `true` **only** when `overallVerdict` is `approved` or
  `approved-with-notes` AND there are no high-severity issues.

## Provider routing recommendation
- **Latency profile**: low-medium (gates are quick; council is parallel).
- **Context window**: medium (document + requirements + gaps/risks).
- **Recommended provider class**: low-latency instruction-following
  providers — Groq, Cerebras, SambaNova, Vercel AI Gateway.
- **Critical**: strict JSON output required. Provider must not drop fields.
- **Parallelizable**: the five Validation Council reviewers can run
  concurrently.

## Validation rules
- All 10 gates must be present in `qualityGates`.
- `qualityScore` must be consistent with gate statuses: 0-60 if any `fail`;
  60-80 if any `warn`; 80-100 if all `pass`.
- `needsRevision: true` requires a non-null `revisionFocus`.
- `revisionFocus.sections` must reference real section headings from the
  document.
- If `revisionCount >= 1`, `needsRevision` must be `false`.
- Every Validation Council reviewer must produce a `verdict`.
- `deliveryReady: true` requires zero high-severity issues across all
  reviewers.
- A `request-changes` verdict from Security or Compliance on a
  high-severity issue **must** force `overallVerdict: "changes-requested"`.

## Failure modes
- **All gates pass, score is 100** — model is sycophantic. Mitigation:
  require at least one `warn` or one `weakness` entry.
- **Revision loop never terminates** — model keeps finding new issues.
  Mitigation: enforce `revisionCount` cap of 1.
- **Council rubber-stamps** — every reviewer returns `approve` with no
  issues. Mitigation: require each reviewer to find at least one issue or
  explicitly state "no issues found in my domain".
- **High-severity issue ignored in consensus** — `deliveryReady: true`
  despite a high-severity issue. Mitigation: post-process to enforce the
  rule.
