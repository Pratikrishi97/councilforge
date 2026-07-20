# Architecture

This document describes the internal architecture of the CouncilForge: the 7 layers, the 29 pipeline stages, the data flow, the database models, and the API surface. It's the reference for contributors and integrators.

---

## 1. The 7 layers

The platform is organized into seven cooperating layers. Each layer has a clear responsibility and a small public surface for the layer above it.

### Layer 1 — Experience

**What it is:** the user-facing Next.js 16 application.

**Components:**
- `src/app/page.tsx` — the main workspace with 12 tabs (Doc, Council, Reqs, Gaps, Intel, Tests, Delivery, Decisions, Validate, Govern, Providers, Diff).
- `src/app/layout.tsx` — root layout with theme provider and toaster.
- `src/components/workspace/` — 13 workspace components (dashboard, document-viewer, stage-panels, delivery-panels, completion-panels, pipeline-progress, source-input, history-sidebar, project-sidebar, registry-modal, onboarding-modal, provider-log, diff-view, doc-type-picker).
- `src/components/ui/` — shadcn/ui primitives (button, dialog, select, table, tabs, toast, …).
- `src/store/workspace.ts` — Zustand store managing input state, live stage status, SSE stream parsing, history, and project reload.

**Public surface:** the rendered HTML + SSE event stream consumed by the workspace store.

### Layer 2 — Orchestration

**What it is:** the pipeline that runs the 29 stages in order and emits a typed event stream.

**Components:**
- `src/lib/pipeline.ts` — async-generator `runPipeline()` that yields `PipelineEvent` values (`stage_start`, `stage_complete`, `stage_skipped`, `doc_type_resolved`, `version_created`, `revision_applied`, `provider_routed`, `gate_reached`, `manifest_built`, `error`, `complete`).
- `src/lib/manifest.ts` — builds the generation manifest (prompt versions, provider config, role config, validation outcomes) for reproducibility.
- `src/lib/diff.ts` — diffs document versions for living-document change tracking.
- `src/lib/memory.ts` + `src/lib/memory-manager.ts` — derive and persist project memory across runs.

**Public surface:** `runPipeline(input): AsyncGenerator<PipelineEvent>`. The `/api/generate` route forwards these events to the browser as SSE.

### Layer 3 — Intelligence

**What it is:** the AI Council and the reasoning stages.

**Components:**
- `src/lib/prompts.ts` — every stage's system + user prompt builders (Understand, Hypotheses, Debate×2, Moderator, Requirements, Gaps/Risks, Strategy, Generate, Validate, Revise, Validation Council, Metadata, Research, Competitor, Feature Recs, Cost Estimate, Sprint Plan, Architecture Simulation, Knowledge Graph, Decision Journal, Scenario, AI Voting, Dynamic Council, Acceptance Tests, Backlog, Roadmap, Evaluation).
- `src/lib/domain-packs.ts` — 8 domain packs (fintech, healthcare, enterprise-workflow, developer-tools, consumer-app, analytics, ai-product, migration) with specialized roles, risk checklists, doc structures, policy rules, rubrics, recommended providers.
- `src/lib/llm.ts` — shared ZAI instance, `chat()` / `chatJson()` with retry + JSON extraction.
- `src/lib/completeness.ts` — completeness scoring for stage outputs.

**Public surface:** the prompt builders are pure functions; the council stages call `executeWithRouting()` from Layer 5.

### Layer 4 — Knowledge

**What it is:** the persistent memory, knowledge graph, decision journal, evidence library, and prompt registry.

**Components:**
- `KnowledgeNode` + `KnowledgeEdge` — the typed, persistent project knowledge graph.
- `DecisionJournal` — append-only decision records with rationale, alternatives, tradeoffs, supporters, objectors, confidence.
- `ResearchEntry` + `EvidenceLibrary` — autonomous research + reusable evidence.
- `Competitor` + `Scenario` — competitor intelligence and what-if analysis.
- `PromptRegistry` — versioned prompt storage with change history.
- `DomainPack` — specialized configurations persisted to the DB.
- `src/lib/impact-propagator.ts` — change-impact analysis across the graph.

