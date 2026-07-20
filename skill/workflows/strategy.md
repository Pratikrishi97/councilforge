# Workflow — Strategy

## Stage
**Stage 6 of 10** — Document strategy selection.

## Purpose
Decide the **single best document type** for this source material. If the
user has already specified a type, justify it rather than overriding — but
still record the alternatives considered.

## Input requirements
- **Requested type** (`AUTO` or one of `PRD`, `BRD`, `FRD`, `SOW`,
  `TECH_DESIGN`, `AUDIT`, `ROADMAP`, `GAP_ANALYSIS`)
- **Context map** (from `workflows/understand.md`)
- **Gaps & risks** (from `workflows/gaps-risks.md`)

## Strategy selection rules
- **BRD** when the focus is business need, stakeholder goals, process
  change, organizational impact.
- **PRD** when the focus is product behavior, user needs, features, flows,
  measurable outcomes.
- **FRD** when the focus is functional behavior, validations, business
  rules, system responses.
- **SOW** when the focus is scope, deliverables, roles, timeline,
  commercial execution.
- **TECH_DESIGN** when the focus is architecture, components, interfaces,
  data flow, APIs, deployment.
- **AUDIT / GAP_ANALYSIS** when evaluating an existing repo or document
  for quality, readiness, or missing pieces.
- **ROADMAP** when sequencing, milestones, phased delivery, or release
  planning matter more than specification.

## Output format (JSON)
```json
{
  "chosenType": "PRD" | "BRD" | "FRD" | "SOW" | "TECH_DESIGN" | "AUDIT" | "ROADMAP" | "GAP_ANALYSIS",
  "reason": "string — 1-3 sentences referencing concrete signals from the context",
  "alternativesConsidered": [
    { "type": "string", "whyRejected": "string" }
  ],
  "confidence": "high" | "medium" | "low",
  "recommendedCompanionDocs": ["string"]
}
```

## Provider routing recommendation
- **Latency profile**: low (small, decisive call).
- **Context window**: small-to-medium (gaps/risks + context map summary).
- **Recommended provider class**: any instruction-following provider —
  this stage is cheap and decisive. Groq, Cerebras, SambaNova, Vercel AI
  Gateway are ideal (low latency).
- **Avoid**: spending a frontier model budget here. Save the frontier call
  for the Generate stage.

## Validation rules
- `chosenType` must be one of the eight allowed values (never `AUTO` in
  the output — the strategy stage resolves `AUTO` to a concrete type).
- If the user requested a specific type, `chosenType` must usually equal
  the request; only override when a different type is clearly superior and
  explain why in `reason`.
- `reason` must reference **concrete signals** from the context map —
  not generic statements like "this is a product-focused project".
- `alternativesConsidered` must have at least two entries.
- `recommendedCompanionDocs` lists doc types that pair well (e.g. a PRD
  often pairs with a Tech Design).
- `confidence: "low"` requires the `reason` to explicitly state what is
  ambiguous.

## Failure modes
- **Generic reason** — "PRD is the best fit". Mitigation: require a
  reference to a concrete signal from the context map.
- **No alternatives considered** — model picks one without recording
  tradeoffs. Mitigation: enforce ≥ 2 alternatives.
- **Override without justification** — model overrides a user-specified
  type silently. Mitigation: if `chosenType !== requestedType`, the
  `reason` must start with "Overriding user request because...".
- **AUTO in output** — model echoes `AUTO` instead of resolving.
  Mitigation: validator rejects `AUTO` in `chosenType`.
