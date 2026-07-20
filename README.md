# CouncilForge

> A full AI Operating System that turns source material into decision-ready documents — through a visible, multi-role AI Council debate.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Bun](https://img.shields.io/badge/Bun-runtime-f9f1e1)
![Pipeline](https://img.shields.io/badge/Pipeline-29%20stages-7C3AED)
![Providers](https://img.shields.io/badge/Providers-23%20bootstrapped-10B981)

<!-- screenshot: hero — dashboard with live council debate in progress -->

---

## What is CouncilForge?

**CouncilForge** is an open-source AI operating system that takes raw source material — a GitHub repo, a product brief, pasted notes, or a mix of all three — and produces a complete, decision-ready intelligence package: requirements, gaps & risks, a chosen document type (PRD / BRD / FRD / SOW / Tech Design / Audit / Roadmap / Gap Analysis), acceptance tests, a backlog, a roadmap, an evaluation, cost & sprint estimates, and a persistent decision journal.

The core idea is a **visible AI Council**. Instead of a single prompt that emits a generic document, CouncilForge runs an adversarial, multi-role debate — Product, Business, Architecture, Engineering, QA, Security, UX, Delivery, Compliance — over two rounds, with a moderator that synthesizes consensus or honestly reports disagreement. Every important decision is logged with rationale, alternatives, and confidence. The output has already survived the cross-functional review it would normally get in week three.

Under the hood it's a real Next.js 16 application: a 29-stage streaming pipeline, 38 API routes, 29 Prisma models, a knowledge graph, an evaluation engine, a policy engine, observability, and a provider router with 23 auto-bootstrapped providers and four execution modes. The framework-free **skill package** in [`/skill`](./skill) lets you run the same council inside any AI IDE — Claude Code, Cursor, Codex, Kiro, GitHub Copilot, and more — with zero code dependencies.

**Who it's for:** product managers, business analysts, solutions architects, engineering leads, and founders who need to turn messy inputs into requirements, PRDs/BRDs/SOWs, roadmaps, and backlogs they can defend — and AI-IDE users who want a portable, multi-agent reasoning workflow instead of a single-shot prompt.

> **New here?** Read this file, then jump to [Quick Start](#quick-start) to run it locally in under five minutes, or [`examples/README.md`](./examples/README.md) to see input → output first.

---

## Why CouncilForge?

Most "AI document generators" collapse to a single prompt: paste a brief, get a generic PRD, lose every trace of why it says what it says. The result looks plausible but skips the hard part — the cross-functional scrutiny that catches missing requirements, security holes, and infeasible timelines *before* engineering picks up the work.

CouncilForge is built on a different premise: **the reasoning is the product**. The visible debate, the decision journal, the traceability matrix, and the knowledge graph are not extras bolted onto a document — they are the artifact. When a stakeholder asks "why did we pick SaaS over self-hosted?", the answer is one click away, with the security reviewer's objection, the engineering lead's feasibility note, and the moderator's tie-breaker all on the record.

It is also **provider-agnostic and portable**. You are not locked into one vendor's chat UI or pricing. The same council that runs in the web app can run inside your IDE as a pure-Markdown skill, or air-gapped against a local model. Free-tier providers handle most stages; a single paid key lifts the long-pole Generate stage to frontier quality.

---

## Key Features

| Area | Feature | What it does |
|------|---------|--------------|
| **Council** | Multi-role debate | 8+ expert roles debate over 2 rounds; moderator synthesizes consensus or honest disagreement |
| | AI voting | Weighted multi-criteria voting with explicit rationale per role |
| | Dynamic council | Domain packs add specialized roles (fintech, healthcare, dev-tools, …) |
| | Decision journal | Every decision logged with alternatives, tradeoffs, supporters, objectors, confidence |
| **Intelligence** | Repository intel | Fetches metadata, README, full tree, and package hints from public GitHub |
| | Autonomous research | Competitor analysis, feature recommendations, cost & sprint estimates |
| | Knowledge graph | Typed nodes (goal → epic → feature → requirement → AC → test → release) with relations |
| | Simulation | Architecture failure modes + cross-functional "what-if" scenario analysis |
| | Confidence scoring | Six-axis confidence: business, requirements, technical, timeline, risk, validation |
| **Delivery** | Acceptance tests | Given/When/Then generated from requirements, with coverage tracking |
| | Backlog conversion | Epics → stories → tasks → milestones, traceable to requirements |
| | Roadmap intelligence | Phased delivery with dependencies, risks, and parallelism |
| | Cost & sprint estimates | Backend / frontend / QA / DevOps / AI / infra breakdown |
| | Living documents | Version diffs, revisions, and traceability across runs |
| **Governance** | Policy engine | Input/output/role/provider/data-handling restrictions + secret-leak detection |
| | Evaluation engine | Rubric-based scoring with per-doc-type rubrics and benchmark modes |
| | Observability | Per-stage timing, token usage, provider latency, fallbacks, errors |
| | Health score | 7-area composite metric across memory, requirements, risks, traceability, validation, providers, freshness |
| | Next-best-action | Priority-ranked recommendations across 6 categories and 12 action types |
| | Audit log | Every significant action recorded for enterprise governance |
| **Platform** | 29-stage pipeline | Streaming SSE pipeline with stage events, gates, and revisions |
| | Provider router | 4 modes (free / hybrid / own-keys / local) with fallback chains |
| | 23-provider registry | Auto-bootstrapped from `cheahjs/free-llm-api-resources` |
| | Portable skill | Pure-Markdown package runs in 6+ AI IDEs with no code dependencies |
| | 8 domain packs | Fintech, healthcare, enterprise-workflow, developer-tools, consumer-app, analytics, ai-product, migration |
| | 9 document types | PRD, BRD, FRD, SOW, Tech Design, Audit, Roadmap, Gap Analysis, + AUTO |

---

## Architecture Overview

CouncilForge is organized into seven cooperating layers. Each has a clear responsibility and a small public surface for the layer above it.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Experience Layer      →  UI · Dashboard · 12 Tabs · Exports             │
│                          Next.js 16 app, shadcn/ui, SSE streaming        │
├─────────────────────────────────────────────────────────────────────────┤
│  Orchestration Layer   →  Orchestrator AI · 29-Stage Pipeline · Gates    │
│                          async generator, revisions, manifest            │
├─────────────────────────────────────────────────────────────────────────┤
│  Intelligence Layer    →  Council · Research · Validation · Evaluation   │
│                          8+ roles, 2-round debate, moderator, voting     │
├─────────────────────────────────────────────────────────────────────────┤
│  Knowledge Layer       →  Graph · Memory · Decisions · Evidence          │
│                          typed nodes/edges, prompt registry, packs       │
├─────────────────────────────────────────────────────────────────────────┤
│  Execution Layer       →  Backlog · Roadmap · Sprints · Sync             │
│                          tests, milestones, cost & sprint estimates      │
├─────────────────────────────────────────────────────────────────────────┤
│  Governance Layer      →  Policies · Audit · Prompts · Security          │
│                          policy engine, health score, observability      │
├─────────────────────────────────────────────────────────────────────────┤
│  Infrastructure Layer  →  Providers · Router · Registry · Observability  │
│                          Prisma + SQLite, z-ai-web-dev-sdk, 38 routes    │
└─────────────────────────────────────────────────────────────────────────┘
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full layer breakdown, all 29 stages, data flow diagram, DB models, and the complete API surface. Rendered Mermaid diagrams live in [`assets/diagrams/`](./assets/diagrams/): [architecture layers](./assets/diagrams/architecture-layers.md) · [pipeline stages](./assets/diagrams/pipeline-stages.md) · [council flow](./assets/diagrams/council-flow.md) · [provider routing](./assets/diagrams/provider-routing.md).

---

## AI Council Workflow

The pipeline runs **29 stages** in order, streamed live to the browser as SSE events. Stages are grouped into seven visible phases:

| Phase | Stages | What happens |
|-------|--------|--------------|
| **Ingest & Understand** | 1–4 | Fetch repo intelligence, build a context map, adapt the council composition to the detected domain, run autonomous research |
| **Council Debate** | 5–9 | Generate hypotheses, run Round 1 (independent proposals per role) and Round 2 (roles respond to each other), moderator synthesis, weighted AI voting |
| **Requirements & Strategy** | 10–14 | Functional + non-functional discovery, gaps & risks (10 × 6 categories), competitor intel, feature recommendations, pick the document type with justification |
| **Document** | 15–18 | Draft in Markdown with Mermaid diagrams, self-critique against 9 quality gates, revise weak sections (one pass), cross-role validation review |
| **Tests & Delivery** | 19–22 | Given/When/Then acceptance tests, backlog conversion, phased roadmap, rubric-based evaluation |
| **Intelligence & Simulation** | 23–26 | Cost breakdown, sprint plan, architecture failure-mode simulation, cross-functional scenario analysis |
| **Knowledge & Metadata** | 27–29 | Update the typed knowledge graph, append to the decision journal, emit traceability matrix + assumptions + open questions |

Every stage emits `stage_start` / `stage_complete` events; failures emit `stage_skipped` with a reason and the pipeline degrades gracefully. A final `complete` event triggers a full version fetch that renders the document, council, tests, delivery, and govern tabs.

---

## Provider Routing

Pick one of four execution modes during onboarding (changeable any time in the **Providers** tab):

| Mode | What it does | When to use it |
|------|--------------|----------------|
| **`free`** | Uses the built-in `z-ai-web-dev-sdk` plus any provider that offers a free tier with no signup. Zero configuration. | First run, demos, evaluation, light usage. Cost: $0. |
| **`hybrid`** | Uses your keys when configured, falls back to free providers for the rest. Prefers paid keys on quality-critical stages (Generate, Validate, Evaluation). | Most users — best cost/quality trade-off. |
| **`own-keys`** | Uses **only** providers you have configured with API keys. A stage fails rather than falling back to a free provider. | Production, strict compliance, predictable cost. |
| **`local`** | Routes everything to a local OpenAI-compatible endpoint (Ollama, LM Studio, vLLM). No traffic leaves your machine. | Air-gapped environments, sensitive data, zero recurring cost. |

The 23-provider registry is **auto-bootstrapped** from [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources). Refresh it any time from the Providers tab.

---

## Quick Start

Under five minutes, zero configuration required.

### Prerequisites

- **Node.js 18+** or **[Bun](https://bun.sh)** (recommended — faster installs)
- A modern browser

### Steps

```bash
# 1. Clone
git clone https://github.com/Pratikrishi97/councilforge.git
cd councilforge

# 2. Install dependencies (Bun recommended)
bun install
# …or: npm install / pnpm install / yarn install

# 3. Initialize the database (SQLite — no external services required)
bun run db:push

# 4. Start the dev server
bun run dev
```

Open **http://localhost:3000**. The onboarding modal walks you through picking a provider mode and (optionally) adding API keys. The default **`free`** mode works with zero configuration thanks to the built-in `z-ai-web-dev-sdk`.

Paste a GitHub URL or some notes, pick a document type (or `AUTO`), and watch the 29-stage council run live. That's it.

---

## Provider Setup

The default `free` mode needs no keys. When you want higher quality — especially on the Generate stage — switch to `hybrid` mode and add one paid key. A common starter combo:

- **Groq** (free tier, low latency) — fast debate rounds.
- **OpenRouter** with ~$5 of credits — frontier model for the Generate stage.

For step-by-step key setup for every supported provider, security notes, local-mode configuration, and troubleshooting, see [`docs/PROVIDER_SETUP.md`](./docs/PROVIDER_SETUP.md).

---

## Portable Skill

The [`/skill`](./skill) directory is a **framework-free, pure-Markdown** package. It captures the same council, workflows, templates, validators, and provider routing rules used by the live app — with zero code dependencies. Any AI IDE or agent runtime that can read Markdown can run it.

### Use it with your IDE

1. Read [`skill/SKILL.md`](./skill/SKILL.md) — it's the contract.
2. Pick your IDE's adapter from [`skill/adapters/`](./skill/adapters/):

   | IDE | Adapter file | Setup |
   |-----|--------------|-------|
   | Claude Code | `claude-code.md` | `CLAUDE.md` includes `SKILL.md` |
   | Cursor | `cursor.md` | `.cursorrules` references `SKILL.md` |
   | Codex (OpenAI) | `codex.md` | `AGENTS.md` references `SKILL.md` |
   | Kiro | `kiro.md` | `.kiro/steering/*.md` imports |
   | GitHub Copilot | `github-copilot.md` | `.github/copilot-instructions.md` |

3. Run the sample input in [`skill/examples/sample-input.md`](./skill/examples/sample-input.md) and diff against the sample PRD output.

### What's inside the skill

```
skill/
├── SKILL.md            ← root entrypoint / contract
├── README.md           ← skill overview
├── COMPATIBILITY.md    ← platform compatibility matrix
├── roles/              ← 10 council role prompts
├── workflows/          ← 10 stage workflow definitions
├── templates/          ← 6 canonical document structures (cover 9 doc types)
├── providers/          ← 23-provider registry + routing rules
├── validators/         ← quality-gate rule sets
├── examples/           ← sample input + output
└── adapters/           ← 5 IDE-specific setup guides
```

For the full platform compatibility matrix, per-stage bottleneck notes, and recommended minimum model specs, see [`skill/COMPATIBILITY.md`](./skill/COMPATIBILITY.md).

---

## Supported Exports

Every generated version can be exported via `GET /api/versions/[id]/export?format=…`:

| Format | Use case |
|--------|----------|
| **Markdown** (`.md`) | Wikis, GitHub, Notion, Obsidian — includes Mermaid diagrams |
| **JSON** (`.json`) | Programmatic consumption, re-import, custom rendering |
| **CSV** (`.csv`) | Spreadsheet import — requirements, tests, backlog as rows |
| **Issues** | Issue-tracker format for GitHub Issues / Jira / Linear import |

Exports are generated on demand from the persisted `DocVersion` and include the document, requirements, acceptance tests, backlog, roadmap, and traceability matrix.

---

## Project Structure

```
councilforge/
├── src/
│   ├── app/                  # Next.js 16 App Router
│   │   ├── api/              # 38 API routes
│   │   ├── page.tsx          # main workspace (12 tabs)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   └── workspace/        # 13 workspace components
│   ├── lib/                  # pipeline, prompts, router, governance
│   ├── store/                # Zustand workspace store
│   └── hooks/
├── prisma/
│   └── schema.prisma         # 29 models
├── skill/                    # portable Markdown skill package (41 files)
├── docs/                     # ARCHITECTURE, PROVIDER_SETUP, FAQ
├── public/
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

---

## Documentation

| Doc | What it covers |
|-----|----------------|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | 7 layers, 29 pipeline stages, data flow, DB models, API surface |
| [`docs/PROVIDER_SETUP.md`](./docs/PROVIDER_SETUP.md) | Four modes, key setup per provider, local mode, troubleshooting |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Production deployment, reverse proxy, SQLite→PostgreSQL, env vars |
| [`docs/FAQ.md`](./docs/FAQ.md) | Common questions on usage, providers, security, and the pipeline |
| [`examples/README.md`](./examples/README.md) | Worked examples — start here to see input → output |
| [`assets/README.md`](./assets/README.md) | Architecture, pipeline, council, and routing diagrams |
| [`ROADMAP.md`](./ROADMAP.md) | Now / Next / Later / Non-goals |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Dev setup, coding style, and extension guides per layer |
| [`CHANGELOG.md`](./CHANGELOG.md) | Release history |
| [`SECURITY.md`](./SECURITY.md) | Threat model and hardening checklist |
| [`skill/SKILL.md`](./skill/SKILL.md) | The portable skill contract |
| [`skill/COMPATIBILITY.md`](./skill/COMPATIBILITY.md) | IDE compatibility matrix and minimum model specs |

---

## Roadmap

CouncilForge is at **v1.0.0** with the feature set above. Next up: auth & multi-tenancy, API-key encryption at rest, a first-class PostgreSQL path, and a benchmark suite. Later: vector/semantic memory, real-time collaboration, more domain packs, and a plugin marketplace.

See the full [`ROADMAP.md`](./ROADMAP.md) (Now / Next / Later / Non-goals) and [`CHANGELOG.md`](./CHANGELOG.md) for what shipped in v1.0.0.

---

## Contributing

Contributions are welcome — new council roles, providers, document types, pipeline stages, domain packs, UI polish, and docs. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development setup, coding style, and step-by-step guides for extending each layer.

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

---

## License

MIT © 2025 CouncilForge Contributors. See [`LICENSE`](./LICENSE).

---

## FAQ

**1. Do I need to pay for an LLM provider?**
No. The default `free` mode uses the built-in `z-ai-web-dev-sdk` and works with zero configuration. For higher-quality documents (especially the Generate stage), switch to `hybrid` mode and add one paid key — ~$5 of OpenRouter credits lasts a long time.

**2. How is this different from ChatGPT / Claude / Gemini?**
Those run a single prompt through a single model and emit one document. CouncilForge runs a multi-role council over 29 stages, persists memory and decisions, produces a document *plus* tests, backlog, roadmap, and a knowledge graph, and is provider-agnostic with four execution modes. The reasoning is visible and auditable.

**3. Can I run this entirely offline / air-gapped?**
Yes. Use `local` mode and point the router at a local OpenAI-compatible endpoint (Ollama, LM Studio, vLLM). No traffic leaves your machine. See [`docs/PROVIDER_SETUP.md`](./docs/PROVIDER_SETUP.md).

**4. How long does a full run take?**
5–15 minutes on free tiers (rate limits cause fallbacks and retries). 2–5 minutes on paid providers with low-latency options (Groq, Cerebras). The Generate stage is the long pole — a frontier model there adds 30–90 seconds but dramatically improves quality.

**5. Will my API keys leak into documents?**
No. The policy engine's `checkOutputPolicies()` runs on every generated document and scans for credential patterns (AWS keys, OpenAI keys, JWTs, private keys, connection strings). Detected leaks are redacted and a `policy_violation` notification is raised. Keys are never written to logs, observability events, or audit entries. See [`SECURITY.md`](./SECURITY.md).

For more, see [`docs/FAQ.md`](./docs/FAQ.md).

---

## Known Limitations

CouncilForge is honest about what it is and isn't. As of v1.0.0:

1. **Single-user deployment only.** NextAuth is not wired up; there are no user accounts, workspaces, or per-project ACLs. Multi-user SaaS requires the auth & multi-tenancy work on the roadmap.
2. **API keys are stored unencrypted at rest.** `ProviderConfig.apiKeyEnc` currently holds the raw key value. Add envelope encryption (KMS / OS keychain) before any multi-user or shared deployment. See [`SECURITY.md`](./SECURITY.md).
3. **SQLite by default.** Fine for single-user use; not suited for concurrent multi-writer workloads. Point Prisma at PostgreSQL for production.
4. **Memory recall is lexical, not semantic.** Cross-project intelligence uses keyword matching, not embeddings. Vector memory is on the roadmap.
5. **Free-tier quality has ceilings.** The `free` mode is good for most stages but the Generate stage benefits materially from a frontier model in `hybrid` or `own-keys` mode.
6. **No automated screenshot / E2E test suite yet.** The pipeline is exercised manually; a benchmark and golden-set regression suite is on the roadmap.
7. **Provider registry depends on an upstream repo.** The 23-provider catalog is bootstrapped from `cheahjs/free-llm-api-resources`. If that repo changes schema or removes providers, the bootstrap step needs updating.

---

## Credits

CouncilForge stands on the shoulders of several excellent projects:

- **[cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources)** — the source of the 23-provider registry that makes zero-config and free-tier routing possible.
- **[shadcn/ui](https://ui.shadcn.com/)** — the component system powering the entire UI.
- **[Next.js 16](https://nextjs.org/)** — the App Router, server components, route handlers, and runtime.
- **[Prisma](https://www.prisma.io/)** — the ORM behind the 29 data models.
- **[Tailwind CSS 4](https://tailwindcss.com/)** — styling.
- **[z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk)** — the built-in free-tier execution backend.
- **[Radix UI](https://www.radix-ui.com/)** — accessible primitives underlying shadcn/ui.
- Every council role, workflow, and template was written with care for the practitioners it represents — product managers, business analysts, architects, engineers, QA, security, UX, delivery, and compliance leads.

Built for teams who believe the reasoning is the product.