**Public surface:** Prisma models + the lib functions that read/write them.

### Layer 5 — Execution

**What it is:** the provider router — the bridge between the council and the actual LLMs.

**Components:**
- `src/lib/provider-router.ts` — 4-mode routing (`free`, `hybrid`, `own-keys`, `local`), fallback chains, execution backends (`zai-default`, `openai-compatible`), `RoutingDecision` records, `executeWithRouting()` entry point.
- `src/lib/provider-catalog.ts` — 23-provider registry (bootstrapped from [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources)).
- `src/lib/provider-performance.ts` — per-provider latency / error / quality tracking.
- `ProviderEntry` (catalog rows), `ProviderConfig` (user keys, masked), `ProviderPerformance` (telemetry), `AppSettings` (mode + registry version).

**Public surface:** `executeWithRouting(role, taskType, system, user, opts)` returns `{ text, decision }`.

### Layer 6 — Governance

**What it is:** the controls that make the output trustworthy.

**Components:**
- `src/lib/policy-engine.ts` — `checkInputPolicies()` (credential detection), `checkOutputPolicies()` (secret-leak detection), `getProjectPolicies()`. Six policy types: input_restriction, output_restriction, role_restriction, provider_restriction, data_handling, escalation.
- `src/lib/evaluation.ts` — rubric-based evaluation with per-doc-type rubrics and benchmark modes (golden / synthetic / prior / feedback / human / rubric).
- `src/lib/health-score.ts` — 7-area composite (memory completeness, requirement clarity, risk coverage, traceability, validation quality, provider reliability, document freshness).
- `src/lib/next-action.ts` — next-best-action engine across 6 categories (context / refine / validate / deliver / review / export) and 12 action types.
- `src/lib/audit.ts` — `audit(action, details)` writes to `AuditLog`.
- `src/lib/notifications.ts` — `notify(type, title, message, details)` writes to `Notification` and feeds the UI bell.
- `DriftAlert` — flags stale context (requirement_changed, repo_updated, stakeholder_added, assumption_invalid, doc_stale).

**Public surface:** pure functions (`calculateHealthScore`, `recommendNextActions`, `checkOutputPolicies`) plus the audit/notify helpers.

### Layer 7 — Infrastructure

**What it is:** the storage, runtime, and external integrations.

**Components:**
- **Prisma 6** + SQLite (default) or PostgreSQL (production). Schema in `prisma/schema.prisma`.
- **Next.js 16** App Router — `runtime = "nodejs"`, `dynamic = "force-dynamic"` on all routes.
- **z-ai-web-dev-sdk** — the built-in free-tier execution backend (no key required).
- `src/lib/db.ts` — the Prisma client singleton.
- `src/lib/github.ts` — public GitHub REST fetcher (metadata, README, recursive tree, package-hint detection) with rate-limit handling.
- 38 API routes under `src/app/api/`.

**Public surface:** the Prisma client, the GitHub fetcher, and the HTTP API.

---

## 2. The 29 pipeline stages

Stages run in `STAGE_ORDER` (see `src/lib/pipeline.ts`). Each stage emits a `stage_start` event, optionally routes through the provider router, persists its output to a `DocVersion` field, emits a `stage_complete` event, and records an `ObservabilityEvent`.

