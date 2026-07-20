# Provider Routing Rules

> How to match pipeline stages — and the council roles within them — to the
> right provider class. The skill itself never calls a provider; the host
> IDE does. These rules tell the host **what kind of provider** each stage
> prefers, so the host can map to its available providers using
> `registry.md`.

## Routing principles

1. **Match the stage's bottleneck to the provider's strength.**
   - Context-bound stages (Understand, Generate) → large-context providers.
   - Latency-bound stages (Debate, Validate) → low-latency providers.
   - Quality-bound stages (Generate) → frontier-tier models.
2. **Prefer free-tier providers** for prototyping; switch to trial/paid
   only for the Generate stage if quality demands it.
3. **Parallelize where possible.** Debate Round 1 has 8 independent role
   calls — run them concurrently on the same low-latency provider.
4. **Strict JSON stages need strict-JSON providers.** Requirements,
   Gaps/Risks, Validate, Knowledge Graph, Decision Journal all return
   structured JSON. Use providers with reliable JSON adherence (Groq,
   Cerebras, OpenRouter, Cohere, Google AI Studio).
5. **Never use Cloudflare Workers AI (8K ctx) for Understand or Generate.**
   Its context window is too small.

## Stage → provider class mapping

| Stage             | Latency need  | Context need | JSON need | Recommended providers (in priority order)                                                |
|-------------------|---------------|--------------|-----------|-------------------------------------------------------------------------------------------|
| **Understand**    | low-medium    | large (≥128K, ideally 1M) | strict | google-ai-studio, google-vertex-ai, mistral-codestral, opencode-zen, cohere, openrouter  |
| **Research**      | medium        | large        | strict    | google-ai-studio, openrouter, cohere, mistral-la-plateforme, together-ai                  |
| **Debate R1 (×8)**| low           | medium       | strict    | groq, cerebras, sambanova, vercel-ai-gateway (parallelize all 8)                          |
| **Debate R2 (×8)**| low           | medium       | strict    | groq, cerebras, sambanova, vercel-ai-gateway (parallelize all 8)                          |
| **Moderator**     | low-medium    | medium       | strict    | groq, cerebras, openrouter, cohere                                                        |
| **Requirements**  | medium        | medium       | strict    | openrouter, cohere, mistral-la-plateforme, google-ai-studio                               |
| **Gaps & Risks**  | medium        | medium       | strict    | openrouter, cohere, mistral-la-plateforme, google-ai-studio                               |
| **Strategy**      | low           | small        | strict    | groq, cerebras, sambanova, vercel-ai-gateway, cloudflare-workers-ai                       |
| **Generate**      | medium-high   | large        | n/a (Markdown) | openrouter→frontier, google-ai-studio, cohere, mistral-la-plateforme, opencode-zen   |
| **Validate (gates)** | low-medium | medium       | strict    | groq, cerebras, sambanova, vercel-ai-gateway                                              |
| **Validate (council ×5)** | low    | medium       | strict    | groq, cerebras (parallelize all 5 reviewers)                                              |
| **Knowledge Graph** | medium      | medium-large | strict    | openrouter, cohere, google-ai-studio, mistral-la-plateforme                               |
| **Decision Journal** | low         | small        | strict    | groq, cerebras, vercel-ai-gateway, cloudflare-workers-ai                                  |

## Role → provider affinity

Within the Debate stage, certain roles benefit from specific provider
strengths. This is **optional optimization** — the default is to run all
eight roles on the same low-latency provider. Use this affinity when
quality matters more than uniformity:

| Role                  | Preferred provider class        | Why                                                       |
|-----------------------|---------------------------------|-----------------------------------------------------------|
| Product Manager       | reasoning-strong (Cohere, OpenRouter→Claude) | Needs balanced judgment                          |
| Business Analyst      | long-context (Cohere 256K)      | Stakeholder breadth benefits from context                 |
| Solutions Architect   | coding-strong (OpenCode Zen, Mistral Codestral) | Architecture needs code-aware reasoning        |
| Engineering Lead      | coding-strong (OpenCode Zen)    | Feasibility/effort needs code awareness                   |
| QA Lead               | reasoning-strong (Cohere)       | Testability needs careful categorization                  |
| Security Reviewer     | reasoning-strong (OpenRouter→frontier) | Threat modeling needs frontier reasoning          |
| UX Reviewer           | any (low latency OK)            | Journey/state analysis is straightforward                 |
| Delivery Manager      | any (low latency OK)            | Planning is straightforward                               |
| Moderator             | reasoning-strong (Cohere, OpenRouter→Claude) | Synthesis is the hardest reasoning task         |
| Compliance Reviewer   | reasoning-strong (OpenRouter→frontier) | Regulatory mapping needs frontier knowledge      |

