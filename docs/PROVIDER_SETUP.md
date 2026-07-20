# Provider setup guide

The CouncilForge is provider-agnostic. The 23-provider registry is auto-bootstrapped from [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources), and you pick one of four execution modes to control how the council actually calls LLMs.

This guide covers the four modes, how to get keys for the most popular providers, security notes, and troubleshooting.

---

## The four modes

Pick a mode during onboarding or change it any time in the **Providers** tab. The choice is stored in `AppSettings.providerMode`.

### 1. `free` — zero configuration

The router uses the built-in `z-ai-web-dev-sdk` (always available, no key needed) and any provider that offers a free tier with no signup. **This is the default.**

- **Best for:** first run, demos, light usage, evaluation.
- **Cost:** $0.
- **Quality:** good enough for most stages; the Generate stage may benefit from a stronger model in `hybrid` or `own-keys` mode.
- **Rate limits:** aggressive on free tiers; expect occasional fallbacks and partial retries.

### 2. `hybrid` — best of both (recommended)

Uses your configured API keys when available, falls back to free providers for any stage you haven't configured. The router prefers your keys for quality-critical stages (Generate, Validate, Evaluation) and uses free providers for low-latency stages (Understand, Debate).

- **Best for:** most users — best cost/quality trade-off.
- **Cost:** pay only for what you use; free tiers absorb the rest.
- **Quality:** high — your frontier model handles the document draft.
- **Rate limits:** your paid keys have generous limits; free-tier fallbacks may still throttle.

### 3. `own-keys` — strict, no surprises

Uses **only** providers you have configured with API keys. If a stage can't be routed to a configured provider, it fails rather than falling back.

- **Best for:** production deployments, strict compliance, predictable cost.
- **Cost:** 100% on your keys.
- **Quality:** as high as your strongest configured model.
- **Rate limits:** only your providers' limits matter.

### 4. `local` — air-gapped

Routes everything to a local OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, llama.cpp server, etc.). No traffic leaves your machine.

- **Best for:** air-gapped environments, sensitive data, zero recurring cost.
- **Cost:** $0 software; you pay for hardware.
- **Quality:** depends entirely on the local model — see the [skill's minimum model specs](../skill/COMPATIBILITY.md#recommended-minimum-model-specs).
- **Rate limits:** bounded by your GPU/CPU.

---

## How to get API keys

> ⚠️ **Never commit API keys to git.** The `.gitignore` should already exclude `.env`. Keys added through the **Providers** tab are stored in the local DB — see [SECURITY.md](../SECURITY.md) for handling details.

The router treats any OpenAI-compatible endpoint as a provider. Below are the most popular options. The full 23-provider catalog is in [`skill/providers/registry.md`](../skill/providers/registry.md).

### Groq — fast, generous free tier

1. Go to <https://console.groq.com/keys>.
2. Sign in (Google or GitHub).
3. Click **Create API Key**.
4. Copy the key (starts with `gsk_…`).
5. In the app: Providers tab → Add key → Provider: `groq` → Paste key → Save.

- **Free tier:** yes, rate-limited.
- **Best for:** low-latency stages (Understand, Debate, Strategy, Validate).
- **Models:** Llama 3.3 70B, Mixtral 8x7B, Gemma 2 9B.

### OpenRouter — one key, many models

1. Go to <https://openrouter.ai/keys>.
2. Sign up (Google or GitHub).
3. Click **Create Key**, name it (e.g. "ai-os-local").
4. Copy the key (starts with `sk-or-v1-…`).
5. Add credits under **Credits** (≈$5 is plenty for many runs).
6. In the app: Providers tab → Add key → Provider: `openrouter` → Paste → Save.

- **Free tier:** some models are free; paid models metered per-token.
- **Best for:** Generate stage — pick a frontier model (Claude, GPT, Gemini) just for the document draft.
- **Models:** hundreds — set the model per stage in the Providers tab.
- **Privacy:** enable **Privacy Mode** in OpenRouter settings if you don't want prompts logged.

### Together AI — fast, OpenAI-compatible

1. Go to <https://api.together.ai/settings/api-keys>.
2. Sign up.
3. Click **Create API Key**.
4. Copy the key (starts with `…`).
5. Add credits.
6. In the app: Providers → `together` → Paste → Save.

- **Free tier:** trial credits on signup.
- **Best for:** large-context stages (Understand with big repos).
- **Models:** Llama 3.3, Qwen 2.5, DeepSeek, Mixtral.

### Google AI Studio (Gemini) — huge context, generous free tier

1. Go to <https://aistudio.google.com/apikey>.
2. Sign in with a Google account.
3. Click **Create API Key**.
4. Copy the key (starts with `AIza…`).
5. In the app: Providers → `google` → Paste → Save.

- **Free tier:** yes (Gemini 1.5 Flash, Gemini 2.0 Flash).
- **Best for:** Understand stage with very large repos (up to 1M-token context).
- **Models:** Gemini 2.0 Flash, Gemini 2.5 Pro.
- **Data controls:** enable **Data Protection** in AI Studio settings to opt out of model training.

### Cerebras — fastest inference

1. Go to <https://cerebras.ai>.
2. Sign up for the developer preview.
3. Generate an API key.
4. In the app: Providers → `cerebras` → Paste → Save.

- **Free tier:** yes, during preview.
- **Best for:** Debate rounds (low latency = fast council turns).
- **Models:** Llama 3.3 70B, Llama 3.1 8B.

### SambaNova — fast, free tier

1. Go to <https://cloud.sambanova.ai/apis>.
2. Sign up.
3. Create an API key.
4. In the app: Providers → `sambanova` → Paste → Save.

- **Free tier:** yes.
- **Best for:** low-latency reasoning stages.
- **Models:** Llama 3.3 70B, DeepSeek R1.

### Cloudflare Workers AI — serverless

1. Go to <https://dash.cloudflare.com/>→ **Workers & Pages** → **AI**.
2. Create an API token with the Workers AI permission.
3. Copy the **Account ID** and **API Token**.
4. In the app: Providers → `cloudflare` → Paste → Save.

- **Free tier:** 10,000 Neurons/day free.
- **Best for:** low-latency stages deployed at the edge.
- **Models:** Llama 3, Mistral, Gemma.

### Mistral La Plateforme

1. Go to <https://console.mistral.ai/api-keys>|.
2. Sign up.
3. Create an API key (starts with `…`).
4. Add credits (or use the free tier for some models).
5. In the app: Providers → `mistral` → Paste → Save.

- **Free tier:** some models free; Codestral has a generous free quota.
- **Best for:** large-context stages (Codestral 22B), Generate (Mistral Large).

### OpenAI (paid)

1. Go to <https://platform.openai.com/api-keys>|.
2. Sign up, add billing.
3. Create an API key (starts with `sk-…`).
4. Set a spending limit.
5. In the app: Providers → `openai` → Paste → Save.

- **Free tier:** no (trial credits sometimes available).
- **Best for:** Generate stage — GPT-5 / o-series produce excellent documents.
- **Privacy:** enable **Zero Data Retention** for Enterprise accounts.

### Anthropic (paid, via OpenRouter or direct)

Direct keys aren't in the free registry, but you can use Anthropic models via OpenRouter. Or add a custom provider pointing at `https://api.anthropic.com/v1/` (note: Anthropic's API is OpenAI-compatible via the `/v1/messages` → `/v1/chat/completions` shim only on some gateways).

