# Workflow — Understand

## Stage
**Stage 1 of 10** — Context map + repository intelligence.

## Purpose
Read the source material carefully and produce a structured **context map**
plus a deep **repository intelligence** analysis. Extract, do not invent.
Where you infer, mark it `inferred`. This stage sets the factual foundation
for every later stage; sloppy understanding propagates everywhere.

## Input requirements
- **Source bundle** containing:
  - `sourceType`: `"repo" | "text" | "mixed"`
  - `sourceDescription`: free-text description of what the input is
  - `material`: the actual content — repo tree, READMEs, source files,
    pasted notes, specs, business brief
- **Project memory** (optional): goals, stakeholders, terminology, prior
  decisions, known assumptions, open questions, prior summary
- **Token budget**: ensure `material` fits the model context; truncate
  repo trees to the top-N most relevant files if needed and mark truncated.

## Output format (JSON)
```json
{
  "projectName": "string",
  "oneLinePurpose": "string",
  "whatItIs": "string",
  "whoItIsFor": ["string"],
  "whyItExists": "string",
  "problemSolved": "string",
  "whatSuccessLooksLike": ["string"],
  "currentState": "string",
  "futureState": "string",
  "mainWorkflows": ["string"],
  "techStack": ["string"],
  "architectureStyle": "string — short label, e.g. 'Modular monolith'",
  "architectureHints": ["string"],
  "boundedContexts": ["string"],
  "modulesAndFolders": ["string"],
  "uiBackendBoundary": "string",
  "apiOrIntegrationClues": ["string"],
  "authOrAuthzClues": ["string"],
  "dataModelClues": ["string"],
  "configAndEnvClues": ["string"],
  "testCoverageClues": ["string"],
  "deployOrCicdClues": ["string"],
  "techDebtIndicators": ["string"],
  "securityConcerns": ["string"],
  "documentationGaps": ["string"],
  "likelyUserJourneys": [
    { "name": "string", "actor": "string", "steps": ["string"] }
  ],
  "explicitRequirements": ["string"],
  "implicitRequirements": ["string"],
  "likelyMissingInformation": ["string"]
}
```

Every array contains **short, specific bullet strings**. If a field is truly
unknown, return `[]` rather than guessing. Prefix inferred items with
`"(inferred) "` inline.

## Provider routing recommendation
- **Latency profile**: low-medium (this is input-bound, not generation-bound).
- **Context window**: large (≥ 128K preferred; ≥ 32K minimum with truncation).
- **Recommended provider class**: large-context free-tier providers —
  Google AI Studio (1M), Google Vertex AI (1M), Mistral Codestral (256K),
  OpenCode Zen (256K), Cohere (256K), OpenRouter (128K aggregate).
- **Avoid**: tiny-context providers (Cloudflare Workers AI at 8K) unless the
  source is small.

## Validation rules
- `projectName`, `oneLinePurpose`, `whatItIs`, `whoItIsFor` are required
  and must be non-empty.
- Every array entry must be a string ≤ 15 words (enforce concision).
- `architectureStyle` must be a short label, not a paragraph.
- Inferred items must be prefixed with `"(inferred)"`.
- If `sourceType === "repo"` and `techStack` is empty, the stage has failed
  to inspect the material — re-run with deeper extraction.
- If `likelyMissingInformation` is empty, the model is over-confident;
  force at least one entry.
- No field may contain invented metrics, stakeholder names, or timelines
  not supported by the source.

## Failure modes
- **Hallucinated tech stack** — model invents frameworks not in the repo.
  Mitigation: cross-check against file globs in the source material.
- **Generic purpose statement** — "a web application that helps users".
  Mitigation: reject and re-run with the constraint "be specific to this
  source; reference concrete signals".
- **Skipped inference labels** — model lists implicit requirements without
  marking them inferred. Mitigation: post-process and prefix.