## Task-type routing

When the host IDE knows the task type in advance, route as follows:

| Task type                              | Routing                                                                 |
|----------------------------------------|-------------------------------------------------------------------------|
| Small repo (< 8K tokens)               | Cloudflare Workers AI for all stages except Generate (use OpenRouter).  |
| Medium repo (8K-128K)                  | Groq/Cerebras for fast stages; OpenRouter or Cohere for Generate.       |
| Large repo (128K-1M)                   | Google AI Studio for Understand; Groq for Debate; Cohere for Generate.  |
| Regulated domain (finance, health)     | Add Compliance Reviewer; route Security + Compliance to a frontier model. |
| Code-heavy (architecture review)       | Use OpenCode Zen or Mistral Codestral for Understand and Generate.      |
| Long-form document (> 4K tokens out)   | Use a provider with high output-token cap (OpenRouter, Google AI Studio).|
| Real-time / interactive                | All stages on Groq or Cerebras; collapse Debate to one call.            |
| Batch / overnight                      | Optimize for quality: frontier models on every stage.                   |

## Fallback chain

If the preferred provider is rate-limited or unavailable, fall back in
this order:

1. **Primary:** the recommended provider from the stage table above.
2. **Fallback 1:** OpenRouter (multi-model router; almost always available).
3. **Fallback 2:** Google AI Studio (large context, generous free tier).
4. **Fallback 3:** Cohere (long context, strong instruction following).
5. **Last resort:** any available provider that supports JSON output.

## Cost optimization

- **Cheapest path (free-tier only):** Groq for everything except
  Understand (Google AI Studio) and Generate (Google AI Studio or
  OpenRouter→free model). Total cost: $0.
- **Balanced path:** Groq for Debate/Validate/Strategy; Google AI Studio
  for Understand/Requirements/Gaps/Knowledge Graph; OpenRouter→Claude for
  Generate and Moderator. Total cost: pennies per run on free tiers.
- **Quality path:** Frontier model (Claude Sonnet/Opus via OpenRouter, or
  Gemini 2.5 Pro via Google AI Studio) for Generate and Moderator;
  mid-tier for everything else.

## JSON-output reliability ranking

For stages that return strict JSON (Requirements, Gaps/Risks, Validate,
Knowledge Graph, Decision Journal), prefer providers with the most
reliable JSON adherence:

1. **Groq** — fast, reliable JSON, supports `response_format: json_object`.
2. **Cerebras** — fast, reliable JSON.
3. **OpenRouter** — supports `response_format` on most routed models.
4. **Cohere** — strong structured output.
5. **Google AI Studio** — supports JSON mode on Gemini variants.
6. **Mistral La Plateforme** — supports JSON mode.
7. **Others** — may need prompt-level JSON enforcement (e.g.
   "Return a single JSON object and nothing else").

## Routing anti-patterns

- **Using a frontier model for Debate Round 1.** Wastes budget; the calls
  are small and parallelizable. Use a cheap fast model.
- **Using Cloudflare Workers AI (8K) for Understand.** Context is too
  small for any real repo.
- **Using a non-JSON-strict provider for Requirements.** The validator
  will reject the output and force a retry, costing more than just using
  a JSON-strict provider upfront.
- **Running Debate rounds sequentially.** Loses the parallelism win.
  Parallelize across providers if a single provider rate-limits.
- **Routing Generate to a small model to save cost.** Generate quality
  dominates the user's perception of the entire pipeline. Spend the
  budget here.

## Host IDE integration

The host IDE should expose a `route(stage, taskType, contextSize)` function
that returns a provider ID from `registry.md`. Pseudocode:

```
function route(stage, taskType, contextSize):
  if stage in [UNDERSTAND, GENERATE] and contextSize > 128_000:
    return "google-ai-studio"   # 1M context
  if stage in [DEBATE_R1, DEBATE_R2, VALIDATE_COUNCIL]:
    return "groq"               # parallel + cheap + fast
  if stage == GENERATE:
    return "openrouter"         # route to frontier model
  if stage in [REQUIREMENTS, GAPS_RISKS, KNOWLEDGE_GRAPH]:
    return "cohere"             # long ctx + strict JSON
  if stage in [STRATEGY, DECISION_JOURNAL]:
    return "cerebras"           # tiny + fast
  return "openrouter"           # default
```

The host may override based on user-configured provider keys, available
quotas, or organizational policies.