| #  | Stage                  | Purpose                                                        |
|----|------------------------|----------------------------------------------------------------|
| 1  | `ingest`               | Fetch repo intelligence, collect source bundle                |
| 2  | `understand`           | Build context map + tech stack + architecture clues           |
| 3  | `dynamic_council`      | Adapt council composition to detected domain                  |
| 4  | `research`             | Autonomous research: topics, evidence, references             |
| 5  | `hypotheses`           | Generate candidate hypotheses                                  |
| 6  | `debate_round1`        | Council Round 1 — independent proposals per role              |
| 7  | `debate_round2`        | Council Round 2 — roles respond to each other                 |
| 8  | `moderator`            | Moderator synthesis + consensus or honest disagreement        |
| 9  | `ai_voting`            | Weighted multi-criteria voting with rationale                 |
| 10 | `requirements`         | Functional + non-functional discovery with inference engine   |
| 11 | `gaps_risks`           | 10 gap categories × 6 risk categories                         |
| 12 | `competitor_intel`     | Competitor strengths, weaknesses, gaps, differentiation       |
| 13 | `feature_recs`         | MVP / phase 2 / activation / retention / monetization / etc.  |
| 14 | `strategy`             | Pick the document type (PRD / BRD / …) with justification     |
| 15 | `generate`             | Draft the document in Markdown with Mermaid diagrams          |
| 16 | `validate`             | Self-critique + 9 quality gates                                |
| 17 | `revise`               | Revise weak sections (at most one pass)                       |
| 18 | `validation_council`   | Cross-role validation review with consensus                   |
| 19 | `acceptance_tests`     | Generate Given/When/Then from requirements                    |
| 20 | `backlog`              | Convert requirements to epics/stories/tasks/milestones        |
| 21 | `roadmap`              | Phased delivery with dependencies and risks                   |
| 22 | `evaluation`           | Rubric-based scoring with benchmark mode                      |
| 23 | `cost_estimate`        | Backend / frontend / QA / DevOps / AI / infra cost breakdown  |
| 24 | `sprint_plan`          | Sprints with goals, items, effort, owners                     |
| 25 | `arch_simulation`      | Failure modes, bottlenecks, what-ifs, operational risks       |
| 26 | `scenario_simulation`  | "What if" analysis with cross-functional implications         |
| 27 | `knowledge_graph`      | Update typed nodes + relations                                 |
| 28 | `decision_journal`     | Append decisions with rationale, alternatives, confidence     |
| 29 | `metadata`             | Traceability matrix, assumptions, confidence, open questions  |

Stage groupings visible in the UI pipeline progress:
- **Ingest & Understand** — stages 1–4
- **Council Debate** — stages 5–9
- **Requirements & Strategy** — stages 10–14
- **Document** — stages 15–18
- **Tests & Delivery** — stages 19–22
- **Intelligence & Simulation** — stages 23–26
- **Knowledge & Metadata** — stages 27–29

---

## 3. Data flow

```
User input (repo URL / text / mixed)
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ POST /api/generate                                           │
│   • validates input                                          │
│   • creates Project (if new) + DocVersion                    │
│   • calls runPipeline(input) — async generator               │
│   • forwards PipelineEvent → text/event-stream (SSE)         │
└──────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ runPipeline()                                                │
│   for each stage in STAGE_ORDER:                             │
│     1. emit stage_start                                      │
│     2. build prompt (Layer 3)                                │
│     3. executeWithRouting(role, taskType, system, user)      │
│        └─ ProviderRouter picks backend:                      │
│           • zai-default  → z-ai-web-dev-sdk                  │
│           • openai-compatible → fetch to provider baseUrl    │
│        └─ Records RoutingDecision + ProviderLogEntry         │
│        └─ Records ObservabilityEvent (duration, tokens,…)    │
│        └─ Records ProviderPerformance                        │
│     4. parse output (JSON or Markdown)                       │
│     5. persist to DocVersion.<stageField>                    │
│     6. checkOutputPolicies() — redact secrets if found       │
│     7. emit stage_complete                                   │
│     8. audit(action, details)                                │
│   emit manifest_built + complete                             │
└──────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ Browser (Zustand store)                                      │
│   • EventSource consumes SSE                                 │
│   • Updates live stage status → pipeline-progress UI         │
│   • Updates stage panels as data arrives                     │
│   • On complete: fetch full version via GET /api/projects/[id]│
└──────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│ Persistent state (Prisma + SQLite)                           │
│   • Project (memory, providerPlan, repoDetails)              │
│   • DocVersion (all stage outputs as JSON strings)           │
│   • KnowledgeNode + KnowledgeEdge                            │
│   • DecisionJournal, ResearchEntry, Competitor, Scenario     │
│   • AcceptanceTest, BacklogItem, RoadmapPhase, Evaluation    │
│   • AuditLog, ObservabilityEvent, ProviderPerformance        │
│   • Comment, Notification, UserFeedback, Policy              │
│   • DriftAlert, EvidenceLibrary, PromptRegistry, DomainPack  │
│   • ProviderEntry, ProviderConfig, AppSettings               │
└──────────────────────────────────────────────────────────────┘
```