- **Best for:** Generate stage — Claude produces excellent long-form documents.

---

## Local mode — running models on your machine

### Ollama

1. Install Ollama: <https://ollama.com>.
2. Pull a model:
   ```bash
   ollama pull llama3.3:70b
   # or for smaller machines:
   ollama pull qwen2.5:32b
   ```
3. Start the server (it runs on `http://localhost:11434` by default):
   ```bash
   ollama serve
   ```
4. In the app: Onboarding → Mode: `local` → Base URL: `http://localhost:11434/v1` → Model: `llama3.3:70b` → Save.

- **No API key needed** — Ollama accepts any string.
- **Best for:** air-gapped / privacy-sensitive work.
- **Minimum specs:** 32GB RAM for 70B (quantized), 16GB for 32B, 8GB for 8B.

### LM Studio

1. Install LM Studio: <https://lmstudio.ai>.
2. Download a model (GGUF format).
3. Start the local server (LM Studio → Local Server → Start).
4. In the app: Mode: `local` → Base URL: `http://localhost:1234/v1` → Save.

### vLLM (self-hosted, production-grade)

1. Install vLLM: <https://docs.vllm.ai>.
2. Launch with an OpenAI-compatible API:
   ```bash
   vllm serve meta-llama/Llama-3.3-70B-Instruct \
     --api-key token-abc123 \
     --port 8000
   ```
3. In the app: Mode: `local` → Base URL: `http://localhost:8000/v1` → API Key: `token-abc123` → Save.

---

## Per-stage routing

The router maps each council role to a **task type**, then picks a provider suited to that task type:

| Task type        | Stages                                              | Provider class             |
|------------------|-----------------------------------------------------|----------------------------|
| `long-context`   | Understand (big repos)                              | Large-context providers    |
| `reasoning`      | Hypotheses, Requirements, Gaps/Risks                | Reasoning models           |
| `coding`         | Architecture simulation, Engineering debate          | Coding-tuned models        |
| `synthesis`      | Moderator, Generate, Decision Journal                | Quality-critical models    |
| `review`         | Validate, Validation Council, QA/Security roles      | Review-tuned models        |
| `general`        | Metadata, Knowledge Graph, Backlog                   | Any                        |

See [`skill/providers/routing-rules.md`](../skill/providers/routing-rules.md) for the full mapping. You can override the default per-stage model in the Providers tab.

---

## Security notes

Read [`SECURITY.md`](../SECURITY.md) in full. The short version:

