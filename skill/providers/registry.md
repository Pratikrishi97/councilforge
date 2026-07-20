# Provider Registry

> Reference list of 23 LLM providers profiled for the Requirements
> Intelligence Council skill. Bootstrapped from the open-source
> `free-llm-api-resources` registry and supplemented with provider docs.
> The host IDE maps each provider to a concrete stage; see
> `routing-rules.md` for the mapping logic.

The skill itself is **model-agnostic** — it never calls a provider
directly. The host IDE does. This registry exists so the host can pick the
right provider class for each pipeline stage based on context window,
latency, JSON adherence, and cost.

## Provider categories

- **`free`** — persistent free tier (rate-limited, not just credits).
- **`trial`** — one-time trial credits; converts to paid afterward.
- **`premium`** — paid providers (none currently curated here).

## Quick reference — all 23 providers

| #  | ID                       | Name                            | Cat.   | Ctx (K) | Latency   | Default model                                        |
|----|--------------------------|---------------------------------|--------|---------|-----------|------------------------------------------------------|
| 1  | openrouter               | OpenRouter                      | free   | 128     | medium    | meta-llama/llama-3.3-70b-instruct:free               |
| 2  | google-ai-studio         | Google AI Studio                | free   | 1000    | medium    | gemini-2.0-flash                                     |
| 3  | nvidia-nim               | NVIDIA NIM                      | free   | 128     | medium    | nvidia/llama-3.1-nemotron-70b-instruct               |
| 4  | mistral-la-plateforme    | Mistral La Plateforme           | free   | 128     | medium    | mistral-large-latest                                 |
| 5  | mistral-codestral        | Mistral Codestral               | free   | 256     | medium    | codestral-latest                                     |
| 6  | huggingface              | HuggingFace Inference Providers | free   | 32      | medium    | meta-llama/Llama-3.3-70B-Instruct                    |
| 7  | vercel-ai-gateway        | Vercel AI Gateway               | free   | 128     | low       | openai/gpt-4o-mini                                   |
| 8  | opencode-zen             | OpenCode Zen                    | free   | 256     | medium    | anthropic/claude-sonnet-4                            |
| 9  | cerebras                 | Cerebras                        | free   | 128     | low       | llama3.1-8b                                          |
| 10 | groq                     | Groq                            | free   | 128     | low       | llama-3.3-70b-versatile                              |
| 11 | cohere                   | Cohere                          | free   | 256     | medium    | command-a-03-2025                                    |
| 12 | github-models            | GitHub Models                   | free   | 128     | medium    | gpt-4o-mini                                          |
| 13 | cloudflare-workers-ai    | Cloudflare Workers AI           | free   | 8       | low       | @cf/meta/llama-3.3-70b-instruct-fp8-fast             |
| 14 | fireworks                | Fireworks AI                    | trial  | 128     | low       | accounts/fireworks/models/llama-v3p3-70b-instruct    |
| 15 | baseten                  | Baseten                         | trial  | 128     | medium    | deepseek-ai/deepseek-v3                              |
| 16 | hyperbolic               | Hyperbolic                      | trial  | 128     | medium    | deepseek-ai/deepseek-v3                              |
| 17 | lambda                   | Lambda                          | trial  | 128     | medium    | deepseek-ai/deepseek-r1                              |
| 18 | sambanova                | SambaNova Cloud                 | trial  | 256     | low       | Meta-Llama-3.3-70B-Instruct                          |
| 19 | scaleway                 | Scaleway Generative APIs        | trial  | 128     | low       | llama-3.3-70b-instruct                               |
| 20 | together-ai              | Together AI                     | trial  | 128     | low       | meta-llama/Llama-3.3-70B-Instruct-Turbo              |
| 21 | google-vertex-ai         | Google Cloud Vertex AI          | trial  | 1000    | medium    | gemini-2.0-flash                                     |
| 22 | chutes                   | Chutes                          | trial  | 128     | medium    | deepseek-ai/DeepSeek-R1                              |
| 23 | kluster                  | Kluster                         | trial  | 128     | medium    | meta-llama/Llama-3.3-70B-Instruct                    |

All providers in this registry expose an **OpenAI-compatible chat
completions endpoint**. Auth is `bearer` (most), `query-param`
(Google AI Studio), or `x-api-key`.

