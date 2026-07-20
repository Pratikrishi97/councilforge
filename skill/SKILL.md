# SKILL.md — Requirements Intelligence Council

> A portable, platform-agnostic skill that turns source material (repos, notes,
> specs, business briefs) into decision-ready documents (PRD, BRD, FRD, SOW,
> Technical Design, Audit/Roadmap) through a multi-role AI council.

This file is the **root entrypoint** for any AI IDE or agent runtime. It is
deliberately framework-free — no Next.js, React, Node, or vendor SDK is
required to consume it. Pair it with the modular files in `roles/`,
`workflows/`, `templates/`, `providers/`, `validators/`, `examples/`, and
`adapters/` for full coverage.

---

## 1. Mission

Inspect source material, reason across **multiple expert perspectives** like a
cross-functional product team, surface gaps and risks, choose the right
artifact, and produce a **traceable, decision-ready document** in Markdown.

The output must be more than a summary. It must be a real artifact someone
could act on, sign off on, or hand to engineering.

## 2. Core Principles

1. **Think like a team, not a formatter.** Reason across roles before writing.
2. **Be precise, not generic.** Concrete language over abstractions.
3. **Be exhaustive, not bloated.** Cover what matters; cut filler.
4. **Be honest about uncertainty.** Never invent facts, metrics, stakeholders,
   architecture, timelines, or business rules that the source does not support.
5. **Label every inference.** Use three labels throughout: `Confirmed`
   (supported by source), `Inferred` (reasoned from context), `Assumption`
   (taken as given pending validation).
6. **Convert vagueness into testable statements** with explicit acceptance
   criteria (Given/When/Then where possible).
7. **Maintain traceability.** business objective → requirement → feature →
   acceptance criteria → test scenario → release item → owner.
8. **Never stop at a summary.** Produce a complete, structured artifact.
9. **Cite concrete signals** from the source. Reject generic boilerplate.
10. **Preserve project memory** across runs — terminology, prior decisions,
    known stakeholders, open questions.

## 3. Pipeline Stages

The skill runs a **10-stage pipeline**. Each stage has a dedicated workflow
file under `workflows/`. Stages may be run sequentially, streamed, or batched
depending on the host IDE.

| #  | Stage              | Workflow file                       | Purpose                                            |
|----|--------------------|-------------------------------------|----------------------------------------------------|
| 1  | **Understand**     | `workflows/understand.md`           | Context map + repository intelligence              |
| 2  | **Research**       | `workflows/research.md`             | Competitor / feature / cost / sprint / architecture intelligence |
| 3  | **Debate**         | `workflows/debate.md`               | Council Round 1 → Round 2 → Moderator synthesis    |
| 4  | **Requirements**   | `workflows/requirements.md`         | Functional + non-functional discovery with inference engine |
| 5  | **Gaps & Risks**   | `workflows/gaps-risks.md`           | 10 gap categories × 6 risk categories              |
| 6  | **Strategy**       | `workflows/strategy.md`             | Pick the right document type with justification    |
| 7  | **Generate**       | `workflows/generate.md`             | Draft the document in Markdown                      |
| 8  | **Validate**       | `workflows/validate.md`             | Self-critique + quality gates + revision decision  |
| 9  | **Knowledge Graph**| `workflows/knowledge-graph.md`      | Entities, relationships, decision graph            |
| 10 | **Decision Journal**| `workflows/decision-journal.md`     | Persistent decisions, rationale, alternatives      |

A typical end-to-end run executes stages 1 → 3 → 4 → 5 → 6 → 7 → 8 in order.
Stages 2, 9, 10 are **optional augmentations** triggered on demand.

## 4. Role System (Council)

The council has **10 roles**. Each role is defined in `roles/<name>.md`. The
first eight participate in the debate; the moderator synthesizes; the
compliance reviewer gates regulated domains.

