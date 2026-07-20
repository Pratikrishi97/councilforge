# Requirements Document

**Feature:** GitHub Repository Launch — CouncilForge

## Introduction

CouncilForge is a fully implemented Next.js 16 + TypeScript AI operating system that turns raw source material into decision-ready documents through a visible, multi-role AI Council. The application code is complete and working. This feature covers the **repository packaging and launch-readiness work** required to release CouncilForge as a high-quality, trustworthy, open-source GitHub project.

These requirements are derived from the accompanying [`design.md`](./design.md). The scope is deliberately constrained to structural, documentary, and configuration-level work. **No application logic is modified** — the pipeline, council, provider router, and all `src/lib` domain logic remain exactly as they are. The launch's job is to make the existing product easy to understand, run, trust, extend, and contribute to, while being honest about its limitations.

### Scope boundaries

- **In scope:** repository identity, GitHub community files, CI hardening, standalone roadmap, worked examples, visual documentation assets, deployment docs, build-noise cleanup, and cross-reference/claim auditing.
- **Out of scope:** any change to `src/`, `prisma/schema.prisma`, runtime behavior, the pipeline, the council, the provider router, or the portable skill's logic. Building an automated E2E/benchmark test suite is a roadmap item, not part of this launch.

---

## Glossary

- **Claim ↔ reality:** a quantitative statement in the docs (e.g. "29 stages") and its authoritative source in code (e.g. `STAGE_ORDER`).
- **Fork-safe CI:** a CI workflow that passes on a fresh fork with zero configured secrets.
- **Worked example:** an example document containing input, configuration, expected output, and an explanation.
- **Portable skill:** the framework-free, pure-Markdown `skill/` package.

---

## Requirements

### Requirement 1: Repository identity is consistent and product-accurate

**User Story:** As a developer discovering the repository, I want the package name, repo slug, and product name to be consistent and meaningful, so that I trust the project is real and maintained rather than an unfinished scaffold.

#### Acceptance Criteria

1. WHEN `package.json` is read THEN the `name` field SHALL be `"councilforge"` and SHALL NOT be `"nextjs_tailwind_shadcn_ts"`.
2. WHERE `package.json` currently sets `"private": true`, the launch SHALL preserve it and SHALL NOT publish the app as an npm library.
3. THE launch SHALL NOT modify `version`, `scripts`, `dependencies`, or `devDependencies` in `package.json`.
4. WHEN any tracked file is searched at publish time THEN there SHALL be zero occurrences of `nextjs_tailwind_shadcn_ts`.
5. WHEN any tracked file references the repository URL THEN it SHALL use one consistent `<org>/councilforge` slug, and there SHALL be zero occurrences of `ai-operating-system` as a repo slug.
6. WHERE placeholder org tokens (`<org>`, `<your-org>`) remain, the launch SHALL flag them in a pre-publish checklist so they are resolved to the real org before the repository is made public.

---

### Requirement 2: Continuous integration is a real, fork-safe quality gate

**User Story:** As a contributor, I want CI to check that my change lints, type-checks, and builds without needing any secrets, so that I get fast, trustworthy feedback on a fork.

#### Acceptance Criteria

1. THE CI workflow (`.github/workflows/ci.yml`) SHALL run on `push` to `main` and `pull_request` targeting `main`.
2. THE CI workflow SHALL include a blocking `lint` job that runs `bun run lint`.
3. THE CI workflow SHALL include a `build` job that runs `bun run db:generate` before `bun run build` and provides a dummy SQLite `DATABASE_URL` in-job, and this job SHALL be blocking.
4. THE CI workflow SHALL include a `typecheck` job that runs `bunx tsc --noEmit`, and WHILE documented pre-existing legacy TypeScript errors remain, this job SHALL be non-blocking (`continue-on-error: true`) with an explanatory comment.
5. THE CI workflow SHALL preserve the existing `concurrency` cancel-in-progress group and the Bun/Node setup and cache steps.
6. WHEN CI runs on a fresh fork with zero configured secrets THEN it SHALL NOT require any provider API key and SHALL NOT perform a live generation.
7. THE launch SHALL replace the placeholder `build-check` job (which currently re-runs lint) with the genuine `typecheck` and `build` jobs.

---

### Requirement 3: Community intake surface is complete

**User Story:** As a would-be contributor or user, I want clear templates for reporting bugs, requesting features, proposing providers, and proposing council roles, so that I can contribute in a structured way that maintainers can triage.

#### Acceptance Criteria