---

## Detailed profiles

### Free-tier providers (13)

#### 1. OpenRouter — `openrouter`
- **Website:** https://openrouter.ai
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** medium
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✓
- **Rate limits:** 20 req/min, 50 req/day (1000 req/day with $10 lifetime topup)
- **Best for:** Multi-model routing through one API; free Llama / Qwen /
  DeepSeek access; prototyping across many vendors.
- **Limitations:** Free models share a common quota; may be deprecated or
  rate-limited.
- **Setup:** Sign up at openrouter.ai → Keys → create API key.
- **Warning:** Free models can be withdrawn without notice.

#### 2. Google AI Studio — `google-ai-studio`
- **Website:** https://aistudio.google.com
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/chat/completions`
- **Auth:** query-param · **Ctx:** 1M · **Latency:** medium
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✓
- **Rate limits:** 5-15 req/min, 20-500 req/day (varies by model)
- **Best for:** Long-context analysis (up to 1M tokens); multimodal vision;
  reasoning with Gemini 2.5 Pro.
- **Limitations:** Aggressive daily request caps on flagship models; data
  used for training outside EU/UK/CH/EEA.
- **Setup:** Visit aistudio.google.com/apikey → sign in with Google →
  create API key.
- **Warning:** Data is used for training when used outside EU/UK/CH/EEA.

#### 3. NVIDIA NIM — `nvidia-nim`
- **Website:** https://build.nvidia.com
- **Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** medium
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✓
- **Rate limits:** 40 req/min
- **Best for:** Open-model inference on NVIDIA infrastructure; Nemotron
  family access; enterprise-style API surface.
- **Limitations:** Phone number verification required; models tend to be
  context-window limited.
- **Setup:** Sign up at build.nvidia.com → verify phone → generate key from
  model page.

#### 4. Mistral La Plateforme — `mistral-la-plateforme`
- **Website:** https://console.mistral.ai
- **Endpoint:** `https://api.mistral.ai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** medium
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✗
- **Rate limits:** 1 req/sec, 500K tokens/min, 1B tokens/month (per model)
- **Best for:** European-hosted AI inference; strong reasoning models;
  function calling.
- **Setup:** Sign up at console.mistral.ai → API Keys → create key.

#### 5. Mistral Codestral — `mistral-codestral`
- **Website:** https://mistral.ai/news/announcing-codestral
- **Endpoint:** `https://api.mistral.ai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 256K · **Latency:** medium
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✗
- **Best for:** Code generation and code-completion; long-context code
  analysis; fill-in-the-middle.
- **Setup:** Same console as Mistral La Plateforme.

#### 6. HuggingFace Inference Providers — `huggingface`
- **Website:** https://huggingface.co
- **Endpoint:** `https://router.huggingface.co/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 32K · **Latency:** medium
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✓
- **Best for:** Wide model variety through one router; community models;
  prototyping.
- **Limitations:** Free tier rate-limited; popular models may queue.

#### 7. Vercel AI Gateway — `vercel-ai-gateway`
- **Website:** https://vercel.com/ai-gateway
- **Endpoint:** `https://ai-gateway.vercel.sh/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** low
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✓
- **Best for:** Edge-deployed inference; low latency; multi-provider
  routing with policy controls.
- **Setup:** Vercel dashboard → AI Gateway → create gateway.

#### 8. OpenCode Zen — `opencode-zen`
- **Website:** https://opencode.ai
- **Endpoint:** `https://api.opencode.ai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 256K · **Latency:** medium
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✗
- **Best for:** Coding-agent workloads; agentic flows; long context.
- **Setup:** Sign up at opencode.ai → generate API key.