- **Keys are masked in the UI** (e.g. `sk-...abc4`) and never appear in logs, observability events, audit entries, or generated documents.
- **The policy engine scans output** for leaked secrets (AWS keys, OpenAI keys, JWTs, private keys, connection strings) and redacts them.
- **Free-tier providers may log prompts** for abuse detection — do not send sensitive data to free tiers. Use `own-keys` or `local` mode for regulated data.
- **Local mode** keeps all traffic on your machine — verify your local endpoint is bound to `localhost`.
- **Rotate keys regularly**, especially after sharing screen recordings or screenshots.
- **Set spending caps** at the provider to avoid runaway costs during long pipeline runs.

---

## Troubleshooting

### "No provider available for stage X"

You're in `own-keys` mode and no configured provider serves that stage's task type.
- **Fix:** switch to `hybrid` mode (falls back to free providers), or add a key for a provider that covers the missing task type (see the routing table above).

### "Provider returned non-JSON output"

The model returned text that doesn't parse as JSON. Common causes:
- The provider doesn't support native JSON mode.
- The model is too small to follow the JSON schema.
- The prompt was truncated by context limits.
- **Fix:** use a stronger model for that stage (try Claude, GPT-5, Gemini 2.5 Pro, or Llama 3.3 70B via Groq).

### "Rate limited (429)"

You hit the provider's rate limit. The router will fall back automatically if you're in `free` or `hybrid` mode. In `own-keys` mode, the stage will fail.
- **Fix:** add a second provider as a fallback, or upgrade your tier at the provider.

### "Context window exceeded"

The input (repo tree + READMEs + source) is larger than the provider's context window.
- **Fix:** switch the Understand stage to a large-context provider (Google AI Studio's Gemini 2.5 Pro has 1M+ tokens; OpenRouter's Gemini variants too).

### "Authentication failed (401)"

The API key is wrong, expired, or doesn't have permission for the requested model.
- **Fix:** re-copy the key from the provider's dashboard, ensure you've enabled the right models / scopes, and update it in the Providers tab.

### The Generate stage produces generic output

Single-model generation tends to be generic. The council debate should improve this, but if it's still weak:
- **Fix:** set the Generate stage to use a frontier model (Claude Sonnet/Opus, GPT-5, Gemini 2.5 Pro) — even just for that one stage. The cost is small; the quality jump is large.

### The pipeline takes too long

A full 29-stage run with all intelligence stages enabled can take 5–15 minutes on free tiers.
- **Fix:** use low-latency providers (Groq, Cerebras, SambaNova) for Understand / Debate / Strategy / Validate. Keep the quality-critical Generate stage on a frontier model.
- **Skip optional stages:** in `skill/SKILL.md`, stages 2 (Research), 9 (Knowledge Graph), 10 (Decision Journal) are flagged as optional augmentations — the app runs them all by default, but you can comment them out in `STAGE_ORDER` for a faster minimal pipeline.

### "Free mode isn't working"

The `z-ai-web-dev-sdk` should work out of the box. If it doesn't:
- Check your network — the SDK calls a remote endpoint.
- Check `dev.log` / `server.log` for the underlying error.
- If you're behind a corporate proxy, set `HTTPS_PROXY` in your environment.

### Refreshing the provider registry

The 23-provider catalog is fetched from [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources). To pull the latest:
- Providers tab → **Refresh registry** button.
- Or: `POST /api/providers/bootstrap` from a script.

The registry version + fetch time are stored in `AppSettings.registryVersion` / `registryFetchedAt`.

### Bootstrap fallback (upstream drift)

The bootstrap step depends on an external repo. If `cheahjs/free-llm-api-resources` changes its schema, moves, or is temporarily unreachable, CouncilForge degrades gracefully rather than breaking:

1. **Persisted catalog.** The last successful bootstrap is saved to the `ProviderEntry` table and `AppSettings.registryVersion`. The app keeps using that persisted catalog, so a failed refresh never wipes your provider list.
2. **Built-in seed.** The registry is seeded from the in-repo `src/lib/provider-catalog.ts` (23 curated entries). Even with no network access, the app has a working catalog to bootstrap from.
3. **Manual entry always works.** You can add any OpenAI-compatible provider by key at any time via the Providers tab or `POST /api/providers/keys`, independent of the upstream registry. A manually added provider is routed exactly like a bootstrapped one.
4. **Pinning.** To avoid surprise changes, simply don't press **Refresh registry** — the persisted catalog stays put until you explicitly refresh.

This is a known, documented dependency (see [Known Limitations](../README.md#known-limitations)); it affects only the *refresh* action, never core generation.

---

## Need more help?

- 💬 [GitHub Discussions](https://github.com/Pratikrishi97/councilforge/discussions)
- 📖 [`docs/FAQ.md`](./FAQ.md)
- 🐛 [Open an issue](https://github.com/Pratikrishi97/councilforge/issues/new?template=bug_report.md)
