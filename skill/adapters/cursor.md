# Adapter — Cursor

> How to install and use the Requirements Intelligence Council skill in
> **Cursor**.

## Platform summary
- **Vendor:** Anysphere
- **Project-instruction file:** `.cursorrules` (project root) or
  `.cursor/rules/*.mdc` (newer format)
- **Skill file format consumed:** Markdown (native)
- **Multi-turn orchestration:** Partial — Cursor Chat is single-turn;
  Cursor Agents (Composer / Agent mode) support multi-step.
- **Sub-agent support:** Yes via Cursor Agents (Composer).
- **Native JSON mode:** Depends on the configured model (OpenAI and
  Anthropic models yes).

## Works as-is?
🟡 **Needs minor adaptation.** The skill runs, but the multi-role debate
must be orchestrated via Cursor Agents (Composer) rather than the default
Chat. Smaller-model context caps may force a one-shot fallback for the
Understand and Generate stages.

## Setup — step by step

### 1. Place the skill package
```bash
cp -r /path/to/skill /your/project/docs/skill
```

### 2. Reference it from `.cursorrules` (legacy) or `.cursor/rules/skill.mdc` (newer)

**Legacy `.cursorrules`:**
```markdown
# Requirements Intelligence Council
This project uses the Requirements Intelligence Council skill for
document generation tasks (PRD, BRD, FRD, SOW, Tech Design, Audit).

Read and follow: docs/skill/SKILL.md

For document-generation requests, run the 10-stage pipeline defined in
docs/skill/workflows/. Load role prompts from docs/skill/roles/. Use
templates from docs/skill/templates/.
```

**Newer `.cursor/rules/skill.mdc`:**
```yaml
---
description: Requirements Intelligence Council skill for doc generation
globs: ["**/*.md", "**/PRD*", "**/BRD*", "**/FRD*"]
alwaysApply: false
---

# Requirements Intelligence Council
Read and follow: docs/skill/SKILL.md
...
```

### 3. Configure models in Cursor Settings → Models
- **Default chat model:** Claude Sonnet 4.5 or GPT-5 (≥ 128K context).
- **Composer / Agent model:** Same — this is what runs the pipeline.

### 4. Run the pipeline via Cursor Agent (Composer)
Open Cursor Agent (⌘I) and prompt:
```
Read docs/skill/examples/sample-input.md. Run the Requirements
Intelligence Council pipeline defined in docs/skill/SKILL.md to produce
a PRD. Load each council role from docs/skill/roles/. Use the PRD
template from docs/skill/templates/prd.md. Output the final PRD as
Markdown.
```

Cursor Agent will sequence the stages. For Debate, it runs each role as
a separate internal call (not truly parallel, but orchestrated).

### 5. Test the install
Run the sample input and diff against
`docs/skill/examples/sample-output-prd.md`.

## Recommended stage → model mapping
Cursor routes through its configured provider; set per-stage model via
Agent tool calls:

| Stage             | Recommended model                       |
|-------------------|-----------------------------------------|
| Understand        | Claude Sonnet 4.5 / GPT-5 (long context)|
| Debate (per role) | Claude Haiku / GPT-5-mini (cheap)       |
| Moderator         | Claude Sonnet 4.5 / GPT-5                |
| Requirements      | Claude Sonnet 4.5 / GPT-5                |
| Gaps & Risks      | Claude Sonnet 4.5 / GPT-5                |
| Strategy          | Claude Haiku / GPT-5-mini                |
| Generate          | Claude Sonnet 4.5 / GPT-5 (quality)      |
| Validate          | Claude Sonnet 4.5 / GPT-5                |

## Limitations
- **Single-agent orchestration.** Cursor Agent sequences calls; it does
  not natively parallelize the eight Debate Round-1 calls. Expect Debate
  to take 30-60 seconds wall-clock even on fast models.
- **Context cap on smaller models.** Cursor's free tier may cap context
  below what Understand needs for large repos. Switch to a paid model
  or truncate the source.
- **No native provider routing.** Cursor routes through its configured
  provider only. To use Groq / Google AI Studio / Cohere directly, use
  the Next.js reference app or a custom CLI script.
- **File-format quirks.** Newer `.cursor/rules/*.mdc` files require YAML
  frontmatter. The skill's `.md` files work as-is when referenced but
  cannot be dropped directly into `.cursor/rules/`.
- **No native SSE streaming between stages.** Cursor Agent returns
  complete outputs per step.

## One-shot fallback
If multi-stage orchestration is too slow or fails, collapse to a single
prompt:
```
Read docs/skill/SKILL.md, docs/skill/roles/*.md (all ten files),
docs/skill/templates/prd.md, and docs/skill/validators/quality-score.md.
Then read docs/skill/examples/sample-input.md and produce a complete PRD
in one pass, following the SKILL.md output rules.
```
Quality drops (no true council debate) but the structure survives.

## Tips
- Pin `SKILL.md` reference at the top of `.cursorrules` for always-on
  loading.
- For long repos, ask Cursor to first generate a context-map file and
  reference it in subsequent calls.
- Use Cursor's `@` mention syntax to inline role files when prompting:
  `@docs/skill/roles/product-manager.md`.

## Troubleshooting
| Symptom                                  | Cause / fix                                       |
|------------------------------------------|---------------------------------------------------|
| Agent ignores role files                 | Use `@file` mention to force-load the role file   |
| Generate output truncated                | Switch to a longer-context model or split per section |
| Validation gate sycophantic              | Add explicit constraint to find ≥ 1 weakness       |
| `.cursorrules` not picked up             | Restart Cursor or use the newer `.cursor/rules/`  |
