# Workflow — Decision Journal

## Stage
**Stage 10 of 10** — Persistent decision log. **Optional** augmentation,
but recommended for every run.

## Purpose
Produce an append-only, durable record of every decision made during the
pipeline: what was decided, why, what alternatives were considered, who
decided, when, and the status. The decision journal is what makes the
output **defensible** — future readers can reconstruct *why* the team
landed where it did.

## Input requirements
- **Debate + consensus** (from `workflows/debate.md`) — primary source of
  decisions
- **Strategy** (from `workflows/strategy.md`) — the document-type decision
- **Validation council** (from `workflows/validate.md`) — verdict decisions
- **Prior decision journal** (optional, for version upgrades)
- **Timestamp** — when this run executed

## Output format (JSON)
```json
{
  "projectId": "string",
  "version": "string — semver or date-stamped",
  "generatedAt": "ISO 8601 timestamp",
  "decisions": [
    {
      "id": "D-001",
      "decision": "string — the decision made, declarative",
      "context": "string — why this decision was needed",
      "alternatives": [
        { "option": "string", "whyRejected": "string" }
      ],
      "rationale": "string — why the chosen option won",
      "decidedBy": "roleName | \"council\" | \"moderator\" | \"user\"",
      "status": "proposed" | "accepted" | "superseded" | "withdrawn" | "deferred",
      "supersededBy": "decisionId | null",
      "deferredTo": "string | null — person, role, or future condition",
      "impact": ["string — what this decision affects"],
      "recordedAt": "ISO 8601 timestamp"
    }
  ],
  "changeLog": [
    { "version": "string", "change": "string", "changedAt": "ISO 8601 timestamp" }
  ]
}
```

## Provider routing recommendation
- **Latency profile**: low (small, structured output).
- **Context window**: small-medium (debate output + strategy + council).
- **Recommended provider class**: any low-latency instruction-following
  provider — Groq, Cerebras, SambaNova, Vercel AI Gateway, Cloudflare
  Workers AI.
- **Critical**: strict JSON output; append-only semantics must be preserved.

## Validation rules
- Every decision in `consensus.keyDecisionsNeeded` (from the moderator
  synthesis) must appear as an entry with `status: "accepted"` or
  `status: "deferred"`.
- Every `alternatives` array must have ≥ 1 entry — a decision with no
  considered alternatives wasn't really a decision.
- `rationale` must reference at least one concrete signal from the debate
  or context map.
- `decidedBy: "council"` decisions must have `rationale` summarizing the
  moderator's synthesis.
- Deferred decisions must have a non-null `deferredTo`.
- Superseded decisions must have a non-null `supersededBy` pointing to a
  valid decision ID.
- `changeLog` must include an entry for the current version.
- No field may invent decisions that don't trace to a pipeline stage.

## Failure modes
- **Empty alternatives** — model records a decision with no considered
  alternatives. Mitigation: enforce ≥ 1 alternative per decision.
- **Generic rationale** — "this was the best option". Mitigation: require
  a reference to a concrete signal.
- **Missing deferred decisions** — model marks everything `accepted` and
  drops the deferred ones. Mitigation: cross-check against the moderator
  synthesis `unresolvedDisagreements`.
- **Non-append-only updates** — model rewrites prior decisions instead of
  superseding. Mitigation: enforce `status: "superseded"` + `supersededBy`
  for any change to an existing decision.
- **No changeLog entry** — model skips the changeLog. Mitigation: enforce
  a changeLog entry per version.