1. THE `.github/ISSUE_TEMPLATE/` directory SHALL contain `bug_report.md`, `feature_request.md`, `provider_request.md`, and `new_role.md`.
2. THE launch SHALL create `provider_request.md` with front-matter labels including `needs-triage`, and sections for provider name/homepage, OpenAI-compatible base URL, category (free/trial/premium), default model + context window, auth notes, suited pipeline-stage class, and a checkbox for presence in `cheahjs/free-llm-api-resources`.
3. THE launch SHALL create `new_role.md` with front-matter labels including `needs-triage`, and sections for role name + emoji, mandate, what it challenges, the 6 debate questions, domain-specificity, and the 5-touchpoint checklist from `CONTRIBUTING.md`.
4. WHEN any file in `.github/ISSUE_TEMPLATE/*.md` is read THEN it SHALL contain valid front matter with the required keys (`name`, `about`, `title`, `labels`, `assignees`).
5. WHERE an issue template cross-references `CONTRIBUTING.md`, the referenced heading SHALL exist.
6. THE launch SHALL create a `.github/CODEOWNERS` file mapping path globs (root, `src/lib/pipeline.ts`, `src/lib/provider-*.ts`, `skill/`, `docs/`, `.github/`) to owner handles, using placeholder team handles only where the real org is unknown.
7. THE launch SHALL verify the existing PR template and `dependabot.yml` and SHALL NOT degrade them.

---

### Requirement 4: The roadmap is a first-class, honest document

**User Story:** As an evaluator deciding whether to adopt CouncilForge, I want a standalone roadmap that distinguishes what ships today from what is planned, so that I can trust the project is not overpromising.

#### Acceptance Criteria

1. THE launch SHALL create a standalone `ROADMAP.md` at the repository root.
2. THE `ROADMAP.md` SHALL contain a "Now (v1.0.0)" section mirroring the shipped feature set and linking to `CHANGELOG.md`.
3. THE `ROADMAP.md` SHALL contain "Next" and "Later" sections, and an explicit "Non-goals / out of scope" section.
4. WHEN `ROADMAP.md` and the README roadmap/limitations sections are compared THEN they SHALL NOT contradict each other.
5. THE launch SHALL trim the README roadmap subsection to a summary that links to `ROADMAP.md`.
6. THE `ROADMAP.md` SHALL derive its Now/Next/Later content from the design's "Stable vs Experimental" table so unimplemented items (auth/multi-tenancy, key encryption at rest, vector memory, E2E suite) are shown as planned, not present.

---

### Requirement 5: Every headline capability has a complete worked example

**User Story:** As a new user, I want runnable, worked examples for each major capability, so that I can see exactly what input produces what output before I invest time.

#### Acceptance Criteria

1. THE launch SHALL create `examples/README.md` as an index table mapping each example to the capability and document type it demonstrates, with a "start here" pointer.
2. THE launch SHALL create `examples/skill-only-usage.md` demonstrating running the council purely from the portable `skill/` package inside an AI IDE, referencing `skill/adapters/*` and `skill/examples/sample-input.md`.
3. THE launch SHALL create `examples/local-mode-ollama.md` demonstrating an end-to-end air-gapped run in `local` mode against an Ollama endpoint, linking `docs/PROVIDER_SETUP.md`.
4. WHEN any example document is read THEN it SHALL satisfy the worked-example contract: title + one-line purpose, a fenced Input block, a Configuration table (source, docType, providerMode, domainPack, councilDepth, outputFormat), an Expected Output section with at least one Mermaid diagram or table, and an Explanation tying behavior to specific stages/routing.
5. THE launch SHALL verify the existing examples (`prd-generation.md`, `brd-generation.md`, `council-debate.md`, `repository-analysis.md`, `acceptance-tests.md`, `scenario-simulation.md`) conform to the worked-example contract and SHALL leave `examples/websocket/` sample code unchanged.
6. WHEN example inputs and outputs are inspected THEN they SHALL use fictional data with no real API keys, endpoints, or PII.
7. THE launch SHALL ensure each capability advertised in the README feature table maps to at least one file under `examples/` or a clearly linked section.

---

### Requirement 6: Visual documentation assets exist and match the architecture

**User Story:** As a reader skimming the repository, I want architecture and flow diagrams, so that I can understand the system quickly without reading all the code.

#### Acceptance Criteria

1. THE launch SHALL create an `assets/` directory with an `assets/README.md` index of available diagrams and how docs reference them.
2. THE launch SHALL create `assets/diagrams/architecture-layers.md` (the 7-layer stack), `assets/diagrams/pipeline-stages.md` (29 stages in 7 phases), `assets/diagrams/council-flow.md` (Round 1 → Round 2 → Moderator → AI voting), and `assets/diagrams/provider-routing.md` (4-mode routing + fallback).
3. WHEN a diagram is compared to `docs/ARCHITECTURE.md` THEN it SHALL use identical stage names and layer names.
4. THE launch SHALL use Mermaid/ASCII diagrams at launch and SHALL NOT block launch on binary screenshots.
5. WHERE the README embeds an ASCII diagram, `assets/` SHALL hold the canonical version and the README SHALL link to it.

---

### Requirement 7: Production deployment is documented

**User Story:** As an operator, I want a deployment guide, so that I can run CouncilForge in production without reverse-engineering the `Caddyfile`.

#### Acceptance Criteria

