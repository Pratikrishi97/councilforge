# Adapter — GitHub Copilot

> How to install and use the Requirements Intelligence Council skill in
> **GitHub Copilot** (Copilot Chat, Copilot Workspace, and Copilot
> Extensions).

## Platform summary
- **Vendor:** GitHub / Microsoft
- **Project-instruction file:** `.github/copilot-instructions.md`
  (project root) — consumed by Copilot Chat in VS Code, JetBrains, and
  Neovim. Also picked up by Copilot Workspace.
- **Skill file format consumed:** Markdown (native)
- **Multi-turn orchestration:** Limited — Copilot Chat is fundamentally
  single-turn per message. Copilot Workspace and Copilot Extensions
  support multi-step.
- **Sub-agent support:** No native sub-agents in Copilot Chat. Copilot
  Extensions can spawn custom logic.
- **Native JSON mode:** Depends on the underlying model; OpenAI models
  via Copilot support it.

## Works as-is?
🟠 **Needs major adaptation.** Copilot Chat is single-turn, so the full
10-stage pipeline cannot run as designed. The pipeline must be collapsed
to a one-shot prompt, OR orchestrated manually across multiple chat
turns (user-driven), OR run via Copilot Workspace / Copilot Extensions
(which support multi-step).

## Setup — step by step

### 1. Place the skill package
```bash
cp -r /path/to/skill /your/project/docs/skill
```

### 2. Reference it from `.github/copilot-instructions.md`
```markdown
# GitHub Copilot Instructions

## Requirements Intelligence Council
This project uses the Requirements Intelligence Council skill for any
document-generation task (PRD, BRD, FRD, SOW, Tech Design, Audit).

When asked to produce a document, follow the pipeline defined in
docs/skill/SKILL.md. Because Copilot Chat is single-turn, collapse the
pipeline to a one-shot prompt unless using Copilot Workspace:
- Include all eight council role prompts inline.
- Apply the document template from docs/skill/templates/.
- Run a self-critique pass before returning the final document.
- Apply the output rules from docs/skill/SKILL.md §8.
```

### 3. Configure Copilot
In VS Code / JetBrains settings:
- Set `github.copilot.advanced.models` to a long-context model
  (GPT-5, Claude Sonnet via Copilot).
- Enable `github.copilot.chat.codeGeneration.useInstructionFiles`.

### 4. Run via Copilot Chat (one-shot)
Open Copilot Chat and prompt:
```
@workspace Read docs/skill/SKILL.md, docs/skill/roles/*.md,
docs/skill/templates/prd.md, and docs/skill/validators/quality-score.md.
Then read docs/skill/examples/sample-input.md and produce a complete PRD
in one pass, applying the output rules from SKILL.md §8.
```

### 5. (Better) Run via Copilot Workspace
Copilot Workspace supports multi-step tasks. Create a task:
```
Task: Produce a PRD for the input in docs/skill/examples/sample-input.md.
Follow the 10-stage pipeline in docs/skill/SKILL.md, loading role
prompts from docs/skill/roles/ and the template from
docs/skill/templates/prd.md.
```
Workspace will sequence the stages.

### 6. (Best) Run via Copilot Extension
If you have a Copilot Extension that can call external APIs, route the
pipeline through it. The extension can call Groq / Google AI Studio /
Cohere directly per stage, returning structured JSON to Copilot for
final assembly.

### 7. Test the install
Diff the output against `docs/skill/examples/sample-output-prd.md`.

## Recommended stage → model mapping
Copilot routes through its configured models. Recommended for one-shot:

| Stage                              | Recommended Copilot model       |
|------------------------------------|---------------------------------|
| One-shot collapsed pipeline        | GPT-5 / Claude Sonnet 4.5       |
| Generate stage (if multi-step)     | GPT-5 / Claude Sonnet 4.5       |
| Validate (if multi-step)           | GPT-5 / Claude Sonnet 4.5       |

## Limitations
- **No native multi-stage orchestration in Copilot Chat.** The pipeline
  must collapse to one-shot, which loses the council debate's adversarial
  reasoning. Quality drops notably.
- **No parallel debate.** Even in Copilot Workspace, the eight Debate
  Round-1 calls run sequentially.
- **No native provider routing.** Copilot only talks to GitHub Models /
  OpenAI / Anthropic via Copilot's backend. To use Groq / Google AI
  Studio / Cohere directly, use Copilot Extensions or the Next.js
  reference app.
- **Context cap.** Copilot Chat may cap context below what Understand
  needs for large repos. Use Copilot Workspace or truncate the source.
- **`@workspace` is required** to give Copilot access to project files.
  Without it, Copilot won't see `docs/skill/`.

## One-shot fallback (the default for Copilot Chat)
This is the standard mode for Copilot Chat:
```
@workspace Read docs/skill/SKILL.md, docs/skill/roles/*.md,
docs/skill/templates/prd.md, docs/skill/validators/quality-score.md.
Then produce a complete PRD for the input in
docs/skill/examples/sample-input.md. Apply the output rules from
SKILL.md §8. Include at least one Mermaid diagram, at least three
tables, and inline labels (Confirmed / Inferred / Assumption).
```

## Tips
- Pin `SKILL.md` reference at the top of `.github/copilot-instructions.md`
  for always-on loading.
- Use `@workspace` to ensure Copilot reads the skill files.
- For better quality, paste the role prompts into the chat message
  directly rather than relying on Copilot to read them.
- For long repos, pre-summarize into a context-map file and reference
  that instead of the raw repo.

## Troubleshooting
| Symptom                                  | Cause / fix                                       |
|------------------------------------------|---------------------------------------------------|
| Copilot ignores skill files              | Use `@workspace` and explicit file paths           |
| Output is generic / not following SKILL  | Paste role prompts directly into the chat message  |
| Output truncated                         | Switch to a longer-context model or split the request |
| No Mermaid diagram                       | Add explicit constraint to the prompt              |
| `copilot-instructions.md` not picked up  | Ensure file is at `.github/copilot-instructions.md` |
