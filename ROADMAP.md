# Roadmap

This roadmap is intentionally honest. It separates what ships **now** from what is **planned**, so you can evaluate CouncilForge on what it actually does today. For the full shipped history, see [`CHANGELOG.md`](./CHANGELOG.md). Priorities are discussed openly in [GitHub Discussions](https://github.com/Pratikrishi97/councilforge/discussions).

Legend: **Stable** = production-usable · **Experimental** = works but has a documented caveat · **Planned** = not implemented yet.

---

## Now — v1.0.0 (shipped)

These are implemented, wired end-to-end, and visible in the UI:

- **Stable** — 29-stage streaming pipeline (SSE), visible multi-role AI Council (Round 1 → Round 2 → Moderator → AI voting)
- **Stable** — 4-mode provider router (`free` / `hybrid` / `own-keys` / `local`) with fallback chains
- **Stable** — 23-provider registry, auto-bootstrapped from `cheahjs/free-llm-api-resources`
- **Stable** — 9 document types (PRD, BRD, FRD, SOW, Tech Design, Audit, Roadmap, Gap Analysis, AUTO) generated in Markdown with Mermaid diagrams
- **Stable** — Requirements inference, gaps & risks, acceptance tests, backlog, roadmap, cost & sprint estimates
- **Stable** — Knowledge graph, decision journal, traceability matrix, self-critique + one-pass revision, validation council
- **Stable** — Governance layer: policy engine (secret-leak redaction), evaluation rubrics, health score, next-best-action, audit log, observability
- **Stable** — 8 domain packs (fintech, healthcare, enterprise-workflow, developer-tools, consumer-app, analytics, ai-product, migration)
- **Stable** — Portable, framework-free `skill/` package with adapters for Claude Code, Cursor, Codex, Kiro, GitHub Copilot
- **Stable (single-user)** — Prisma + SQLite persistence and version diffing
- **Experimental** — Provider registry bootstrap depends on an upstream repo; a persisted-catalog fallback and manual entry always work (see [`docs/PROVIDER_SETUP.md`](./docs/PROVIDER_SETUP.md))

---

## Next

Highest-priority planned work, roughly in order:

- **Auth & multi-tenancy** — NextAuth accounts, workspaces, per-project ACLs (today CouncilForge is single-user)
- **API-key encryption at rest** — envelope encryption via KMS / OS keychain (today `ProviderConfig` holds raw key values — see [`SECURITY.md`](./SECURITY.md))
- **PostgreSQL production path** — first-class Postgres support and migration guide beyond the SQLite default
- **Benchmark & golden-set suite** — automated regression tests for prompt and model changes (today the pipeline is exercised manually)

---

## Later

Directional work we want but haven't scheduled:

- **Vector / semantic memory** — embed the knowledge graph for semantic recall across projects (today recall is lexical/keyword-based)
- **Real-time collaboration** — multi-user comments with presence on document sections
- **More domain packs** — education, e-commerce, gaming, govtech (community contributions welcome)
- **Plugin marketplace** — community-contributed roles, validators, export formats, and templates
- **Visual assets** — screenshots and recorded demos to accompany the current Mermaid/ASCII diagrams

---

## Non-goals (out of scope)

To keep the project focused and honest:

- **We will not claim integrations we don't ship.** IDE adapters stay thin overlays on a tool-agnostic core.
- **We will not hide limitations to look more mature.** The [Known Limitations](./README.md#known-limitations) section stays visible.
- **We will not become a hosted SaaS in this repo.** CouncilForge is a self-hostable open-source tool; a managed service is a separate concern.
- **We will not optimize for vanity metrics.** Features earn their place by usefulness, not hype.

---

## How priorities are set

Priorities move based on real usage and community input. If something here matters to you — or is missing — open a [Discussion](https://github.com/Pratikrishi97/councilforge/discussions) or a [feature request](https://github.com/Pratikrishi97/councilforge/issues/new?template=feature_request.md). Good first issues are labeled [`good first issue`](https://github.com/Pratikrishi97/councilforge/labels/good%20first%20issue).
