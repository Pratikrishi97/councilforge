# Adapter — Codex (OpenAI)

> How to install and use the Requirements Intelligence Council skill in
> OpenAI's **Codex** CLI (the agentic coding CLI successor to the
> original OpenAI Codex).

## Platform summary
- **Vendor:** OpenAI
- **Project-instruction file:** `AGENTS.md` (project root)
- **Skill file format consumed:** Markdown (native)
- **Multi-turn orchestration:** Yes — Codex runs as a stateful CLI agent.
- **Sub-agent support:** Yes via `codex exec` subprocess calls or shell
  scripts that spawn parallel `codex` runs.
- **Native JSON mode:** Yes (OpenAI models support `response_format`).

## Works as-is?
🟡 **Needs minor adaptation.** The skill runs, but the 10-stage pipeline
must be orchestrated by a shell script that calls `codex exec` per stage
and pipes JSON between calls. Codex does not natively sequence multi-role
debates.

## Setup — step by step

### 1. Install Codex CLI
```bash
npm install -g @openai/codex
# or
brew install codex
```
Authenticate with your OpenAI API key.

### 2. Place the skill package
```bash
cp -r /path/to/skill /your/project/docs/skill
```

### 3. Reference it from `AGENTS.md`
In your project root, create or edit `AGENTS.md`:
```markdown
# Project agents

## Requirements Intelligence Council
This project uses the Requirements Intelligence Council skill for any
document-generation task (PRD, BRD, FRD, SOW, Tech Design, Audit).

Read and follow: docs/skill/SKILL.md

When asked to produce a document, run the full 10-stage pipeline defined
in docs/skill/workflows/. Load role prompts from docs/skill/roles/.
```

### 4. Set the model
```bash
codex config set model gpt-5
# or for cheaper Debate rounds:
codex config set model gpt-5-mini
```

### 5. Write an orchestration script
Codex does not natively parallelize the Debate stage. Write a small
shell script that runs each stage and pipes the JSON output to the next:

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT="$1"
DOCS=docs/skill

# Stage 1 — Understand
codex exec --output-format json \
  "$(cat $DOCS/workflows/understand.md)" \
  "Input: $(cat $INPUT)" > /tmp/context-map.json

# Stage 3a — Debate Round 1 (sequential; could be parallelized with &)
for ROLE in product-manager business-analyst solutions-architect \
            engineering-lead qa-lead security-reviewer ux-reviewer \
            delivery-manager; do
  codex exec --output-format json \
    "$(cat $DOCS/roles/$ROLE.md)" \
    "Context: $(cat /tmp/context-map.json)" \
    > /tmp/debate-r1-$ROLE.json
done

# ... continue through stages 3b, 3c, 4, 5, 6, 7, 8
```

Run with: `./run-pipeline.sh docs/skill/examples/sample-input.md`

### 6. Test the install
Run the script on the sample input and diff against
`docs/skill/examples/sample-output-prd.md`.

## Recommended stage → model mapping

| Stage             | Recommended OpenAI model          |
|-------------------|-----------------------------------|
| Understand        | gpt-5 (long context)              |
| Debate (per role) | gpt-5-mini (cheap, fast)          |
| Moderator         | gpt-5                             |
| Requirements      | gpt-5                             |
| Gaps & Risks      | gpt-5                             |
| Strategy          | gpt-5-mini                        |
| Generate          | gpt-5 (quality-critical)          |
| Validate          | gpt-5                             |

Use `codex exec --model <model>` per stage to vary.

## Limitations
- **No native parallelism.** Debate Round 1 has 8 independent calls; you
  must background them with `&` and `wait` in the shell script. Codex
  itself runs sequentially.
- **No native provider routing.** Codex only talks to OpenAI. To route
  to Groq / Google AI Studio / Cohere, use the Next.js reference app or
  a custom orchestrator that calls those providers' APIs directly.
- **`AGENTS.md` is read once per session.** Changes mid-session require
  a restart.
- **JSON output reliability.** Use `--output-format json` to enforce
  JSON on stages that require it (Requirements, Gaps/Risks, Validate).
  Even so, GPT-5-mini occasionally wraps JSON in prose — post-process
  to extract.
- **Cost.** The full pipeline is ~25-30 model calls. On GPT-5, expect
  $0.50-$2 per run depending on context size.

## One-shot fallback
If orchestration is too complex, collapse to a single prompt:
```bash
codex exec \
  "$(cat docs/skill/SKILL.md docs/skill/roles/*.md docs/skill/templates/prd.md docs/skill/validators/quality-score.md)" \
  "Produce a PRD for this input: $(cat docs/skill/examples/sample-input.md)"
```
Quality drops but the structure survives.

## Tips
- Cache the Understand output to a file and re-use across multiple
  document-type requests on the same input.
- Use `codex exec --model gpt-5-mini` for Debate and Validate to cut
  cost by ~80%.
- For long repos, use a model with ≥ 128K context (GPT-5 standard) —
  GPT-5-mini may truncate.

## Troubleshooting
| Symptom                                  | Cause / fix                                       |
|------------------------------------------|---------------------------------------------------|
| `AGENTS.md` ignored                      | Restart Codex; ensure file is in project root      |
| JSON wrapped in prose                    | Add "Return a single JSON object and nothing else" |
| Pipeline times out                       | Switch Debate and Validate to gpt-5-mini           |
| Parallel `&` calls fail                  | Ensure each `codex exec` writes to a unique temp file |
