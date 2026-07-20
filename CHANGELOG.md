# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Repository packaging and open-source launch readiness (no application logic changed).

### Added
- Standalone [`ROADMAP.md`](./ROADMAP.md) (Now / Next / Later / Non-goals).
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — production deployment, reverse proxy, SQLite→PostgreSQL, env vars.
- `assets/` diagrams — architecture layers, pipeline stages, council flow, provider routing (Mermaid).
- `examples/README.md` index plus `skill-only-usage.md` and `local-mode-ollama.md` worked examples.
- Issue templates for provider requests and council-role proposals; `.github/CODEOWNERS`.
- "Bootstrap fallback" section in [`docs/PROVIDER_SETUP.md`](./docs/PROVIDER_SETUP.md).

### Changed
- `package.json` name → `councilforge`; version → `1.0.0`.
- CI (`.github/workflows/ci.yml`) now runs blocking `lint` + `build` and an informational `typecheck`, fork-safe with no secrets.
- Normalized all repo URLs to `Pratikrishi97/councilforge`; replaced placeholder security/CoC emails with GitHub private vulnerability reporting.
- Reconciled the skill template count to 6 (covering 9 doc types).

### Removed
- Internal `worklog.md` build log; repurposed `download/README.md` to document on-demand exports.

## [1.0.0] — 2025-07-19

The first public release. CouncilForge is a full-stack platform that turns source material (GitHub repos, notes, briefs) into decision-ready documents, roadmaps, tests, and governed delivery plans via a visible, multi-role AI Council.

### ✨ Added — Core platform

- **29-stage pipeline** with live SSE streaming of stage events, provider routing decisions, gate state, and revision passes.
- **Visible AI Council** — 10 roles (Product Manager, Business Analyst, Solutions Architect, Engineering Lead, QA Lead, Security Reviewer, UX Reviewer, Delivery Manager, Moderator, Compliance Reviewer) running a 2-round adversarial debate with moderator synthesis and consensus reporting.
- **AI voting** — weighted multi-criteria voting with explicit rationale per role.
- **Dynamic council** — domain-aware role injection (adds DevOps, Finance, Data, Domain Expert roles as needed).
- **8 document types** — PRD, BRD, FRD, SOW, Tech Design, Audit, Roadmap, Gap Analysis, plus `AUTO` strategy selection.
- **9 quality gates** — completeness, consistency, clarity, testability, feasibility, ownership, risk coverage, scope boundaries, traceability — with at most one revision pass.

### ✨ Added — Intelligence layer

- **Repository intelligence** — public GitHub REST fetcher (metadata, README, recursive tree, package-hint detection) with tree-summarizer for context budget.
- **Autonomous research** — topic-driven evidence gathering with confidence ratings.
- **Competitor intelligence** — strengths, weaknesses, features, gaps, differentiation, strategic recommendations.
- **Feature recommendations** — MVP / phase 2 / activation / retention / monetization / risk reducers / analytics / admin.
- **Cost estimation** — backend / frontend / QA / DevOps / AI / infra breakdown with monthly OPEX and total range.
- **Sprint planning** — sprints with goals, items, effort, owners, milestones, risk checkpoints.
- **Architecture simulation** — failure modes, bottlenecks, what-ifs, operational risks.
- **Scenario simulation** — "what if" analysis with implications across product / engineering / security / delivery / QA / cost / risk.
- **Knowledge graph** — typed nodes (goal, epic, feature, requirement, AC, test case, release, risk, decision, stakeholder, dependency) with relations (decomposes_into, depends_on, tested_by, released_in, mitigates, decided_by, impacts, owned_by).
- **Decision journal** — persistent, append-only decisions with rationale, alternatives, tradeoffs, supporters, objectors, confidence.
- **Confidence scoring** — 6-axis (business, requirements, technical, timeline, risk, validation).

### ✨ Added — Delivery layer

- **Acceptance test generation** — Given/When/Then from requirements with positive / negative / edge / regression types and coverage tracking.
- **Backlog conversion** — epics → stories → tasks → subtasks → milestones → bugs, traceable to requirement IDs.
- **Roadmap intelligence** — phased delivery with features, dependencies, risks, parallelism, confidence.
- **Evaluation engine** — rubric-based scoring with per-doc-type rubrics and benchmark modes (golden / synthetic / prior / feedback / human).
- **Export** — Markdown, JSON, CSV, issue-tracker format.

### ✨ Added — Governance layer

- **Policy engine** — input / output / role / provider / data-handling / escalation restrictions, with credential detection on input and secret-leak detection on output.
- **Observability** — per-stage timing, token usage, provider latency, fallback counts, error counts.
- **Health score** — 7-area composite (memory completeness, requirement clarity, risk coverage, traceability, validation quality, provider reliability, document freshness) with weak-area detection and recommended actions.
- **Next-best-action engine** — priority-ranked recommendations across context / refine / validate / deliver / review / export categories.
- **Audit log** — every significant action (generate, export, provider key add/remove, gate approve/revise, mode change, registry refresh) recorded.
- **Drift alerts** — requirement_changed, repo_updated, stakeholder_added, assumption_invalid, doc_stale.
- **Notifications** — validation_failed, consensus_blocked, provider_fallback, drift_detected, policy_violation, health_dropped, benchmark_regression, review_pending, version_changed, release_gate.
- **Comments** — section-targeted annotations with resolved state.
- **User feedback** — 6 rating types (excellent, helpful, not_helpful, too_generic, missing_context, inaccurate) with accept/reject/edit actions.

