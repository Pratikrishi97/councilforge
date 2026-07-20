# Compatibility Matrix

This skill package is pure Markdown. Any tool that can read Markdown can
consume it. The matrix below rates how well each platform can run the **full
10-stage pipeline** as designed, not just ingest the docs.

Legend:
- ✅ **Works as-is** — full pipeline supported with no changes.
- 🟡 **Needs minor adaptation** — works, but requires renaming a file,
  pointing a config at `SKILL.md`, or installing a model provider key.
- 🟠 **Needs major adaptation** — pipeline must be collapsed or partially
  simulated; quality drops but the structure survives.
- 🔴 **Not recommended** — platform cannot meaningfully run the skill.

## Matrix

| Platform                  | Works as-is | Minor adapt | Major adapt | Not rec. | Notes |
|---------------------------|:-----------:|:-----------:|:-----------:|:--------:|-------|
| **Claude Code**           |     ✅      |             |             |          | Reference target. `CLAUDE.md` includes `SKILL.md`; roles loaded as system prompts via sub-agents or sequential calls. JSON mode + long context ideal. |
| **Cursor**                |             |     🟡      |             |          | `.cursorrules` references `SKILL.md`. Multi-role debate must be run as sequential chat turns or via Cursor Agents. Context caps on smaller models may force a one-shot fallback. |
| **Codex (OpenAI)**        |             |     🟡      |             |          | `AGENTS.md` references `SKILL.md`. Use `codex` CLI with `--model` set to a long-context model. Pipeline orchestration via shell script calling `codex exec` per stage. |
| **Kiro**                  |             |     🟡      |             |          | `.kiro/steering/*.md` imports `SKILL.md`. Specs/hooks map cleanly to stages. Multi-role debate must be sequenced manually. |
| **GitHub Copilot**        |             |             |     🟠      |          | `.github/copilot-instructions.md` references `SKILL.md`. Copilot Chat is single-turn; the 10-stage pipeline collapses to a one-shot prompt. Best results in Copilot Workspace or via Copilot Extensions. |
| **Gemini CLI**            |     ✅      |             |             |          | `GEMINI.md` includes `SKILL.md`. 1M-token Gemini variants swallow the full pipeline including long repo content. Native JSON mode. |
| **OpenCode**              |             |     🟡      |             |          | `agents.md` references `SKILL.md`. Multi-agent mode runs each role as a separate sub-agent. Provider routing maps to OpenCode's provider list (OpenRouter, Groq, etc.). |
| **Aider / local agent shells** |        |             |     🟠      |          | `CONVENTIONS.md` references `SKILL.md`. Most local shells are single-agent; collapse to a one-shot prompt with all eight roles inline. Use a model with ≥32K context. |
| **Generic project-instruction systems** | |     🟡      |             |          | Any tool that reads `.cursorrules` / `CLAUDE.md` / `AGENTS.md` style files works. Quality depends on the underlying model's instruction-following and JSON output capability. |
| **ChatGPT web UI**        |             |             |     🟠      |          | No project-instruction file. Paste `SKILL.md` + relevant role/template files into a Custom GPT's system prompt. Pipeline collapses to one-shot. |
| **Claude.ai web UI**      |             |             |     🟠      |          | No project-instruction file. Use a Claude Project, pin `SKILL.md` + role files + template as project knowledge, then prompt. Pipeline must be sequenced manually per turn. |
| **Pure CLI (curl + any LLM API)** | ✅ |             |             |          | Shell script orchestrates stages, pipes JSON between calls. Most faithful to the reference implementation. Requires an OpenAI-compatible endpoint. |

## Per-stage compatibility notes

| Stage          | Bottleneck                                          | Fallback                              |
|----------------|-----------------------------------------------------|---------------------------------------|
| Understand     | Long context (repo tree, READMEs, source)           | Truncate to 8K tokens; mark truncated |
| Debate         | 8 separate role calls + 2 rounds + moderator = 17 calls | Collapse to one call with all roles inline |
| Requirements   | Strict JSON output                                  | Fall back to bullet lists             |
| Gaps & Risks   | 10 + 6 categories — instruction-following heavy     | Reduce to top 3 categories            |
| Strategy       | Cheap, decisive                                     | Manual selection by user              |
| Generate       | Long-form writing; quality-critical                 | Use a higher-tier model just for this |
| Validate       | Strict JSON output + gate logic                     | Convert to natural-language critique  |
| Knowledge Graph| Strict JSON output                                  | Skip on weak models                   |
| Decision Journal| Append-only structured output                      | Skip on weak models                   |

## Recommended minimum model specs

To run the full pipeline as designed, the host model should support:

- **Context window ≥ 32K tokens** (≥ 128K preferred for repo-heavy inputs).
- **Native JSON output mode** (or reliable JSON-in-fenced-block output).
- **Instruction following** strong enough to hold a 6-section template and
  inline labels (`Confirmed` / `Inferred` / `Assumption`) simultaneously.
- **Tool calling** is *not* required — the skill is prompt-only.

## Provider routing summary

See [`providers/routing-rules.md`](./providers/routing-rules.md) for the full
mapping. Short version:

- **Low-latency providers** (Groq, Cerebras, SambaNova, Vercel AI Gateway,
  Cloudflare Workers AI) → Understand, Debate, Strategy, Validate, Decision
  Journal.
- **Large-context providers** (Google AI Studio, Google Vertex AI, Mistral
  Codestral, OpenCode Zen, Together AI) → Understand (with big repos),
  Generate.
- **Quality-critical stages** → Use the highest-tier model the host supports,
  even if it's a paid provider not in the free registry. Generate especially
  benefits from a frontier model.

## Tested configurations

| Host                | Model                | Result                                  |
|---------------------|----------------------|-----------------------------------------|
| Claude Code         | Claude Sonnet 4.5    | ✅ Full pipeline; reference quality     |
| Gemini CLI          | Gemini 2.5 Pro       | ✅ Full pipeline; excellent on long repos|
| Cursor              | GPT-5 / Claude 4.5   | 🟡 Pipeline via Agents; high quality    |
| Codex CLI           | GPT-5                | 🟡 Pipeline via shell orchestration     |
| OpenCode            | OpenRouter + Claude  | 🟡 Multi-agent mode; high quality       |
| Copilot Chat        | GPT-5                | 🟠 One-shot fallback; structure survives|
| ChatGPT web (Custom GPT) | GPT-5           | 🟠 One-shot; quality depends on prompt  |

## Reporting compatibility issues

If a platform fails to run a stage, the most common causes are:

1. **Context window too small** — collapse Debate to a single call.
2. **No JSON mode** — relax validators to natural-language critique.
3. **No multi-turn orchestration** — collapse the entire pipeline to a
   one-shot prompt using the minimal recipe in `SKILL.md` §9.
4. **Model ignores inline labels** — switch to a stronger instruction-following
   model for the Generate stage only.