### Streaming contract

The SSE stream emits one event per `PipelineEvent`. Event names match the `type` field:

```
event: stage_start
data: {"stage":"understand","label":"Understanding source + repo intelligence"}

event: provider_routed
data: {"stage":"understand","decision":{...}}

event: stage_complete
data: {"stage":"understand","data":{...}}

event: complete
data: {"projectId":"...","versionId":"..."}
```

The store replays these into the live UI; the final `complete` event triggers a full version fetch for rendering the document, council, tests, delivery, and govern tabs.

---

## 4. Database models overview

29 Prisma models in `prisma/schema.prisma`. JSON columns are stored as strings and parsed with `safeParse<T>()` on read.

### Core
- **User**, **Post** — legacy scaffolding (kept for compatibility; not used by the AI OS).
- **Project** — the persistent "memory" unit. Holds long-lived context (goals, stakeholders, terminology, decisions, assumptions, risks, open questions, prior summaries) and the provider routing plan.
- **DocVersion** — a single generated artifact. Carries every stage output as a JSON string field (29+ fields), plus revision state, gate state, change tracking, and the generation manifest.
- **AppSettings** — singleton tracking onboarding completion, provider mode, registry version + source.

### Knowledge graph
- **KnowledgeNode** — typed node (goal, epic, feature, requirement, AC, test case, release, risk, decision, stakeholder, dependency).
- **KnowledgeEdge** — directed edge with relation (decomposes_into, depends_on, tested_by, released_in, mitigates, decided_by, impacts, owned_by).
- **DecisionJournal** — append-only decisions with rationale, alternatives, tradeoffs, supporters, objectors, confidence.
- **ResearchEntry** — autonomous research evidence with references.
- **Competitor** — competitor analysis entry.
- **Scenario** — what-if analysis with implications.

### Providers
- **ProviderEntry** — catalog row (bootstrapped from cheahjs/free-llm-api-resources).
- **ProviderConfig** — user API key (masked + raw value — see SECURITY.md).
- **ProviderPerformance** — per-provider × stage × role telemetry.

### Delivery
- **AcceptanceTest** — Given/When/Then per requirement.
- **BacklogItem** — epic / story / task / subtask / bug / milestone.
- **RoadmapPhase** — phased delivery with contents JSON.

### Governance
- **AuditLog** — every significant action.
- **ObservabilityEvent** — per-stage timing, tokens, status.
- **Evaluation** — rubric scores + benchmark mode.
- **PromptRegistry** — versioned prompts with change history.
- **UserFeedback** — 6 rating types + accept/reject/edit action.
- **Policy** — input / output / role / provider / data-handling / escalation restrictions.
- **EvidenceLibrary** — reusable evidence across runs.
- **DriftAlert** — stale context flags.
- **DomainPack** — specialized configurations.
- **Comment** — section-targeted annotations.
- **Notification** — event-driven alerts.
- **PluginRegistry** — extensible skill format.

---

## 5. API surface overview

38 routes under `src/app/api/`. All export `runtime = "nodejs"` and `dynamic = "force-dynamic"`. Dynamic routes use `params: Promise<{ id: string }>`.

### Generation & projects
| Method | Route                          | Purpose                                       |
|--------|--------------------------------|-----------------------------------------------|
| POST   | `/api/generate`                | Start a pipeline run; returns SSE stream      |
| GET    | `/api/projects`                | List projects                                 |
| GET    | `/api/projects/[id]`           | Get full project (all versions + stages)      |
| GET    | `/api/projects/[id]/decisions` | List decisions for a project                  |
| GET    | `/api/projects/[id]/knowledge` | Knowledge graph nodes + edges                 |
| GET    | `/api/projects/[id]/scenarios` | Scenario simulations                          |
| GET    | `/api/versions/[id]`           | Single version                                |
| GET    | `/api/versions/[id]/export`    | Export version (md / json / csv / issues)     |