#### 9. Cerebras — `cerebras`
- **Website:** https://cerebras.ai
- **Endpoint:** `https://api.cerebras.ai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** low
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✗
- **Rate limits:** 30 req/min, 50 req/hr (free tier)
- **Best for:** Ultra-low-latency inference (wafer-scale inference); fast
  debate rounds; quick classifications.
- **Limitations:** Limited model selection; smaller context on some models.
- **Setup:** Sign up at cerebras.ai → Inference → create key.

#### 10. Groq — `groq`
- **Website:** https://groq.com
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** low
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✗
- **Rate limits:** 30 req/min, 14,400 req/day (free tier)
- **Best for:** Ultra-fast inference (LPU); parallel debate rounds; cheap
  JSON generation; high-throughput categorization.
- **Limitations:** Model selection limited to Llama / Mixtral / Gemma
  families.
- **Setup:** Sign up at console.groq.com → API Keys → create key.

#### 11. Cohere — `cohere`
- **Website:** https://cohere.com
- **Endpoint:** `https://api.cohere.com/v2/chat`
- **Auth:** bearer · **Ctx:** 256K · **Latency:** medium
- **Streaming:** ✓ · **Tool calling:** ✓ · **Vision:** ✗
- **Best for:** Enterprise RAG; long-context Command models; structured
  extraction; multilingual.
- **Setup:** Sign up at cohere.com → Dashboard → API Keys → create key.

#### 12. GitHub Models — `github-models`
- **Website:** https://github.com/marketplace/models
- **Endpoint:** `https://models.inference.ai.azure.com/chat/completions`
- **Auth:** bearer (GitHub PAT) · **Ctx:** 128K · **Latency:** medium
- **Best for:** Prototyping with frontier models (GPT-4o, Llama, Mistral)
  using a GitHub PAT.
- **Limitations:** Rate-limited for free tier; not for production.

#### 13. Cloudflare Workers AI — `cloudflare-workers-ai`
- **Website:** https://developers.cloudflare.com/workers-ai
- **Endpoint:** `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 8K · **Latency:** low
- **Streaming:** ✓ · **Tool calling:** partial · **Vision:** ✓
- **Best for:** Edge inference on Cloudflare's network; tiny-context
  classifications; cheap quick calls.
- **Limitations:** Small context window (8K) makes it unsuitable for the
  Understand or Generate stages.

---

### Trial-credit providers (10)

> Trial providers offer one-time credits. Useful for evaluating a provider
> before committing spend, but not for sustained pipeline runs.

#### 14. Fireworks AI — `fireworks`
- **Website:** https://fireworks.ai
- **Endpoint:** `https://api.fireworks.ai/inference/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** low
- **Best for:** Fast open-model serving; Llama / Mixtral / DeepSeek
  families; serverless inference.
- **Trial:** $1 credit on signup.

#### 15. Baseten — `baseten`
- **Website:** https://baseten.co
- **Endpoint:** `https://model.baseten.co/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** medium
- **Best for:** Custom model deployment; DeepSeek / open-model serving.

#### 16. Hyperbolic — `hyperbolic`
- **Website:** https://hyperbolic.xyz
- **Endpoint:** `https://api.hyperbolic.xyz/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** medium
- **Best for:** GPU marketplace; DeepSeek and open-model inference.

#### 17. Lambda — `lambda`
- **Website:** https://lambda.ai
- **Endpoint:** `https://api.lambdalabs.com/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** medium
- **Best for:** DeepSeek-R1 reasoning model; GPU cloud inference.

#### 18. SambaNova Cloud — `sambanova`
- **Website:** https://sambanova.ai
- **Endpoint:** `https://api.sambanova.ai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 256K · **Latency:** low
- **Best for:** Fast inference on SambaNova's RDU hardware; long context;
  Llama family.

#### 19. Scaleway Generative APIs — `scaleway`
- **Website:** https://www.scaleway.com/en/generative-apis/
- **Endpoint:** `https://api.scaleway.ai/ai-platform/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** low
- **Best for:** EU-hosted open-model inference; Llama family.

#### 20. Together AI — `together-ai`
- **Website:** https://together.ai
- **Endpoint:** `https://api.together.xyz/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** low
- **Best for:** Large selection of open models; fast serverless inference;
  fine-tuning capabilities.

#### 21. Google Cloud Vertex AI — `google-vertex-ai`
- **Website:** https://cloud.google.com/vertex-ai
- **Endpoint:** `https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/endpoints/openapi/chat/completions`
- **Auth:** bearer (OAuth) · **Ctx:** 1M · **Latency:** medium
- **Best for:** Production Gemini deployments; enterprise-grade
  infrastructure; 1M-token context.
- **Trial:** Google Cloud free trial credits.

