# Adapter — Kiro

> How to install and use the Requirements Intelligence Council skill in
> **Kiro** (AWS's spec-driven AI IDE).

## Platform summary
- **Vendor:** AWS
- **Project-instruction file:** `.kiro/steering/*.md` (steering files)
  and `.kiro/specs/*.md` (spec files)
- **Skill file format consumed:** Markdown (native)
- **Multi-turn orchestration:** Yes — Kiro is spec-driven and runs
  multi-stage workflows natively.
- **Sub-agent support:** Yes via Kiro's hook + spec system.
- **Native JSON mode:** Depends on the configured model.

## Works as-is?
🟡 **Needs minor adaptation.** Kiro's spec-driven model maps cleanly to
the skill's pipeline stages, but the multi-role Debate must be sequenced
manually via Kiro's hook system or by chaining spec files.

## Setup — step by step

### 1. Place the skill package
```bash
cp -r /path/to/skill /your/project/docs/skill
```

### 2. Create a steering file
`.kiro/steering/requirements-council.md`:
```markdown
# Requirements Intelligence Council

This project uses the Requirements Intelligence Council skill for any
document-generation task (PRD, BRD, FRD, SOW, Tech Design, Audit).

Read and follow: docs/skill/SKILL.md

When asked to produce a document, run the 10-stage pipeline defined in
docs/skill/workflows/. Load role prompts from docs/skill/roles/. Use
templates from docs/skill/templates/.
```

### 3. Map pipeline stages to Kiro specs
Create a spec per stage, or one master spec that runs all stages:

`.kiro/specs/run-council-pipeline.md`:
```markdown
---
name: run-council-pipeline
description: Run the Requirements Intelligence Council pipeline
---

## Steps

1. **Understand** — read the input, produce context map per
   docs/skill/workflows/understand.md. Save to .kiro/output/context-map.json
2. **Debate Round 1** — for each role in docs/skill/roles/ (except
   moderator and compliance), produce the Round 1 JSON. Save each to
   .kiro/output/debate-r1-<role>.json
3. **Debate Round 2** — each role sees Round 1, produces Round 2 JSON.
4. **Moderator synthesis** — load docs/skill/roles/moderator.md, produce
   consensus JSON.
5. **Requirements** — per docs/skill/workflows/requirements.md.
6. **Gaps & Risks** — per docs/skill/workflows/gaps-risks.md.
7. **Strategy** — per docs/skill/workflows/strategy.md.
8. **Generate** — load docs/skill/templates/<doc-type>.md, produce the
   document.
9. **Validate** — per docs/skill/workflows/validate.md. Revise once if
   needed.
10. **Metadata** — produce traceability, assumptions, confidence,
    open questions, next actions.

## Output
- The final document as Markdown at .kiro/output/document.md
- The metadata JSON at .kiro/output/metadata.json
```

### 4. Configure hooks (optional, for automation)
`.kiro/hooks/pre-generate.json`:
```json
{
  "trigger": "before_generate",
  "action": "ensure_stages_complete",
  "required": ["context-map", "debate", "requirements", "gaps-risks", "strategy"]
}
```

### 5. Configure the model
In Kiro's settings, set the model to one with ≥ 128K context. Kiro
supports AWS Bedrock (Claude family), Amazon Q, and OpenAI-compatible
endpoints.

### 6. Run the pipeline
```
kiro spec run run-council-pipeline --input docs/skill/examples/sample-input.md
```

### 7. Test the install
Diff the output against `docs/skill/examples/sample-output-prd.md`.

## Recommended stage → model mapping
Kiro routes through AWS Bedrock by default. Recommended:

| Stage             | Recommended Bedrock model            |
|-------------------|--------------------------------------|
| Understand        | Claude Sonnet 4.5 (long context)     |
| Debate (per role) | Claude Haiku (cheap, fast)           |
| Moderator         | Claude Sonnet 4.5                    |
| Requirements      | Claude Sonnet 4.5                    |
| Gaps & Risks      | Claude Sonnet 4.5                    |
| Strategy          | Claude Haiku                         |
| Generate          | Claude Sonnet 4.5 / Opus (quality)   |
| Validate          | Claude Sonnet 4.5                    |

## Limitations
- **Debate parallelism.** Kiro's spec system runs steps sequentially by
  default. To parallelize Round 1, write a hook that spawns concurrent
  calls, or accept the wall-clock cost.
- **No native provider routing to non-Bedrock providers.** Kiro is
  Bedrock-first. To use Groq / Google AI Studio / Cohere, configure
  them as custom OpenAI-compatible endpoints in Kiro's provider settings.
- **Spec files are verbose.** The 10-stage pipeline requires either one
  large spec or ten small ones; both have tradeoffs.
- **JSON output reliability.** Bedrock's Claude models support JSON mode
  but occasionally wrap output in prose. Post-process to extract.

## One-shot fallback
If spec orchestration is too heavy, collapse to a single Kiro prompt:
```
Read docs/skill/SKILL.md, docs/skill/roles/*.md,
docs/skill/templates/prd.md, docs/skill/validators/quality-score.md.
Then produce a complete PRD for this input:
<contents of docs/skill/examples/sample-input.md>
```

## Tips
- Use Kiro's steering files for always-on loading of `SKILL.md`.
- Save intermediate stage outputs to `.kiro/output/` so you can re-run
  later stages without re-running earlier ones.
- For long repos, run the Understand stage once, save the context map,
  and re-use across multiple document-type requests.

## Troubleshooting
| Symptom                                  | Cause / fix                                       |
|------------------------------------------|---------------------------------------------------|
| Steering file ignored                    | Restart Kiro; ensure file is in `.kiro/steering/` |
| Spec step fails mid-pipeline             | Check `.kiro/output/` for partial outputs; resume from failed step |
| JSON wrapped in prose                    | Add explicit "Return only JSON" to the spec step   |
| Bedrock model context too small          | Switch to Claude Sonnet (200K) or use a Bedrock-provisioned long-context model |