1. THE launch SHALL create `docs/DEPLOYMENT.md`.
2. THE `docs/DEPLOYMENT.md` SHALL document prerequisites, build & run (`bun run build` standalone output, `bun run start`), reverse-proxy setup using the existing `Caddyfile`, switching Prisma from SQLite to PostgreSQL, production provider-mode recommendations, and an environment-variable reference.
3. WHEN `docs/DEPLOYMENT.md` references a script THEN that script SHALL exist in `package.json`, and the guide SHALL NOT invent deployment tooling.
4. THE `docs/DEPLOYMENT.md` SHALL cross-link the API-key-at-rest limitation in `SECURITY.md` and SHALL NOT soften it.
5. THE launch SHALL add a "Bootstrap fallback" note to `docs/PROVIDER_SETUP.md` explaining that the last successful catalog persists in `ProviderEntry`/`AppSettings` and that manual provider entry always works if upstream drifts.

---

### Requirement 8: Internal build noise is removed safely

**User Story:** As a browser of the repository, I want the repo free of internal build logs and placeholder files, so that it looks like a maintained product rather than a scratch workspace.

#### Acceptance Criteria

1. WHEN `worklog.md` is considered for removal THEN the launch SHALL first search the tree for references to it, and its deletion SHALL be gated on explicit user confirmation.
2. WHEN `download/README.md` is evaluated THEN the launch SHALL verify no runtime code depends on the `download/` directory before removing or repurposing it.
3. IF `download/` serves a runtime export purpose THEN the launch SHALL repurpose its README to explain the in-app export/download feature INSTEAD of deleting it.
4. THE launch SHALL treat all deletions as git-tracked, reversible changes.

---

### Requirement 9: All cross-references resolve and no unsupported claims exist

**User Story:** As a reader following links in the documentation, I want every link to resolve and every claim to be accurate, so that I never hit a dead end or a false promise.

#### Acceptance Criteria

1. WHEN any relative Markdown link in a tracked `.md` file is resolved THEN the target file SHALL exist on disk.
2. THE launch SHALL verify that every file/directory named in README, `CONTRIBUTING.md`, `SKILL.md`, and `docs/*` (including `skill/workflows/`, `skill/templates/`, `skill/validators/`, adapters, and examples) is present in the repository.
3. WHEN a quantitative claim (29 stages, 23 providers, 38 routes, 29 models, 8 domain packs, 12 tabs, skill role/template counts) is checked THEN it SHALL equal the count in its source of truth, and any discrepancy SHALL be fixed in the doc rather than by changing code.
4. WHERE the skill docs drift (e.g. `SKILL.md` §5 says 6 templates while README says 8) THEN the launch SHALL resolve the count to one true value against `skill/templates/*.md`.
5. THE launch SHALL preserve the existing honest limitations (single-user, unencrypted keys at rest, SQLite default, lexical memory, free-tier ceilings, no E2E suite, upstream provider dependency) and SHALL NOT overwrite them with marketing language.
6. THE launch SHALL NOT assert any capability the code does not have.

---

### Requirement 10: The portable skill stays framework-free

**User Story:** As an AI-IDE user, I want the portable skill to remain usable without the app or any single vendor, so that I can run the council in my own environment.

#### Acceptance Criteria

1. THE launch SHALL NOT add any dependency on the Next.js app, a vendor SDK, or a specific IDE to any file under `skill/`.
2. THE launch SHALL verify each `skill/adapters/*` install guide references only files that exist (Claude Code, Cursor, Codex, Kiro, GitHub Copilot).
3. THE launch SHALL verify `skill/COMPATIBILITY.md` states the minimum model context (≥32K) and JSON-mode requirement consistently with `SKILL.md`.
4. WHEN `examples/skill-only-usage.md` documents the smoke test THEN it SHALL reference running `skill/examples/sample-input.md` and diffing against `skill/examples/sample-output-prd.md`.
5. THE launch SHALL verify `SKILL.md`'s asserted counts (10 roles / 10 workflows / templates) against the actual `skill/` subdirectories and reconcile any mismatch in the docs.

---

### Requirement 11: The change set is additive and reversible

**User Story:** As a maintainer reviewing the launch PR, I want to be confident the launch touched no application code, so that I can merge it without risk to runtime behavior.

#### Acceptance Criteria

1. WHEN the launch diff is inspected THEN it SHALL touch only docs, `.github/`, `assets/`, `examples/`, the `name` field of `package.json`, and removed build noise.
2. THE launch SHALL NOT alter any file under `src/`.
3. THE launch SHALL NOT alter `prisma/schema.prisma`.
4. THE launch SHALL NOT change the runtime behavior of the application.
5. WHEN a destructive action (file removal) is required THEN it SHALL be explicitly called out and confirmable, and reversible via git revert.

---

## Non-Functional Requirements

### Trust & honesty
- Every quantitative claim must be verifiable against a source of truth in code.
- Honest limitations must remain visible and cross-linked, never hidden.

### Discoverability
- The README must let a browsing developer answer, within five minutes: what is this, why care, how to try it, what to build, how to contribute, is it trustworthy, is it maintained, is it extensible, is it easy to integrate.

### Maintainability
- New community files must match the tone and structure of existing ones.
- Diagrams must have a single canonical source that docs link to, avoiding duplicated drift.

### Portability
- The portable skill must remain runnable in at least the five documented AI IDEs with no code dependencies.

### Reversibility
- All launch changes must be git-tracked and revertible; the single destructive step (build-noise removal) is gated on confirmation.