### Pipeline outputs
| Method | Route                          | Purpose                                       |
|--------|--------------------------------|-----------------------------------------------|
| GET    | `/api/acceptance-tests`        | Acceptance tests + coverage stats             |
| GET    | `/api/backlog`                 | Backlog items                                 |
| GET    | `/api/roadmap`                 | Roadmap phases                                |
| GET    | `/api/evidence`                | Evidence library                              |
| GET    | `/api/drift`                   | Drift alerts                                  |
| GET    | `/api/impact`                  | Impact propagation                            |
| GET    | `/api/completeness`            | Completeness scoring                          |
| GET    | `/api/cross-project`           | Cross-project intelligence                    |

### Governance
| Method | Route                          | Purpose                                       |
|--------|--------------------------------|-----------------------------------------------|
| GET    | `/api/health`                  | Project health score (7-area)                 |
| GET    | `/api/next-action`             | Next-best-action recommendations              |
| GET    | `/api/observability`           | Observability events                          |
| GET    | `/api/audit`                   | Audit log                                     |
| GET    | `/api/policies`                | List policies                                 |
| POST   | `/api/policies`                | Create a policy                               |
| DELETE | `/api/policies/[id]`           | Delete a policy                               |
| POST   | `/api/feedback`                | Submit user feedback                          |
| GET    | `/api/feedback`                | List feedback                                 |

### Domain & prompts
| Method | Route                          | Purpose                                       |
|--------|--------------------------------|-----------------------------------------------|
| GET    | `/api/domain-packs`            | List domain packs                             |
| GET    | `/api/prompts`                 | List prompt registry entries                  |
| POST   | `/api/prompts`                 | Create a prompt entry                         |

### Providers
| Method | Route                              | Purpose                                       |
|--------|------------------------------------|-----------------------------------------------|
| GET    | `/api/providers/bootstrap`         | Bootstrap / refresh provider registry         |
| GET    | `/api/providers/keys`              | List configured keys (masked)                 |
| POST   | `/api/providers/keys`              | Add / update a key                            |
| DELETE | `/api/providers/keys/[id]`         | Remove a key                                  |
| GET    | `/api/provider-performance`        | Provider performance telemetry                |

### Collaboration
| Method | Route                          | Purpose                                       |
|--------|--------------------------------|-----------------------------------------------|
| GET    | `/api/comments`                 | List comments                                 |
| POST   | `/api/comments`                 | Add a comment                                 |
| DELETE | `/api/comments/[id]`            | Delete a comment                              |
| GET    | `/api/notifications`            | List notifications                            |
| DELETE | `/api/notifications/[id]`       | Dismiss a notification                        |

### System
| Method | Route                          | Purpose                                       |
|--------|--------------------------------|-----------------------------------------------|
| GET    | `/api/dashboard`               | Dashboard summary                             |
| POST   | `/api/onboarding`              | Complete onboarding (mode + keys)             |
| GET    | `/api/settings`                | App settings (mode, registry version)         |
| POST   | `/api/settings`                | Update settings                               |
| GET    | `/api/plugins`                 | List plugin registry                          |

---

## 6. Where to read next

- [`docs/PROVIDER_SETUP.md`](./PROVIDER_SETUP.md) — provider modes, key acquisition, troubleshooting.
- [`docs/FAQ.md`](./FAQ.md) — common questions.
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — how to extend each layer.
- [`skill/SKILL.md`](../skill/SKILL.md) — the portable, framework-free version of this architecture.
- [`src/lib/pipeline.ts`](../src/lib/pipeline.ts) — the source of truth for stage order and event shapes.
- [`prisma/schema.prisma`](../prisma/schema.prisma) — the source of truth for data models.
