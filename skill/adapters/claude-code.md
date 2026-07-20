# Adapter — Claude Code

> How to install and use the Requirements Intelligence Council skill in
> Anthropic's **Claude Code** CLI.

## Platform summary
- **Vendor:** Anthropic
- **Project-instruction file:** `CLAUDE.md` (project root)
- **Skill file format consumed:** Markdown (native)
- **Multi-turn orchestration:** Native — Claude Code runs as a stateful
  agent that can call the model many times per task.
- **Sub-agent support:** Yes — `/agents` and the Task tool let you spawn
  isolated sub-agents per council role.
- **Native JSON mode:** Yes (Claude models support `response_format`).

## Works as-is?
✅ **Yes.** Claude Code is the reference target for this skill. The full
10-stage pipeline runs without adaptation.

## Setup — step by step

### 1. Place the skill package
Copy or symlink the `skill/` directory into your project:
```bash
cp -r /path/to/skill /your/project/docs/skill
```

### 2. Reference it from `CLAUDE.md`
In your project root, create or edit `CLAUDE.md`:
```markdown
# Project instructions

## Requirements Intelligence Council
This project uses the Requirements Intelligence Council skill for any
document-generation task (PRD, BRD, FRD, SOW, Tech Design, Audit).

Read and follow: `docs/skill/SKILL.md`

When asked to produce a document, run the full 10-stage pipeline defined
in `docs/skill/workflows/`. Load the council role prompts from
`docs/skill/roles/` as system prompts for each role. Use the document
templates from `docs/skill/templates/`.
```

### 3. (Optional) Configure sub-agents per role
Create `.claude/agents/` files for each council role to enable parallel
debate. Example `.claude/agents/product-manager.md`:
```markdown
---
name: product-manager
description: Council role — Product Manager voice
---

Read `docs/skill/roles/product-manager.md` and follow it as your system
prompt. Respond only with the Round 1 JSON shape defined there.
```
Repeat for each of the eight debate roles + moderator. Then orchestrate
via the Task tool: spawn the eight roles in parallel for Round 1, then
parallel for Round 2, then call the moderator.

### 4. Set the model
```bash
claude config set model claude-sonnet-4-5
# or for highest quality on the Generate stage:
claude config set model claude-opus-4-1
```

### 5. Test the install
```bash
claude "Read docs/skill/examples/sample-input.md and produce a PRD by
running the pipeline defined in docs/skill/SKILL.md. Output the PRD as
Markdown."
```
Diff the output against `docs/skill/examples/sample-output-prd.md`.

## Recommended stage → model mapping
| Stage             | Recommended Claude model        |
|-------------------|---------------------------------|
| Understand        | claude-sonnet-4-5 (long context)|
| Research          | claude-sonnet-4-5               |
| Debate (per role) | claude-haiku-4 (cheap, fast)    |
| Moderator         | claude-sonnet-4-5               |
| Requirements      | claude-sonnet-4-5               |
| Gaps & Risks      | claude-sonnet-4-5               |
| Strategy          | claude-haiku-4                   |
| Generate          | claude-opus-4-1 (quality-critical) |
| Validate          | claude-sonnet-4-5               |
| Knowledge Graph   | claude-sonnet-4-5               |
| Decision Journal  | claude-haiku-4                   |

Use the Task tool's `model` parameter to vary the model per sub-agent.

## Limitations
- **Token cost.** Running the full pipeline (especially the 17 debate
  calls) consumes significant tokens. Use Haiku for Debate rounds to
  control cost.
- **No native SSE streaming between sub-agents.** Sub-agent outputs are
  returned as complete messages; the orchestrator must serialize them.
- **Parallelism limits.** Claude Code throttles concurrent sub-agent
  calls. Eight parallel Round-1 calls may need to be batched 4 + 4.
- **No built-in provider routing.** Claude Code only talks to Anthropic.
  To route stages to other providers (Groq, Google AI Studio, etc.),
  use the Next.js reference app or a custom orchestrator script.

## Tips
- Pin `SKILL.md` at the top of `CLAUDE.md` so it's always loaded.
- For long repos, ask Claude to first summarize the repo into a context
  map and save it to a file, then feed that file to subsequent stages —
  avoids re-reading the repo each time.
- Use Claude Code's `--output-format json` for stages that return JSON
  (Requirements, Gaps/Risks, Validate) to get clean structured output.

## Troubleshooting
| Symptom                                  | Cause / fix                                       |
|------------------------------------------|---------------------------------------------------|
| Sub-agent ignores role prompt            | Ensure the role file is referenced in the agent's system prompt |
| Generated doc missing Mermaid diagram    | Re-run with explicit constraint: "include at least one ```mermaid block" |
| Validation gate returns 100 with all pass| Re-run with constraint: "find at least one weakness or open question" |
| Token limit hit on Generate stage        | Split into per-section sub-calls and concatenate   |
