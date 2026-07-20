# Requirements Intelligence Council — Skill Package

A portable AI skill that turns source material (code repositories, notes,
specs, or business briefs) into decision-ready documents (PRD, BRD, FRD, SOW,
Technical Design, Audit/Roadmap/Gap Analysis) through a **multi-role council
debate**.

This package is **framework-free**. It contains only Markdown files — no
code, no dependencies, no runtime. Any AI IDE or agent shell that can read
Markdown can consume it.

---

## What's inside

```
skill/
├── SKILL.md            ← root entrypoint (read this first)
├── README.md           ← this file
├── COMPATIBILITY.md    ← platform compatibility matrix
├── roles/              ← 10 council role prompts (one per role)
├── workflows/          ← 10 stage definitions (input/output/rules)
├── templates/          ← 6 canonical document structures
├── providers/          ← 23-provider registry + routing rules
├── validators/         ← 3 quality-gate rule sets
├── examples/           ← sample input + sample PRD output
└── adapters/           ← 5 IDE-specific setup guides
```

## What it does

Given a repository URL, pasted notes, or a product brief, the skill:

1. **Understands** the source — extracts context map, tech stack, architecture
   clues, explicit and implicit requirements, likely missing information.
2. **Researches** (optional) — competitors, feature recommendations, cost
   estimates, sprint plan, architecture simulation.
3. **Debates** — eight expert roles (Product, Business, Architecture,
   Engineering, QA, Security, UX, Delivery) each propose independently, then
   respond to each other, then a moderator synthesizes consensus.
4. **Discovers requirements** with an inference engine (e.g. "auth → password
   policy, forgot/reset, MFA, session timeout, audit logging").
5. **Surfaces gaps and risks** across 10 gap categories and 6 risk categories.
6. **Picks the right artifact** (PRD vs BRD vs FRD vs SOW vs Tech Design vs
   Audit) with explicit justification.
7. **Generates** a complete Markdown document with tables, Mermaid diagrams,
   and Confirmed/Inferred/Assumption labels.
8. **Validates** against 10 quality gates; revises once if any fail.
9. **Emits metadata** — traceability matrix, assumptions, confidence ratings,
   open questions, next actions.

## Why a council?

Single-prompt generation produces generic output. The council forces
**adversarial reasoning**: the security reviewer challenges the UX reviewer,
the engineering lead challenges the product manager, the QA lead challenges
everyone. The moderator resolves or honestly reports unresolved
disagreements. The result is a document that has already survived the
cross-functional review it would normally get in week three.

## Quick start

1. Read [`SKILL.md`](./SKILL.md) — it is the contract.
2. Pick your IDE's adapter from [`adapters/`](./adapters/).
3. Run the sample input in [`examples/sample-input.md`](./examples/sample-input.md)
   and diff against [`examples/sample-output-prd.md`](./examples/sample-output-prd.md).

## Document types supported

| Type         | Best for                                                   |
|--------------|------------------------------------------------------------|
| PRD          | Product behavior, user needs, features, measurable outcomes|
| BRD          | Business need, stakeholder goals, organizational impact    |
| FRD          | Functional behavior, validations, business rules           |
| SOW          | Scope, deliverables, timeline, commercial execution        |
| Tech Design  | Architecture, components, APIs, deployment                 |
| Audit        | Quality / readiness review of an existing system           |
| Roadmap      | Sequencing, milestones, phased delivery                    |
| Gap Analysis | What's missing in an existing product or repo              |
| AUTO         | Let the strategy stage decide                              |

## Council roles

🎯 Product Manager · 💼 Business Analyst · 🏗️ Solutions Architect ·
⚙️ Engineering Lead · 🧪 QA Lead · 🔐 Security Reviewer · 🎨 UX Reviewer ·
📦 Delivery Manager · ⚖️ Moderator · 📜 Compliance Reviewer

See [`roles/`](./roles/) for full prompts.

## Providers

The skill is model-agnostic. The host IDE supplies the LLM. Twenty-three
providers are pre-profiled in [`providers/registry.md`](./providers/registry.md)
covering free tiers, trial credits, and OpenAI-compatible endpoints. Routing
rules in [`providers/routing-rules.md`](./providers/routing-rules.md) match
each pipeline stage to the right provider class (low-latency / large-context /
quality-critical).

## Quality gates

Validation runs ten gates: completeness, consistency, clarity, testability,
feasibility, ownership, risk coverage, scope boundaries, traceability, and
document correctness. Rules in [`validators/`](./validators/). A failing gate
triggers at most one revision pass — the pipeline never loops forever.

## Compatibility

See [`COMPATIBILITY.md`](./COMPATIBILITY.md) for the full matrix across
Claude Code, Cursor, Codex, Kiro, GitHub Copilot, Gemini CLI, OpenCode,
local agent shells, and generic project-instruction systems.

## Versioning

- Skill version: **1.0.0**
- Source of truth: [`SKILL.md`](./SKILL.md)
- All other files elaborate on the contract defined there.

## License

Inherits the license of the host project. No proprietary dependencies are
introduced by this skill package — it is pure Markdown.
