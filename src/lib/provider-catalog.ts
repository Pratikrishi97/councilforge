/**
 * Provider Catalog for the CouncilForge
 *
 * Bootstrapped from the free-llm-api-resources repository
 * (https://github.com/cheahjs/free-llm-api-resources) and supplemented
 * with provider documentation research. This file is pure data + helpers —
 * no external dependencies.
 *
 * Categories:
 *   - "free"   : providers offering a persistent free tier (rate-limited)
 *   - "trial"  : providers offering one-time trial credits
 *   - "premium": paid providers (none currently curated here)
 */

export type ProviderCategory = "free" | "trial" | "premium";

export type AuthMethod = "bearer" | "x-api-key" | "query-param" | "none";

export type Suitability = "high" | "medium" | "low";

export type LatencyProfile = "low" | "medium" | "high";

export interface ProviderCatalogEntry {
  /** URL-friendly slug, e.g. "openrouter" */
  id: string;
  /** Human-friendly provider name */
  name: string;
  /** Free / trial / premium classification */
  category: ProviderCategory;
  /** Official marketing/home URL */
  website: string;
  /** Chat completions endpoint (OpenAI-style path where possible) */
  apiEndpoint: string;
  /** True if the endpoint accepts OpenAI-format JSON requests */
  openAiCompatible: boolean;
  /** How the API key is conveyed */
  authMethod: AuthMethod;
  /** Whether a key/credential is required at all */
  requiresApiKey: boolean;
  /** Persistent free tier available (rate-limited, not just credits) */
  freeTierAvailable: boolean;
  /** One-time trial credits offered */
  trialCredits: boolean;
  /** Approximate max context window in tokens (0 if unknown) */
  contextWindow: number;
  /** Supports SSE / chunked streaming responses */
  streaming: boolean;
  /** Supports OpenAI-style tool/function calling */
  toolCalling: boolean;
  /** At least one model supports image/multimodal input */
  vision: boolean;
  /** How well-suited for code generation tasks */
  codingSuitability: Suitability;
  /** How well-suited for reasoning / chain-of-thought tasks */
  reasoningSuitability: Suitability;
  /** How well-suited for long-context (>32k token) tasks */
  longContextSuitability: Suitability;
  /** Typical response latency profile */
  latencyProfile: LatencyProfile;
  /** Human-readable rate limit summary */
  rateLimits: string;
  /** Strongest use cases for this provider */
  bestUseCases: string[];
  /** Known caveats and constraints */
  limitations: string[];
  /** How to obtain an API key */
  setupNotes: string;
  /** Official documentation URL */
  documentationUrl: string;
  /** Warnings the user should know before integrating */
  warnings: string[];
  /** A sensible default model id for chat completions on this provider */
  defaultModel: string;
}

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  // ───────────────────────────────────────────────────────────────────────
  // FREE PROVIDERS (persistent free tier)
  // ───────────────────────────────────────────────────────────────────────

  {
    id: "openrouter",
    name: "OpenRouter",
    category: "free",
    website: "https://openrouter.ai",
    apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "high",
    reasoningSuitability: "medium",
    longContextSuitability: "high",
    latencyProfile: "medium",
    rateLimits: "20 req/min, 50 req/day (1000 req/day with $10 lifetime topup)",
    bestUseCases: [
      "Multi-model routing through one API",
      "Free Llama / Qwen / DeepSeek access",
      "Prototyping across many vendors",
    ],
    limitations: [
      "Free models share a common quota",
      "Free models may be deprecated or rate-limited",
    ],
    setupNotes:
      "Sign up at openrouter.ai, navigate to Keys, create an API key.",
    documentationUrl: "https://openrouter.ai/docs",
    warnings: ["Free models can be withdrawn without notice"],
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
  },

  {
    id: "google-ai-studio",
    name: "Google AI Studio",
    category: "free",
    website: "https://aistudio.google.com",
    apiEndpoint:
      "https://generativelanguage.googleapis.com/v1beta/chat/completions",
    openAiCompatible: true,
    authMethod: "query-param",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 1000000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "high",
    reasoningSuitability: "high",
    longContextSuitability: "high",
    latencyProfile: "medium",
    rateLimits: "5-15 req/min, 20-500 req/day (varies by model)",
    bestUseCases: [
      "Long-context analysis (up to 1M tokens)",
      "Multimodal vision tasks",
      "Reasoning with Gemini 2.5 Pro",
    ],
    limitations: [
      "Aggressive daily request caps on flagship models",
      "Data used for training outside EU/UK/CH/EEA",
    ],
    setupNotes:
      "Visit aistudio.google.com/apikey, sign in with a Google account, create an API key.",
    documentationUrl: "https://ai.google.dev/gemini-api/docs",
    warnings: ["Data is used for training when used outside EU/UK/CH/EEA"],
    defaultModel: "gemini-2.0-flash",
  },

  {
    id: "nvidia-nim",
    name: "NVIDIA NIM",
    category: "free",
    website: "https://build.nvidia.com",
    apiEndpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "medium",
    reasoningSuitability: "medium",
    longContextSuitability: "medium",
    latencyProfile: "medium",
    rateLimits: "40 req/min",
    bestUseCases: [
      "Open-model inference on NVIDIA infrastructure",
      "Nemotron model family access",
      "Enterprise-style API surface",
    ],
    limitations: [
      "Phone number verification required",
      "Models tend to be context-window limited",
    ],
    setupNotes:
      "Sign up at build.nvidia.com, verify phone number, generate an API key from the model page.",
    documentationUrl: "https://docs.api.nvidia.com",
    warnings: ["Phone verification required"],
    defaultModel: "nvidia/llama-3.1-nemotron-70b-instruct",
  },

  {
    id: "mistral-la-plateforme",
    name: "Mistral La Plateforme",
    category: "free",
    website: "https://console.mistral.ai",
    apiEndpoint: "https://api.mistral.ai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "medium",
    reasoningSuitability: "high",
    longContextSuitability: "medium",
    latencyProfile: "medium",
    rateLimits: "1 req/sec, 500K tokens/min, 1B tokens/month (per model)",
    bestUseCases: [
      "European-hosted AI inference",
      "Reasoning with Magistral",
      "Multilingual workloads",
    ],
    limitations: [
      "Free Experiment plan requires opting into data training",
      "Phone verification required",
    ],
    setupNotes:
      "Sign up at console.mistral.ai, verify phone number, create an API key under API Keys.",
    documentationUrl: "https://docs.mistral.ai",
    warnings: ["Free tier opts prompts into training data"],
    defaultModel: "mistral-large-latest",
  },

  {
    id: "mistral-codestral",
    name: "Mistral Codestral",
    category: "free",
    website: "https://codestral.mistral.ai",
    apiEndpoint: "https://codestral.mistral.ai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 256000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "high",
    reasoningSuitability: "medium",
    longContextSuitability: "high",
    latencyProfile: "medium",
    rateLimits: "30 req/min, 2000 req/day",
    bestUseCases: [
      "Code completion and generation",
      "IDE integrations (Continue, Copilot alternatives)",
      "Long-context code refactoring",
    ],
    limitations: [
      "Phone verification required",
      "Currently free — may transition to paid",
    ],
    setupNotes:
      "Sign up at codestral.mistral.ai, verify phone number, generate an API key.",
    documentationUrl: "https://docs.mistral.ai/codestral/overview/",
    warnings: ["Free availability is subject to change"],
    defaultModel: "codestral-latest",
  },

  {
    id: "huggingface",
    name: "HuggingFace Inference Providers",
    category: "free",
    website: "https://huggingface.co/docs/inference-providers",
    apiEndpoint: "https://router.huggingface.co/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 32000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "medium",
    reasoningSuitability: "medium",
    longContextSuitability: "low",
    latencyProfile: "medium",
    rateLimits: "$0.10/month in free credits",
    bestUseCases: [
      "Open-model exploration",
      "Multi-provider routing on the HF router",
      "Research and experimentation",
    ],
    limitations: [
      "Only $0.10/month in free credits",
      "Serverless inference limited to models under ~10GB",
    ],
    setupNotes:
      "Create a HuggingFace account, generate an access token at huggingface.co/settings/tokens.",
    documentationUrl: "https://huggingface.co/docs/inference-providers",
    warnings: ["Free credits deplete quickly on large models"],
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
  },

  {
    id: "vercel-ai-gateway",
    name: "Vercel AI Gateway",
    category: "free",
    website: "https://vercel.com/docs/ai-gateway",
    apiEndpoint: "https://ai-gateway.vercel.sh/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "medium",
    reasoningSuitability: "medium",
    longContextSuitability: "medium",
    latencyProfile: "low",
    rateLimits: "$5/month free allowance",
    bestUseCases: [
      "Multi-provider routing via Vercel",
      "Production gateway for Next.js apps",
      "Edge-deployed AI workloads",
    ],
    limitations: [
      "Only $5/month in free credits",
      "Requires a Vercel account",
    ],
    setupNotes:
      "Enable AI Gateway in the Vercel dashboard, then generate an access token.",
    documentationUrl: "https://vercel.com/docs/ai-gateway",
    warnings: ["Credits may deplete with heavy multi-provider usage"],
    defaultModel: "openai/gpt-4o-mini",
  },

  {
    id: "opencode-zen",
    name: "OpenCode Zen",
    category: "free",
    website: "https://opencode.ai/docs/zen/",
    apiEndpoint: "https://zen.opencode.ai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 256000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "high",
    reasoningSuitability: "high",
    longContextSuitability: "medium",
    latencyProfile: "medium",
    rateLimits: "Usage-based with generous free allowance",
    bestUseCases: [
      "Coding agent workflows",
      "Curated open-model access",
      "Tool-augmented code generation",
    ],
    limitations: ["Free models may use prompts for improvement"],
    setupNotes:
      "Sign up at opencode.ai, navigate to Zen settings, generate an API key.",
    documentationUrl: "https://opencode.ai/docs/zen/",
    warnings: ["Free models may use data for improvement"],
    defaultModel: "anthropic/claude-sonnet-4",
  },

  {
    id: "cerebras",
    name: "Cerebras",
    category: "free",
    website: "https://cloud.cerebras.ai",
    apiEndpoint: "https://api.cerebras.ai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "medium",
    reasoningSuitability: "medium",
    longContextSuitability: "high",
    latencyProfile: "low",
    rateLimits: "30 req/min, 14,400 req/day, 1M tokens/day",
    bestUseCases: [
      "Ultra-low-latency inference",
      "Llama 3.1 8B at high throughput",
      "Real-time conversational apps",
    ],
    limitations: [
      "Very limited model selection",
      "Daily token and request caps",
    ],
    setupNotes:
      "Sign up at cloud.cerebras.ai, generate an API key from the dashboard.",
    documentationUrl: "https://inference-docs.cerebras.ai",
    warnings: ["Limited free tier; production may require paid plan"],
    defaultModel: "llama3.1-8b",
  },

  {
    id: "groq",
    name: "Groq",
    category: "free",
    website: "https://console.groq.com",
    apiEndpoint: "https://api.groq.com/openai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "medium",
    reasoningSuitability: "high",
    longContextSuitability: "medium",
    latencyProfile: "low",
    rateLimits: "1,000-14,400 req/day (model-dependent), 6-12K tokens/min",
    bestUseCases: [
      "Ultra-fast inference via LPU",
      "Real-time chat at scale",
      "Tool calling with low latency",
      "Reasoning with DeepSeek R1 distill",
    ],
    limitations: [
      "Daily request caps vary by model",
      "Token-per-minute limits on flagship models",
    ],
    setupNotes:
      "Sign up at console.groq.com, create an API key under API Keys.",
    documentationUrl: "https://console.groq.com/docs",
    warnings: ["Aggressive rate limits on flagship models like Llama 3.3 70B"],
    defaultModel: "llama-3.3-70b-versatile",
  },

  {
    id: "cohere",
    name: "Cohere",
    category: "free",
    website: "https://cohere.com",
    apiEndpoint: "https://api.cohere.ai/v2/chat",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 256000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "medium",
    reasoningSuitability: "high",
    longContextSuitability: "high",
    latencyProfile: "medium",
    rateLimits: "20 req/min, 1,000 req/month (shared quota across models)",
    bestUseCases: [
      "RAG with strong citation support",
      "Multilingual use via Aya",
      "Enterprise search and retrieval",
      "Reasoning with Command A Reasoning",
    ],
    limitations: [
      "Only 1,000 requests/month shared across all models",
      "Trial keys are for evaluation, not production",
    ],
    setupNotes:
      "Sign up at cohere.com, create an API key in the dashboard under API Keys.",
    documentationUrl: "https://docs.cohere.com",
    warnings: ["Trial keys not approved for production workloads"],
    defaultModel: "command-a-03-2025",
  },

  {
    id: "github-models",
    name: "GitHub Models",
    category: "free",
    website: "https://github.com/marketplace/models",
    apiEndpoint: "https://models.inference.ai.azure.com/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "high",
    reasoningSuitability: "high",
    longContextSuitability: "medium",
    latencyProfile: "medium",
    rateLimits:
      "Tier-dependent (Copilot Free / Pro / Pro+ / Business / Enterprise)",
    bestUseCases: [
      "OpenAI frontier model access at low cost",
      "Multi-model prototyping",
      "Copilot-integrated workflows",
    ],
    limitations: [
      "Extremely restrictive input/output token limits",
      "Quota depends on Copilot subscription tier",
    ],
    setupNotes:
      "Use a GitHub Personal Access Token with `models:read` scope, or sign in at github.com/marketplace/models.",
    documentationUrl: "https://docs.github.com/en/github-models",
    warnings: ["Very low token quotas on the free Copilot tier"],
    defaultModel: "gpt-4o-mini",
  },

  {
    id: "cloudflare-workers-ai",
    name: "Cloudflare Workers AI",
    category: "free",
    website: "https://developers.cloudflare.com/workers-ai",
    apiEndpoint:
      "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: true,
    trialCredits: false,
    contextWindow: 8192,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "medium",
    reasoningSuitability: "medium",
    longContextSuitability: "low",
    latencyProfile: "low",
    rateLimits: "10,000 neurons/day free allocation",
    bestUseCases: [
      "Edge inference on Cloudflare's network",
      "Serverless Workers integration",
      "Low-latency global model routing",
    ],
    limitations: [
      "Neuron-based quota depletes fast on large models",
      "Most models have small context windows",
    ],
    setupNotes:
      "Create a Cloudflare account, copy your Account ID, and create an API token with Workers AI permission.",
    documentationUrl: "https://developers.cloudflare.com/workers-ai",
    warnings: ["Neuron quota exhausted quickly on larger models"],
    defaultModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  },

  // ───────────────────────────────────────────────────────────────────────
  // TRIAL-CREDIT PROVIDERS
  // ───────────────────────────────────────────────────────────────────────

  {
    id: "fireworks",
    name: "Fireworks AI",
    category: "trial",
    website: "https://fireworks.ai",
    apiEndpoint: "https://api.fireworks.ai/inference/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "high",
    reasoningSuitability: "high",
    longContextSuitability: "high",
    latencyProfile: "low",
    rateLimits: "$1 trial credit; usage-based pricing after",
    bestUseCases: [
      "Open-model serving at low latency",
      "DeepSeek V3 / R1 inference",
      "Qwen Coder deployments",
    ],
    limitations: ["Only $1 trial credit", "No persistent free tier"],
    setupNotes:
      "Sign up at fireworks.ai, add billing details, generate an API key.",
    documentationUrl: "https://docs.fireworks.ai",
    warnings: ["Trial credit exhausted quickly on large models"],
    defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct",
  },

  {
    id: "baseten",
    name: "Baseten",
    category: "trial",
    website: "https://www.baseten.co",
    apiEndpoint: "https://model.baseten.co/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "x-api-key",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "medium",
    reasoningSuitability: "medium",
    longContextSuitability: "medium",
    latencyProfile: "medium",
    rateLimits: "$30 trial credit; pay-by-compute-time after",
    bestUseCases: [
      "Custom model deployment",
      "Serverless model inference",
      "Pay-per-use hosting of large models",
    ],
    limitations: [
      "Cold-start latency on serverless deployments",
      "Requires manual model deployment",
    ],
    setupNotes:
      "Sign up at app.baseten.co to receive $30 in trial credits, then generate an API key.",
    documentationUrl: "https://docs.baseten.co",
    warnings: ["Cold starts may add seconds to first-token latency"],
    defaultModel: "deepseek-ai/deepseek-v3",
  },

  {
    id: "hyperbolic",
    name: "Hyperbolic",
    category: "trial",
    website: "https://app.hyperbolic.ai",
    apiEndpoint: "https://api.hyperbolic.xyz/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "high",
    reasoningSuitability: "high",
    longContextSuitability: "high",
    latencyProfile: "medium",
    rateLimits: "$1 trial credit; usage-based after",
    bestUseCases: [
      "Large open-model inference (DeepSeek V3/R1)",
      "Qwen3 Coder 480B access",
      "GPU marketplace for custom models",
    ],
    limitations: ["Only $1 trial credit"],
    setupNotes:
      "Sign up at app.hyperbolic.ai, generate an API key from the dashboard.",
    documentationUrl: "https://docs.hyperbolic.xyz",
    warnings: ["Trial credit only — quickly exhausted"],
    defaultModel: "deepseek-ai/deepseek-v3",
  },

  {
    id: "lambda",
    name: "Lambda",
    category: "trial",
    website: "https://lambdalabs.com",
    apiEndpoint: "https://api.lambdalabs.com/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "medium",
    reasoningSuitability: "high",
    longContextSuitability: "medium",
    latencyProfile: "medium",
    rateLimits: "$5 trial credit (varies); usage-based after",
    bestUseCases: [
      "Open-model inference on Lambda cloud",
      "DeepSeek R1 and Hermes access",
      "GPU cloud workloads",
    ],
    limitations: ["Trial credit only", "Limited model catalog"],
    setupNotes:
      "Sign up at lambdalabs.com, generate an API key from the API section.",
    documentationUrl: "https://lambdalabs.com/api",
    warnings: ["Trial credit only — no persistent free tier"],
    defaultModel: "deepseek-ai/deepseek-r1",
  },

  {
    id: "sambanova",
    name: "SambaNova Cloud",
    category: "trial",
    website: "https://cloud.sambanova.ai",
    apiEndpoint: "https://api.sambanova.ai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 256000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "medium",
    reasoningSuitability: "high",
    longContextSuitability: "high",
    latencyProfile: "low",
    rateLimits: "$5 trial credit valid for 3 months",
    bestUseCases: [
      "Fast inference on RDU hardware",
      "DeepSeek V3 access",
      "Enterprise workloads needing long context",
    ],
    limitations: ["Trial expires after 3 months", "Limited model selection"],
    setupNotes:
      "Sign up at cloud.sambanova.ai, generate an API key from the dashboard.",
    documentationUrl: "https://docs.sambanova.ai",
    warnings: ["Trial credit expires after 3 months"],
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
  },

  {
    id: "scaleway",
    name: "Scaleway Generative APIs",
    category: "trial",
    website: "https://console.scaleway.com/generative-api/models",
    apiEndpoint: "https://api.scaleway.ai/ai-platform/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "high",
    reasoningSuitability: "medium",
    longContextSuitability: "high",
    latencyProfile: "low",
    rateLimits: "1,000,000 free tokens",
    bestUseCases: [
      "EU-hosted inference (GDPR-friendly)",
      "Devstral / Mistral coding models",
      "Pixtral multimodal tasks",
    ],
    limitations: [
      "1M tokens only",
      "EU regions only",
    ],
    setupNotes:
      "Sign up at console.scaleway.com, generate an API key under IAM.",
    documentationUrl: "https://www.scaleway.com/en/docs/generative-apis/",
    warnings: ["Token quota exhausted quickly on large models"],
    defaultModel: "llama-3.3-70b-instruct",
  },

  {
    id: "together-ai",
    name: "Together AI",
    category: "trial",
    website: "https://www.together.ai",
    apiEndpoint: "https://api.together.xyz/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "high",
    reasoningSuitability: "high",
    longContextSuitability: "high",
    latencyProfile: "low",
    rateLimits: "$5 trial credit; usage-based after",
    bestUseCases: [
      "Open-model serving with fine-tuning support",
      "DeepSeek R1 / Qwen Coder inference",
      "Production-grade inference platform",
    ],
    limitations: ["Trial credit only", "Pay-as-you-go pricing after trial"],
    setupNotes:
      "Sign up at api.together.xyz, generate an API key from the settings.",
    documentationUrl: "https://docs.together.ai",
    warnings: ["Trial credit only"],
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  },

  {
    id: "google-vertex-ai",
    name: "Google Cloud Vertex AI",
    category: "trial",
    website: "https://cloud.google.com/vertex-ai",
    apiEndpoint:
      "https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{LOCATION}/endpoints/openapi/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 1000000,
    streaming: true,
    toolCalling: true,
    vision: true,
    codingSuitability: "high",
    reasoningSuitability: "high",
    longContextSuitability: "high",
    latencyProfile: "medium",
    rateLimits: "$300 GCP free trial credit (valid 90 days)",
    bestUseCases: [
      "Enterprise-grade Gemini access",
      "Long-context multimodal tasks",
      "Workloads already integrated with Google Cloud",
    ],
    limitations: [
      "Requires GCP project setup",
      "OAuth-based auth requires token refresh",
      "Trial credit expires after 90 days",
    ],
    setupNotes:
      "Create a Google Cloud account, set up a project, enable the Vertex AI API, and create a service account or OAuth credentials.",
    documentationUrl: "https://cloud.google.com/vertex-ai/docs",
    warnings: [
      "Significant setup complexity",
      "OAuth access tokens require periodic refresh",
    ],
    defaultModel: "gemini-2.0-flash",
  },

  {
    id: "chutes",
    name: "Chutes",
    category: "trial",
    website: "https://chutes.ai",
    apiEndpoint: "https://api.chutes.ai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "medium",
    reasoningSuitability: "high",
    longContextSuitability: "medium",
    latencyProfile: "medium",
    rateLimits: "$5 trial credit; usage-based after",
    bestUseCases: [
      "Serverless model deployment",
      "DeepSeek R1 inference",
      "Custom model hosting",
    ],
    limitations: ["Trial credit only", "Cold starts on serverless deployments"],
    setupNotes:
      "Sign up at chutes.ai, generate an API key from the dashboard.",
    documentationUrl: "https://docs.chutes.ai",
    warnings: ["Trial credit only — quickly exhausted on large models"],
    defaultModel: "deepseek-ai/DeepSeek-R1",
  },

  {
    id: "kluster",
    name: "Kluster",
    category: "trial",
    website: "https://kluster.ai",
    apiEndpoint: "https://api.kluster.ai/v1/chat/completions",
    openAiCompatible: true,
    authMethod: "bearer",
    requiresApiKey: true,
    freeTierAvailable: false,
    trialCredits: true,
    contextWindow: 128000,
    streaming: true,
    toolCalling: true,
    vision: false,
    codingSuitability: "medium",
    reasoningSuitability: "medium",
    longContextSuitability: "medium",
    latencyProfile: "medium",
    rateLimits: "$5 trial credit; usage-based after",
    bestUseCases: [
      "Fine-tuning workflows",
      "Custom model hosting",
      "Open-model inference",
    ],
    limitations: ["Trial credit only", "Limited model catalog"],
    setupNotes:
      "Sign up at kluster.ai, generate an API key from the dashboard.",
    documentationUrl: "https://docs.kluster.ai",
    warnings: ["Trial credit only"],
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
  },
];

// ───────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────

/**
 * Returns all catalog entries matching a given category
 * ("free" | "trial" | "premium").
 */
export function getProvidersByCategory(
  category: ProviderCategory,
): ProviderCatalogEntry[] {
  return PROVIDER_CATALOG.filter((p) => p.category === category);
}

/**
 * Returns all catalog entries that accept OpenAI-format requests.
 */
export function getOpenAiCompatibleProviders(): ProviderCatalogEntry[] {
  return PROVIDER_CATALOG.filter((p) => p.openAiCompatible);
}

/**
 * Look up a provider by id. Returns undefined if not found.
 */
export function getProviderById(
  id: string,
): ProviderCatalogEntry | undefined {
  return PROVIDER_CATALOG.find((p) => p.id === id);
}
