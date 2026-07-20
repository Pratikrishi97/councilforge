# Workflow — Gaps & Risks

## Stage
**Stage 5 of 10** — Structured gap and risk intelligence.

## Purpose
Find what is **missing** and what could **fail**. Classify every gap into
one of ten required categories and every risk into one of six required
categories. Be concrete and concise — keep descriptions to one sentence.

## Input requirements
- **Context map** (from `workflows/understand.md`)
- **Requirements** (from `workflows/requirements.md`)
- **Debate + consensus** (from `workflows/debate.md`)

## Required GAP categories (use exactly these labels)
1. `missing_scope`
2. `missing_stakeholders`
3. `missing_requirements`
4. `missing_business_rules`
5. `missing_apis_or_integrations`
6. `missing_validations`
7. `missing_acceptance_criteria`
8. `missing_non_functional_requirements`
9. `missing_rollout_or_dependency_detail`
10. `missing_ownership`

## Required RISK categories (use exactly these labels)
1. `business`
2. `technical`
3. `operational`
4. `security`
5. `delivery`
6. `adoption`

## Output format (JSON)
```json
{
  "gaps": [
    {
      "id": "G-001",
      "category": "missing_scope",
      "description": "string — one sentence",
      "severity": "high" | "medium" | "low",
      "recommendedAction": "string",
      "blocksRelease": false
    }
  ],
  "risks": [
    {
      "id": "R-001",
      "category": "technical",
      "description": "string — one sentence",
      "likelihood": "high" | "medium" | "low",
      "impact": "high" | "medium" | "low",
      "severity": "high" | "medium" | "low",
      "mitigation": "string",
      "owner": "string"
    }
  ],
  "missingItems": ["string"],
  "contradictions": [
    { "a": "string", "b": "string", "resolution": "string" }
  ]
}
```

## Provider routing recommendation
- **Latency profile**: medium (categorization + cross-referencing).
- **Context window**: medium (requirements + debate output).
- **Recommended provider class**: instruction-following providers with
  strong categorization — OpenRouter, Cohere, Mistral La Plateforme,
  Google AI Studio.
- **Strict JSON required**: any provider that drops fields or invents
  categories will fail the validator.

## Validation rules
- Cover **all ten gap categories** where relevant — at least one entry per
  category, or explicitly mark "none identified" in `missingItems`.
- Cover **all six risk categories** where relevant.
- Limit to **2-4 items per category** to keep the response focused.
- `severity` on risks must reflect `likelihood × impact` (e.g.
  high likelihood × high impact → high severity).
- `blocksRelease` is `true` only for gaps that prevent a defensible
  release — not for every high-severity gap.
- `owner` on risks must be a role name (e.g. `"Engineering Lead"`), not a
  person's name (unless the source provides one).
- Every `contradictions` entry must have a `resolution` — even if the
  resolution is "escalate to sponsor".
- No field may invent risks or gaps that aren't traceable to the source,
  the requirements, or the debate.

## Failure modes
- **Generic risks** — "the project might be delayed". Mitigation: require
  a one-sentence description tied to a concrete signal.
- **Missing categories** — model covers 4 of 10 gap categories. Mitigation:
  post-process and re-prompt for the missing categories explicitly.
- **Invented owners** — model assigns risks to named individuals.
  Mitigation: enforce role-name-only owners.
- **`blocksRelease: true` everywhere** — model marks every gap as
  blocking. Mitigation: enforce `blocksRelease: true` only for gaps where
  `severity: "high"` AND `recommendedAction` cannot be completed pre-release.
- **No contradictions** — model finds zero contradictions across the entire
  context. Mitigation: this is usually a sign of shallow reading; re-run
  with the constraint "find at least one contradiction or explicitly state
  why none exist".