### ✨ Added — Execution layer

- **Provider router** with 4 modes: `free`, `hybrid`, `own-keys`, `local`.
- **23-provider registry** auto-bootstrapped from [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources).
- **Fallback chains** — automatic failover when a provider errors, times out, or returns invalid output.
- **Provider performance tracking** — latency, errors, quality scores per provider × stage × role.
- **Masked key storage** — keys never logged, never included in documents, scanned for leakage by the policy engine.

### ✨ Added — Experience layer

- **Dashboard** — recent projects, versions, health scores, observability summary.
- **Pipeline progress** — live 29-stage progress bar grouped into phases.
- **Council debate viewer** — Round 1 → Round 2 → Moderator with role pills and consensus.
- **Document viewer** — rendered Markdown with Mermaid diagrams, JSON/CSV/Issues export, feedback buttons.
- **Tests & Delivery tab** — acceptance tests coverage bar, backlog grouped by type, roadmap timeline, evaluation rubric.
- **Govern tab** — health score ring, next-best-action cards, observability log, policy manager.
- **Providers tab** — registry modal with masked keys, mode switcher, refresh button.
- **History sidebar** — project versions with diff view.
- **Onboarding modal** — walks new users through mode selection and key setup.
- **Diff view** — living-document change tracking between versions.

### ✨ Added — Skill package (portable, framework-free)

- **Pure-Markdown skill** in `/skill` — same council, workflows, templates, validators, providers as the live app.
- **10 role prompts** in `skill/roles/`.
- **10 workflow definitions** in `skill/workflows/`.
- **8 document templates** in `skill/templates/`.
- **23-provider registry + routing rules** in `skill/providers/`.
- **3 quality-gate validator sets** in `skill/validators/`.
- **5 IDE adapters** in `skill/adapters/` — Claude Code, Cursor, Codex, Kiro, GitHub Copilot.
- **Compatibility matrix** — Claude Code and Gemini CLI run the full pipeline; Cursor, Codex, Kiro, OpenCode need minor adaptation; Copilot Chat and local shells collapse to one-shot.
- **Sample input + sample PRD output** in `skill/examples/`.

### ✨ Added — Domain packs

- **8 specialized domain packs**: fintech, healthcare, enterprise-workflow, developer-tools, consumer-app, analytics, ai-product, migration.
- Each pack includes specialized roles, risk checklists, document structures, policy rules, rubrics, and recommended providers.

### ✨ Added — Infrastructure

- **29 Prisma models** (Project, DocVersion, KnowledgeNode, KnowledgeEdge, DecisionJournal, ResearchEntry, Competitor, Scenario, AuditLog, Evaluation, PromptRegistry, UserFeedback, Policy, EvidenceLibrary, AcceptanceTest, BacklogItem, RoadmapPhase, DriftAlert, ObservabilityEvent, DomainPack, Comment, Notification, ProviderPerformance, PluginRegistry, ProviderEntry, ProviderConfig, AppSettings, plus User/Post legacy).
- **38 API routes** under `src/app/api/`.
- **133 source files** (TypeScript / TSX).
- **Next.js 16** App Router with `runtime = "nodejs"` and `dynamic = "force-dynamic"` on all routes.
- **TypeScript 5** strict mode.
- **Tailwind CSS 4** with shadcn/ui primitives.
- **Prisma 6** with SQLite (default; swap to PostgreSQL for production).
- **z-ai-web-dev-sdk** as the built-in free-tier execution backend.
- **Zustand** for client state, **SSE** for streaming pipeline events.

### ✨ Added — Docs & launch assets

- `README.md` — overview, quick start, architecture diagram, skill portability.
- `CONTRIBUTING.md` — setup, structure, coding style, extension guides for roles / providers / doc types / pipeline stages.
- `SECURITY.md` — API key handling, vulnerability reporting, provider notes, hardening checklist.
- `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1.
- `docs/ARCHITECTURE.md` — 7-layer breakdown, all 29 stages, data flow, DB models, API surface.
- `docs/PROVIDER_SETUP.md` — 4 modes, per-provider key guides, troubleshooting.
- `docs/FAQ.md` — common questions.
- `.github/ISSUE_TEMPLATE/` — bug report, feature request, config.
- `.github/PULL_REQUEST_TEMPLATE.md` — PR checklist.
- `CHANGELOG.md` — this file.

### ⚙️ Known limitations

- `ProviderConfig.apiKeyEnc` stores the raw key value — real envelope encryption must be added before multi-user deployment (see `SECURITY.md`).
- No authentication yet — NextAuth is a dependency and ready to be wired up.
- Memory recall is lexical, not semantic — vector storage is on the roadmap.
- A handful of pre-existing TypeScript errors remain in legacy files (`cross-project/route.ts`, `settings/route.ts`, `diff.ts`, `pipeline.ts`) outside the v1.0.0 scope.

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** — incompatible API or schema changes.
- **MINOR** — new stages, roles, providers, doc types, or features (backward-compatible).
- **PATCH** — bug fixes, doc improvements, dependency bumps.

[Unreleased]: https://github.com/Pratikrishi97/councilforge/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Pratikrishi97/councilforge/releases/tag/v1.0.0