#### 22. Chutes — `chutes`
- **Website:** https://chutes.ai
- **Endpoint:** `https://api.chutes.ai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** medium
- **Best for:** DeepSeek-R1 reasoning model access; serverless inference.

#### 23. Kluster — `kluster`
- **Website:** https://kluster.ai
- **Endpoint:** `https://api.kluster.ai/v1/chat/completions`
- **Auth:** bearer · **Ctx:** 128K · **Latency:** medium
- **Best for:** Open-model inference with fine-tuning support.

---

## Capability matrix

| Provider                | Long ctx (≥128K) | Low latency | Tool calling | Vision | Free tier |
|-------------------------|:----------------:|:-----------:|:------------:|:------:|:---------:|
| openrouter              |        ✓         |             |      ✓       |   ✓    |     ✓     |
| google-ai-studio        |        ✓ (1M)    |             |      ✓       |   ✓    |     ✓     |
| nvidia-nim              |        ✓         |             |      ✓       |   ✓    |     ✓     |
| mistral-la-plateforme   |        ✓         |             |      ✓       |        |     ✓     |
| mistral-codestral       |        ✓ (256K)  |             |      ✓       |        |     ✓     |
| huggingface             |        (32K)     |             |      ✓       |   ✓    |     ✓     |
| vercel-ai-gateway       |        ✓         |      ✓      |      ✓       |   ✓    |     ✓     |
| opencode-zen            |        ✓ (256K)  |             |      ✓       |        |     ✓     |
| cerebras                |        ✓         |      ✓      |      ✓       |        |     ✓     |
| groq                    |        ✓         |      ✓      |      ✓       |        |     ✓     |
| cohere                  |        ✓ (256K)  |             |      ✓       |        |     ✓     |
| github-models           |        ✓         |             |      ✓       |        |     ✓     |
| cloudflare-workers-ai   |        (8K)      |      ✓      |   partial    |   ✓    |     ✓     |
| fireworks               |        ✓         |      ✓      |      ✓       |        |           |
| baseten                 |        ✓         |             |      ✓       |        |           |
| hyperbolic              |        ✓         |             |      ✓       |        |           |
| lambda                  |        ✓         |             |      ✓       |        |           |
| sambanova               |        ✓ (256K)  |      ✓      |      ✓       |        |           |
| scaleway                |        ✓         |      ✓      |      ✓       |        |           |
| together-ai             |        ✓         |      ✓      |      ✓       |        |           |
| google-vertex-ai        |        ✓ (1M)    |             |      ✓       |   ✓    |           |
| chutes                  |        ✓         |             |      ✓       |        |           |
| kluster                 |        ✓         |             |      ✓       |        |           |

## Selection guidance

- **For the Understand stage (large context):** prefer `google-ai-studio`
  (1M), `google-vertex-ai` (1M), `mistral-codestral` (256K),
  `opencode-zen` (256K), `cohere` (256K), `sambanova` (256K).
- **For Debate rounds (parallel, cheap):** prefer `groq`, `cerebras`,
  `sambanova`, `vercel-ai-gateway`, `cloudflare-workers-ai` — all low
  latency.
- **For Generate (quality-critical):** route via `openrouter` to a
  frontier model, or use `google-ai-studio` (Gemini 2.5 Pro), `cohere`
  (Command A), `mistral-la-plateforme` (Mistral Large).
- **For Validate / Decision Journal (cheap, strict JSON):** prefer `groq`,
  `cerebras`, `vercel-ai-gateway`.
- **Avoid for any stage:** `cloudflare-workers-ai` for stages requiring
  > 8K context (Understand, Generate).

## Bootstrapping new providers

If you add a new provider, capture at minimum: id, name, category, website,
apiEndpoint, openAiCompatible, authMethod, requiresApiKey,
freeTierAvailable, trialCredits, contextWindow, streaming, toolCalling,
vision, codingSuitability, reasoningSuitability, longContextSuitability,
latencyProfile, rateLimits, bestUseCases, limitations, setupNotes,
documentationUrl, warnings, defaultModel. Update both this registry and
`routing-rules.md`.

## Source

Bootstrapped from https://github.com/cheahjs/free-llm-api-resources and
supplemented with provider documentation. Verify current rate limits and
free-tier availability before relying on them in production — providers
change these frequently.