| Role                    | Emoji | File                                 |
|-------------------------|-------|--------------------------------------|
| Product Manager         | 🎯    | `roles/product-manager.md`           |
| Business Analyst        | 💼    | `roles/business-analyst.md`          |
| Solutions Architect     | 🏗️    | `roles/solutions-architect.md`       |
| Engineering Lead        | ⚙️    | `roles/engineering-lead.md`          |
| QA Lead                 | 🧪    | `roles/qa-lead.md`                   |
| Security Reviewer       | 🔐    | `roles/security-reviewer.md`         |
| UX Reviewer             | 🎨    | `roles/ux-reviewer.md`               |
| Delivery Manager        | 📦    | `roles/delivery-manager.md`          |
| Moderator               | ⚖️    | `roles/moderator.md`                 |
| Compliance Reviewer     | 📜    | `roles/compliance-reviewer.md`       |

Each role file specifies: responsibilities, what matters most, what could go
wrong, what to challenge, and 6 questions the role answers in debate.

## 5. Document Types

The skill can produce nine artifacts. Canonical section structures live in
`templates/`. Strategy stage picks one; AUTO defers the choice.

| Type         | Template file                    | When to use                                            |
|--------------|----------------------------------|--------------------------------------------------------|
| PRD          | `templates/prd.md`               | Product behavior, features, user needs, outcomes       |
| BRD          | `templates/brd.md`               | Business need, stakeholder goals, organizational impact|
| FRD          | `templates/frd.md`               | Functional behavior, validations, business rules       |
| SOW          | `templates/sow.md`               | Scope, deliverables, timeline, commercial execution    |
| Tech Design  | `templates/technical-design.md`  | Architecture, components, APIs, deployment             |
| Audit        | `templates/audit.md`             | Review of quality/readiness/gaps of an existing system |
| Roadmap      | *(uses Audit template variant)*  | Sequencing, milestones, phased delivery                |
| Gap Analysis | *(uses Audit template variant)*  | Missing pieces of an existing product or repo          |
| AUTO         | —                                | Strategy stage decides                                 |

## 6. Provider Routing

The skill is model-agnostic. The host IDE supplies the LLM. The skill
specifies **what kind of model** each stage prefers; the host maps that to a
concrete provider.

| Stage                | Latency  | Context  | Notes                                  |
|----------------------|----------|----------|----------------------------------------|
| Understand           | low-med  | large    | Long source material needs big context |
| Research             | med      | large    | Synthesis-heavy                        |
| Debate (per role)    | low      | medium   | Parallelizable; cheap models OK        |
| Requirements         | med      | medium   | Needs instruction-following            |
| Gaps & Risks         | med      | medium   | Categorization-heavy                   |
| Strategy             | low      | small    | Small, decisive                        |
| Generate             | med-high | large    | Long-form writing; quality critical    |
| Validate             | low-med  | medium   | Strict JSON output                     |
| Knowledge Graph      | med      | medium   | Structured JSON                        |
| Decision Journal     | low      | small    | Append-only structured output          |

See `providers/registry.md` for the 23 supported providers and
`providers/routing-rules.md` for the full role-to-provider mapping logic.

## 7. Quality Gates

Validation runs **10 quality gates**. Detailed rules live in `validators/`:

| Gate                  | Validator file                    |
|-----------------------|-----------------------------------|
| Completeness          | `validators/completeness.md`      |
| Consistency           | `validators/consistency.md`       |
| Quality Score         | `validators/quality-score.md`     |

Each gate returns `pass` / `warn` / `fail`. A fail triggers at most one
revision pass; subsequent weaknesses are reported as open questions instead
of looping forever.

## 8. Output Rules

Every generated document **must**:

- Be **Markdown only** (no HTML, no JSX, no vendor DSL).
- Use `#` for the title, `##` for major sections, `###` for sub-sections.
- Use **tables** for risks, assumptions, traceability, comparisons, decisions,
  timelines, responsibilities.
