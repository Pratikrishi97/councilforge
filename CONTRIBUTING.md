# Contributing to CouncilForge

Thanks for your interest in contributing! This document covers development setup, project structure, coding style, and step-by-step guides for the most common contributions.

> 💬 **Need help?** Open a [discussion](https://github.com/Pratikrishi97/councilforge/discussions) or check [`docs/FAQ.md`](./docs/FAQ.md) first.

---

## Development setup

### Prerequisites

- **[Bun](https://bun.sh) 1.1+** (recommended) or Node.js 18+
- A modern browser
- Optional: an OpenAI-compatible API key for one of the [supported providers](./docs/PROVIDER_SETUP.md)

### First-time setup

```bash
git clone https://github.com/Pratikrishi97/councilforge.git
cd councilforge
bun install
bun run db:push      # creates local SQLite DB + schema
bun run dev          # starts Next.js on http://localhost:3000
```

Open the app, complete the onboarding modal (default `free` mode needs no keys), and you're ready to develop.

### Useful scripts

| Script            | What it does                                         |
|-------------------|------------------------------------------------------|
| `bun run dev`     | Start the dev server with hot reload (port 3000).    |
| `bun run build`   | Production build (standalone output).                |
| `bun run start`   | Run the production server.                            |
| `bun run lint`    | ESLint across the project.                            |
| `bun run db:push` | Push schema changes to the local SQLite DB.          |
| `bun run db:generate` | Regenerate the Prisma client.                     |
| `bun run db:migrate` | Create a migration (dev).                          |
| `bun run db:reset`  | **Destructive** — drops all data and re-applies.   |

### Type checking

```bash
bunx tsc --noEmit
```

The project has a few pre-existing TypeScript errors in legacy files outside most contributors' reach — focus on not introducing *new* errors in your changes.

---

## Project structure overview

```
.
├── src/
│   ├── app/
│   │   ├── api/                ← 38 Next.js API routes (App Router)
│   │   ├── layout.tsx          ← Root layout (theme provider, toaster)
│   │   ├── page.tsx            ← Main workspace UI
│   │   └── globals.css         ← Tailwind 4 entry + design tokens
│   ├── components/
│   │   ├── ui/                 ← shadcn/ui primitives
│   │   └── workspace/          ← App-specific components (panels, viewers)
│   ├── store/
│   │   └── workspace.ts        ← Zustand store (input, stages, history, SSE)
│   ├── hooks/                  ← use-mobile, use-toast
│   └── lib/                    ← Domain logic (pipeline, council, providers…)
├── prisma/
│   └── schema.prisma           ← 29 models (Project, DocVersion, KnowledgeNode…)
├── skill/                      ← Portable, framework-free skill package
├── docs/                       ← Architecture, provider setup, FAQ
├── public/                     ← Static assets (logo, robots.txt)
└── .github/                    ← Issue templates, PR template, security policy
```

### The lib layer (where the interesting code lives)

| File                       | Responsibility                                                  |
|----------------------------|------------------------------------------------------------------|
| `pipeline.ts`              | The 29-stage async-generator orchestrator + SSE events.         |
| `prompts.ts`               | All stage system + user prompts (Understand, Debate, Generate…).|
| `provider-router.ts`       | 4-mode routing, fallback chains, execution backends.            |
| `provider-catalog.ts`      | 23-provider registry (bootstrapped from cheahjs/free-llm-api-resources). |
| `llm.ts`                   | Shared ZAI instance, `chat()` / `chatJson()` with retry + JSON extraction. |
| `github.ts`                | Public GitHub REST fetcher (metadata, README, tree, package hints). |
| `doc-types.ts`             | Registry of document types with structure templates.            |
| `domain-packs.ts`          | 8 domain packs (fintech, healthcare, dev-tools, etc.).          |
| `evaluation.ts`            | Rubric-based evaluation engine.                                  |
| `health-score.ts`          | 7-area composite health score.                                  |
| `next-action.ts`           | Next-best-action recommendation engine.                          |
| `policy-engine.ts`         | Policy layer + credential/secret detection.                      |
| `manifest.ts` / `audit.ts` | Generation manifest + audit log.                                 |
| `memory.ts` / `memory-manager.ts` | Project memory derivation and long-lived context.        |
| `impact-propagator.ts`     | Change-impact analysis across the knowledge graph.              |
| `notifications.ts`         | Notification dispatch (drift, validation, providers…).          |
| `completeness.ts`          | Completeness scoring for stage outputs.                          |
| `provider-performance.ts`  | Per-provider latency / error / quality tracking.                |
| `diff.ts`                  | Document diffing for living-document change tracking.           |

---

## Coding style

### TypeScript
- Strict mode is on. Avoid `any` — when unavoidable, add an explanatory comment.
- Prefer discriminated unions for events and stage outputs (see `PipelineEvent`).
- Use `safeParse<T>(json, fallback)` for parsing JSON columns from the DB (see existing route files).
- Route handlers export `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`. Dynamic routes use `params: Promise<{ id: string }>` and `await params`.

### React & UI
- Use **shadcn/ui** primitives from `src/components/ui/` for all UI building blocks. Don't reinvent buttons, dialogs, selects.
- Style with **Tailwind CSS 4** utility classes. Use the design tokens in `globals.css`.
- Client components must start with `"use client"`. Keep server/client boundary tight — push `"use client"` as far down the tree as possible.
- For data fetching in panels, follow the established `useEffect` + `let cancelled = false; (async () => {...})();` pattern with cleanup, loading state, and error state.

### State management
- Global UI state lives in the **Zustand** store at `src/store/workspace.ts`.
- Per-component state uses React's built-in hooks.
- Server state can use `@tanstack/react-query` (installed) when appropriate, but most panels fetch directly in `useEffect`.

### Database
- Add new fields/models to `prisma/schema.prisma` and run `bun run db:push`.
- JSON columns are stored as strings — wrap them with `safeParse<T>()` on read.
- Add `@@index` for any field you'll filter or join on.

### Linting & formatting
- ESLint config is in `eslint.config.mjs` (flat config, `eslint-config-next`).
- Run `bun run lint` before committing — no warnings, no errors.

---

## How to add a new council role

The council is the heart of the system. Adding a role touches four places:

1. **Add the role to the type system.**
   Edit `src/lib/provider-router.ts` and extend the `CouncilRole` union (e.g. `| "dataReviewer"`).

2. **Add the role prompt.**
   Create `skill/roles/<your-role>.md` following the format of existing roles (emoji, mandate, what to challenge, output format).
   Then add a `YOUR_ROLE_SYSTEM` + `yourRoleUser()` pair in `src/lib/prompts.ts`.

3. **Register in the debate stage.**
   In `src/lib/pipeline.ts`, add the role to the `debate_round1` and `debate_round2` stage calls so it participates in proposals and responses.

4. **Optional: add a domain pack override.**
   If the role is domain-specific (e.g. `complianceReviewer` for fintech), add it to the relevant pack's `roles` array in `src/lib/domain-packs.ts`.

5. **Update the UI.**
   Add the role's emoji + name to the role list in `src/components/workspace/stage-panels.tsx` (the council debate panel).

Run a sample generation and verify the new role appears in the debate, casts a vote (if `ai_voting` is enabled), and shows up in the decision journal's `supportedBy` / `objectedBy`.

---

## How to add a new provider

The provider registry is auto-bootstrapped from [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources), so most providers don't need manual setup. To add a provider that isn't in that source, or to override one:

1. **Add to the catalog.**
   Edit `src/lib/provider-catalog.ts` and add an entry to `PROVIDER_CATALOG` with: `providerId`, `name`, `category` (`free` | `trial` | `premium`), `baseUrl` (OpenAI-compatible), `defaultModel`, `contextWindow`, `taskTypes` it supports, and any auth notes.

2. **(If the provider needs a key) wire the key flow.**
   The `POST /api/providers/keys` endpoint already accepts any `providerId` — no code changes needed there. The masked-key storage and `ProviderConfig` model are generic.

3. **Update the skill package.**
   Add the provider to `skill/providers/registry.md` so portable-skill users see it too. Update `skill/providers/routing-rules.md` if the provider fits a specific stage class (low-latency / large-context / quality-critical).

4. **Test routing.**
   Set your mode to `own-keys`, add the key, and run a generation. Check the Providers tab and observability log — the provider should appear in the routing log with the correct stage assignment.

---

## How to add a new document type

Document types are registered in `src/lib/doc-types.ts`.

1. **Register the type.**
   Add a new entry to the `DOC_TYPES` registry: `id`, `name`, `description`, `bestFor` (when to use it), `structure` (the section template the Generate stage uses), and UI metadata.

2. **Add the evaluation rubric.**
   In `src/lib/evaluation.ts`, add a rubric for the new type. Each rubric has criteria with weights (0–1) and a `note` describing what good looks like.

3. **Add a skill template.**
   Create `skill/templates/<your-type>.md` with the canonical structure. The skill package should mirror what the app generates.

4. **Update the AUTO strategy.**
   In `src/lib/prompts.ts`, the `STRATEGY_SYSTEM` prompt enumerates document types and asks the model to pick one. Add your new type to that enumeration with a one-line description of when it's the right choice.

5. **Test end-to-end.**
   Run a generation with `docType: <your-type>` and verify the strategy stage, generation, validation, and evaluation all handle the new type.

---

## How to add a new pipeline stage

The pipeline runs stages in `STAGE_ORDER` (see `src/lib/pipeline.ts`). Adding a stage touches five places:

1. **Add the stage key + label.**
   Extend the `StageKey` union and `STAGE_LABELS` map in `src/lib/pipeline.ts`. Add the key to `STAGE_ORDER` at the right position.

2. **Write the prompt.**
   Add `YOUR_STAGE_SYSTEM` + `yourStageUser()` to `src/lib/prompts.ts`. Return strict JSON if the output is structured; plain Markdown if it's prose.

3. **Implement the stage.**
   In the `runPipeline` async generator, add a stage block following the existing pattern: emit `stage_start`, route via `executeWithRouting`, persist the result to the corresponding `DocVersion` field (add the field in `prisma/schema.prisma` if new), emit `stage_complete`, and record an observability event.

4. **Update the store + UI.**
   Add the stage key to `INITIAL_STAGES` in `src/store/workspace.ts`. The pipeline progress component (`src/components/workspace/pipeline-progress.tsx`) reads `STAGE_LABELS` dynamically, so it'll pick up the new stage automatically. If the stage produces user-visible output, add a panel in `src/components/workspace/stage-panels.tsx` or `delivery-panels.tsx`.

5. **Add a workflow doc.**
   Create `skill/workflows/<your-stage>.md` describing the input, output schema, and rules, so the portable skill stays in sync.

---

## PR process

1. **Open an issue first** for non-trivial changes — it avoids wasted work and lets maintainers steer you toward the right design.
2. **Fork & branch.** Branch from `main` and name it `feat/<short-description>`, `fix/<short-description>`, or `docs/<short-description>`.
3. **Write clear commits.** Conventional Commits style (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`) is appreciated but not enforced.
4. **Keep PRs small and focused.** One feature or one fix per PR makes review faster.
5. **Run checks locally:**
   ```bash
   bun run lint
   bunx tsc --noEmit
   bun run build
   ```
6. **Fill in the PR template** (see [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md)) — especially the testing checklist.
7. **Be responsive to review feedback.** Push fixes to the same branch; the PR updates automatically.
8. **Celebrate when it merges.** 🎉

### What gets merged

- Lint clean, no new TypeScript errors.
- New stages/roles/providers include a test run (paste the version ID or a screenshot in the PR).
- Schema changes include a `db:push` confirmation that the migration applies cleanly.
- Docs are updated when behavior changes — README, CHANGELOG, or `docs/` as appropriate.

---

## Questions?

- 💬 [GitHub Discussions](https://github.com/Pratikrishi97/councilforge/discussions) — Q&A and design chat
- 🐛 [GitHub Issues](https://github.com/Pratikrishi97/councilforge/issues) — bugs and feature requests
- 📖 [`docs/FAQ.md`](./docs/FAQ.md) — common questions answered

Thanks for contributing! 🙌
