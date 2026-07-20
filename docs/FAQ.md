# Frequently asked questions

A living list of common questions. Don't see yours? [Open a discussion](https://github.com/Pratikrishi97/councilforge/discussions).

---

## General

### 1. What is the CouncilForge?

A full-stack Next.js application that turns source material (a GitHub repo, a product brief, pasted notes) into a complete intelligence package — requirements, gaps & risks, a chosen document type (PRD / BRD / FRD / SOW / Tech Design / Audit / Roadmap / Gap Analysis), acceptance tests, backlog, roadmap, evaluation, cost & sprint estimates, and a persistent decision journal.

The core idea is a **visible AI Council**: instead of a single prompt that emits a generic document, the system runs an adversarial, multi-role debate — Product, Business, Architecture, Engineering, QA, Security, UX, Delivery, Compliance — with a moderator that synthesizes consensus or honestly reports disagreement. Every important decision is logged. The output has already survived the cross-functional review it would normally get in week three.

### 2. How is this different from ChatGPT / Claude / Gemini?

| Concern            | Generic chat UI             | CouncilForge                       |
|--------------------|-----------------------------|-------------------------------------------|
| Reasoning          | Single prompt, single model | 10-role council, 2-round debate, moderator|
| Output             | One document at a time      | Document + tests + backlog + roadmap + KG + decisions |
| Memory             | Ephemeral                   | Persistent project memory + decision journal |
| Traceability       | None                        | Requirement → AC → test → release → owner |
| Providers          | Vendor-locked               | 23 providers, 4 modes, fallback chains    |
| Governance         | None                        | Policy engine, audit log, observability, health score |
| Portability        | Web only                    | Web app + framework-free Markdown skill   |

### 3. Do I need to pay for an LLM provider?

**No.** The default `free` mode uses the built-in `z-ai-web-dev-sdk` and works with zero configuration. For higher-quality documents (especially the Generate stage), switch to `hybrid` mode and add one paid key — $5 of OpenRouter credits lasts a long time.

### 4. Can I run this entirely offline / air-gapped?