- Use **bullet lists** for requirements, gaps, open questions, action items.
- Use **fenced code blocks** for JSON schemas, sample config, pseudo-APIs.
- Include **at least one Mermaid diagram** (` ```mermaid `) — flowchart,
  sequence, ER, or state — where it adds clarity.
- Inline-label statements as `Confirmed`, `Inferred`, or `Assumption`.
- Keep acceptance criteria **testable** (Given/When/Then).
- Tie every requirement back to a business or user need.
- **Not** include the assumptions/confidence/open-questions sections inside
  the document body — those are produced separately in the metadata stage.

## 9. Quick Start for AI IDEs

1. **Read this file first.** It is the contract.
2. **Pick an adapter** from `adapters/<your-ide>.md`. If none exists, follow
   the generic steps below.
3. **Stage 1 — Understand.** Ingest the user's source material (repo URL,
   pasted text, file paths). Produce the context map JSON described in
   `workflows/understand.md`.
4. **Stage 3 — Debate.** For each of the eight council roles in `roles/`,
   load `roles/<role>.md` as the system prompt and run Round 1, then Round 2
   (roles see each other's outputs), then the moderator (`roles/moderator.md`)
   to synthesize consensus. Do not skip — this is the core differentiator.
5. **Stages 4–6.** Requirements → Gaps/Risks → Strategy. Use the JSON shapes
   defined in each workflow file.
6. **Stage 7 — Generate.** Load `templates/<doc-type>.md`, follow its section
   order, apply the output rules above.
7. **Stage 8 — Validate.** Run all 10 quality gates from `validators/`.
   If any fail, run exactly one revision pass targeting the weak sections.
8. **Stage 10 — Metadata.** Produce traceability table, assumptions list,
   confidence ratings, open questions, next actions, change summary.
9. **Return** the Markdown document plus the metadata JSON to the user.

### Minimal one-shot prompt
If the IDE cannot run a multi-stage pipeline, collapse the skill into a
single prompt: paste `SKILL.md`, the relevant `roles/*.md` (all eight),
the relevant `templates/<doc-type>.md`, and `validators/quality-score.md`,
then ask the model to produce the document in one pass. Quality drops but
the structure survives.

### Generic install (any project-instruction system)
1. Copy this `skill/` directory into the project repo (e.g. `docs/skill/` or
   `.ai/skill/`).
2. Point the IDE's project-instruction file at `skill/SKILL.md`.
   - Claude Code → `CLAUDE.md` includes `skill/SKILL.md`
   - Cursor → `.cursorrules` references `skill/SKILL.md`
   - Codex → `AGENTS.md` references `skill/SKILL.md`
   - Kiro → `.kiro/steering/*.md` imports it
   - GitHub Copilot → `.github/copilot-instructions.md` references it
3. Provide a model with at least 32K context and JSON-mode support.
4. Run `examples/sample-input.md` through the pipeline and diff against
   `examples/sample-output-prd.md` to validate the install.

## 10. File Index

```
skill/
├── SKILL.md                  ← you are here
├── README.md                 ← skill-specific readme
├── COMPATIBILITY.md          ← platform compatibility matrix
├── roles/                    ← 10 council role prompts
├── workflows/                ← 10 stage definitions
├── templates/                ← 6 canonical document structures
├── providers/                ← provider registry + routing rules
├── validators/               ← 3 quality-gate rule sets
├── examples/                 ← sample input + sample PRD output
└── adapters/                 ← 5 platform-specific setup guides
```

## 11. Versioning & Provenance

- **Skill version:** 1.0.0
- **Source of truth:** This `SKILL.md` file. All other files elaborate on it.
- **Provenance:** Distilled from the Repo-to-Doc Intelligence reference
  implementation. Provider catalog bootstrapped from the open-source
  `free-llm-api-resources` registry and supplemented with provider docs.
- **License:** Same as the host project. No proprietary dependencies.

---

**End of SKILL.md.** Read `README.md` next for usage examples, or jump
straight to `adapters/<your-ide>.md` for install steps.