Yes. Use `local` mode and point the router at a local OpenAI-compatible endpoint (Ollama, LM Studio, vLLM). No traffic leaves your machine. See [`docs/PROVIDER_SETUP.md`](./PROVIDER_SETUP.md#local-mode--running-models-on-your-machine).

### 5. Is this production-ready?

For a single-user / small-team deployment with proper encryption added: yes. For a multi-user SaaS: not yet — `ProviderConfig.apiKeyEnc` currently stores the raw key value, and NextAuth isn't wired up. See [`SECURITY.md`](../SECURITY.md) for the hardening checklist.

---

## The pipeline

### 6. What are the 29 stages?

See [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md#2-the-29-pipeline-stages) for the full table. In short: ingest → understand → dynamic_council → research → hypotheses → debate_round1 → debate_round2 → moderator → ai_voting → requirements → gaps_risks → competitor_intel → feature_recs → strategy → generate → validate → revise → validation_council → acceptance_tests → backlog → roadmap → evaluation → cost_estimate → sprint_plan → arch_simulation → scenario_simulation → knowledge_graph → decision_journal → metadata.

### 7. How long does a full run take?

5–15 minutes on free tiers (rate limits cause fallbacks and retries). 2–5 minutes on paid providers with low-latency options (Groq, Cerebras). The Generate stage is the long pole — using a frontier model there adds 30–90 seconds but dramatically improves quality.

### 8. Can I skip stages?

Yes. In `skill/SKILL.md`, stages 2 (Research), 9 (Knowledge Graph), and 10 (Decision Journal) are flagged as optional augmentations. In the app, edit `STAGE_ORDER` in `src/lib/pipeline.ts` to remove stages you don't need. The store and UI adapt automatically because they read `STAGE_LABELS` dynamically.

### 9. What happens if a stage fails?

The router tries the next provider in the fallback chain. If all providers fail for a stage, the pipeline emits a `stage_skipped` event with a reason and continues — the failed stage's field stays `null` and downstream stages degrade gracefully. The version's `status` will still be `complete` if Generate succeeded; otherwise `error`.

### 10. Why is the council's debate visible? Wouldn't hiding it be faster?

Visibility is the point. The debate is the reasoning — it's where assumptions get challenged, where the security reviewer pushes back on the UX reviewer, where the engineering lead flags a feasibility risk. Hiding it would give you a document with no audit trail and no way to see *why* the council chose what it chose. The decision journal captures the conclusions; the debate stream captures the journey.

---

## Providers

### 11. Which provider should I use?

For your first run: **free mode** (no setup). Once you're hooked:
- Add **Groq** for fast debate rounds (free tier, low latency).
- Add **OpenRouter** with $5 credits and pick a frontier model (Claude / GPT-5 / Gemini 2.5 Pro) for the Generate stage.
- That's it — `hybrid` mode handles the rest.

See [`docs/PROVIDER_SETUP.md`](./PROVIDER_SETUP.md) for step-by-step key setup for every supported provider.

### 12. Will my API keys leak into documents?

**No.** The policy engine's `checkOutputPolicies()` runs on every generated document and scans for credential patterns (AWS keys, OpenAI keys, JWTs, private keys, connection strings). If a leak is detected, the relevant section is redacted and a `policy_violation` notification is raised. Keys are also never written to logs, observability events, or audit entries. See [`SECURITY.md`](../SECURITY.md).

### 13. Can I use a provider not in the registry?

Yes — any OpenAI-compatible endpoint works. Add it to `PROVIDER_CATALOG` in `src/lib/provider-catalog.ts` with `baseUrl`, `defaultModel`, `contextWindow`, and supported `taskTypes`. See [`CONTRIBUTING.md`](../CONTRIBUTING.md#how-to-add-a-new-provider).

### 14. Why does the registry say "23 providers" but I only see a few in the UI?

The 23 come from [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources). The UI shows providers you've configured keys for plus the ones available in your current mode (free / hybrid / own-keys / local). Click **Refresh registry** in the Providers tab to pull the latest catalog.

---

## The skill package

### 15. What is the `/skill` directory?

A **framework-free, pure-Markdown** package that captures the same council, workflows, templates, validators, and provider routing rules used by the live app — but with zero code dependencies. Any AI IDE or agent runtime that can read Markdown can run it. See [`skill/README.md`](../skill/README.md).

### 16. Which IDEs work with the skill?

- ✅ **Claude Code** and **Gemini CLI** run the full pipeline as-is.
- 🟡 **Cursor**, **Codex**, **Kiro**, **OpenCode** need minor adaptation (rename a config file, point at `SKILL.md`).
- 🟠 **GitHub Copilot Chat** and most local agent shells collapse to a one-shot fallback but preserve structure.

See [`skill/COMPATIBILITY.md`](../skill/COMPATIBILITY.md) for the full matrix.

### 17. How do I keep the skill in sync with the app?

The skill and the app should describe the same pipeline. When you change a stage in the app (`src/lib/prompts.ts`, `src/lib/pipeline.ts`), update the corresponding `skill/workflows/<stage>.md` and any affected `skill/roles/*.md`. The PR template has a checklist item for this.

---

## Documents

### 18. Which document type should I pick?

If you're not sure, pick **AUTO** — the strategy stage picks the right type based on your source and audience. Otherwise:

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

### 19. Why are some statements labeled `Confirmed` / `Inferred` / `Assumption`?

The council labels every claim by its evidence level:
- **Confirmed** — directly supported by the source (repo, notes, brief).
- **Inferred** — reasoned from context (e.g. "auth → password policy, forgot/reset, MFA, session timeout, audit logging").
- **Assumption** — taken as given pending validation.

This makes the document's epistemic state explicit. You can act on `Confirmed` items immediately, challenge `Inferred` items, and validate `Assumption` items before committing.

### 20. Can I edit the generated document?

Yes — export to Markdown (or JSON) and edit in any editor. For living-document support, generate a new version from the same project; the diff view shows what changed between versions. Comments can target specific sections for collaborative review.

---

## Extending the system

### 21. How do I add a new council role?

See [`CONTRIBUTING.md`](../CONTRIBUTING.md#how-to-add-a-new-council-role) — five steps: type system, role prompt, debate stage registration, optional domain pack override, UI update.

### 22. How do I add a new document type?

See [`CONTRIBUTING.md`](../CONTRIBUTING.md#how-to-add-a-new-document-type) — five steps: register in `doc-types.ts`, add evaluation rubric, add skill template, update AUTO strategy, test end-to-end.

### 23. How do I add a new pipeline stage?

See [`CONTRIBUTING.md`](../CONTRIBUTING.md#how-to-add-a-new-pipeline-stage) — five steps: stage key + label, prompt, stage implementation, store + UI, workflow doc.

### 24. How do I add a new domain pack?

Domain packs live in `src/lib/domain-packs.ts`. Each pack has: `packId`, `name`, `description`, `roles` (specialized role names to inject), `riskChecklists`, `docStructure`, `policyRules`, `rubrics`, `recommendedProviders`. The `detectDomain()` helper picks a pack automatically based on repo / notes content. Add your pack to the `DOMAIN_PACKS` array and test with a relevant input.

---

## Performance & cost

### 25. How much does a typical run cost?

In `hybrid` mode with $5 of OpenRouter credits:
- Understand (large repo via Gemini free): $0
- Debate rounds (Groq free): $0
- Generate (Claude Sonnet via OpenRouter, ~4K tokens output): ~$0.06
- Validate, Evaluation (small models): ~$0.02
- **Total: ~$0.08 per run.**

A $5 credit covers ~60 full runs. Local mode is $0.

### 26. Can I cache LLM responses to avoid re-paying for the same input?

Not yet — every run re-executes. The decision journal and project memory avoid re-deriving context across runs, but the LLM calls themselves aren't cached. This is on the roadmap.

### 27. Why is my run slow?

Most likely causes:
- **Free-tier rate limits** causing fallbacks and retries → add a paid key, or use low-latency providers (Groq, Cerebras).
- **Large repo input** blowing the context window → use Gemini 2.5 Pro (1M tokens) for Understand.
- **Frontier model on Generate** → expected; the quality is worth the 30–90 seconds.
- **Slow local model** → use a smaller model or run on a GPU.

Check the **Observability** tab — it shows per-stage duration, so you can see exactly which stage is the bottleneck.

---

## Data & privacy

### 28. Where is my data stored?

In the local SQLite database (`db/custom.db`) by default. For production, swap to PostgreSQL by changing the `datasource` provider in `prisma/schema.prisma` and setting `DATABASE_URL`. No data leaves your machine except the LLM API calls themselves.

### 29. Do providers train on my prompts?

It depends on the provider:
- **Free tiers** often log prompts for abuse detection; some may use them for training. Check each provider's terms.
- **Paid tiers** usually offer opt-out (OpenAI Zero Data Retention, Anthropic's no-train policy, Google AI Studio Data Protection, OpenRouter Privacy Mode).
- **Local mode** — no data leaves your machine.

For sensitive data, use `own-keys` or `local` mode with a provider that contractually doesn't train on your data.

### 30. Can I delete a project and all its data?

Yes. Deleting a project cascades to all related `DocVersion` rows (Prisma `onDelete: Cascade`). Other tables (`KnowledgeNode`, `DecisionJournal`, `AuditLog`, etc.) are keyed by `projectId` and need explicit deletion — the UI's "Delete project" button handles this. The audit log entry recording the deletion is itself retained for compliance.

---

## Still stuck?

- 💬 [GitHub Discussions](https://github.com/Pratikrishi97/councilforge/discussions) — Q&A and design chat
- 🐛 [GitHub Issues](https://github.com/Pratikrishi97/councilforge/issues) — bugs and feature requests
- 📖 [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) — deep dive into the 7 layers
- 📖 [`docs/PROVIDER_SETUP.md`](./PROVIDER_SETUP.md) — provider configuration and troubleshooting
- 📖 [`CONTRIBUTING.md`](../CONTRIBUTING.md) — how to extend the system
