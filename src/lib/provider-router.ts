/**
 * Provider Router — maps AI Council roles/tasks to the best available
 * provider, executes the LLM call, and records routing decisions.
 *
 * Execution backends:
 *  - "zai-default": the built-in z-ai-web-dev-sdk (always available, no key
 *    needed — acts as the platform's free default).
 *  - "openai-compatible": any OpenAI-compatible endpoint configured by the
 *    user via ProviderConfig (Groq, OpenRouter, Together, etc.).
 *
 * The router always records WHICH provider was selected, WHY, and whether a
 * fallback was used, so the UI can show full transparency.
 */

import ZAI from "z-ai-web-dev-sdk";
import { db } from "./db";
import {
  PROVIDER_CATALOG,
  getProviderById,
  type ProviderCatalogEntry,
} from "./provider-catalog";

export type ProviderMode = "own-keys" | "free" | "hybrid" | "local";

export type CouncilRole =
  | "moderator"
  | "productManager"
  | "businessAnalyst"
  | "solutionsArchitect"
  | "engineeringLead"
  | "qaLead"
  | "securityReviewer"
  | "uxReviewer"
  | "deliveryManager"
  | "complianceReviewer"
  | "devopsReviewer"
  | "financeReviewer"
  | "domainExpert"
  | "dataReviewer";

export type TaskType =
  | "long-context" // repo intelligence, large context ingestion
  | "reasoning" // requirement discovery, hypothesis generation
  | "coding" // architecture, engineering
  | "synthesis" // moderator consensus, document generation
  | "review" // validation, QA, security
  | "general"; // default

export interface RoutingDecision {
  role: CouncilRole | string;
  taskType: TaskType;
  providerId: string;
  providerName: string;
  reason: string;
  fallback: boolean;
  fallbackFrom?: string;
  backend: "zai-default" | "openai-compatible";
  model?: string;
}

export interface ProviderLogEntry {
  stage: string;
  role?: string;
  decision: RoutingDecision;
  at: string;
}

/** Role → preferred task-type mapping for routing. */
const ROLE_TASK_MAP: Record<string, TaskType> = {
  moderator: "synthesis",
  productManager: "reasoning",
  businessAnalyst: "reasoning",
  solutionsArchitect: "coding",
  engineeringLead: "coding",
  qaLead: "review",
  securityReviewer: "review",
  uxReviewer: "reasoning",
  deliveryManager: "general",
  complianceReviewer: "review",
  devopsReviewer: "coding",
  financeReviewer: "reasoning",
  domainExpert: "reasoning",
  dataReviewer: "reasoning",
};

/** Task → capability preference (higher = more important). */
const TASK_CAPABILITY_PREF: Record<TaskType, (p: ProviderCatalogEntry) => number> = {
  "long-context": (p) =>
    scoreSuitability(p.longContextSuitability) * 3 + p.contextWindow / 50000,
  reasoning: (p) => scoreSuitability(p.reasoningSuitability) * 3,
  coding: (p) => scoreSuitability(p.codingSuitability) * 3,
  synthesis: (p) =>
    scoreSuitability(p.reasoningSuitability) * 2 +
    scoreSuitability(p.longContextSuitability),
  review: (p) => scoreSuitability(p.reasoningSuitability) * 2 + 1,
  general: (p) => scoreSuitability(p.reasoningSuitability) * 2,
};

function scoreSuitability(s: "high" | "medium" | "low"): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

/** Get the effective provider mode from AppSettings. */
export async function getProviderMode(): Promise<ProviderMode> {
  const settings = await db.appSettings.findUnique({ where: { id: "singleton" } });
  return (settings?.providerMode as ProviderMode) ?? "free";
}

/** Get all configured providers (catalog + user keys). */
export async function getConfiguredProviders(): Promise<
  { catalog: ProviderCatalogEntry; hasKey: boolean; apiKey?: string }[]
> {
  const configs = await db.providerConfig.findMany();
  const keyMap = new Map(configs.map((c) => [c.providerId, c.apiKeyEnc]));
  const mode = await getProviderMode();

  return PROVIDER_CATALOG.filter((p) => {
    if (mode === "own-keys") return p.openAiCompatible && keyMap.has(p.id);
    if (mode === "free") return p.category === "free" || p.freeTierAvailable;
    if (mode === "hybrid")
      return p.openAiCompatible || p.category === "free" || p.freeTierAvailable;
    if (mode === "local") return false; // local mode = only zai-default
    return true;
  }).map((catalog) => ({
    catalog,
    hasKey: keyMap.has(catalog.id),
    apiKey: keyMap.get(catalog.id),
  }));
}

/**
 * Choose the best provider for a role+task. Falls back to zai-default
 * (the built-in free provider) when no configured provider is available.
 */
export async function routeProvider(
  role: CouncilRole | string,
  taskType?: TaskType,
): Promise<RoutingDecision> {
  const task = taskType ?? ROLE_TASK_MAP[role] ?? "general";
  const mode = await getProviderMode();
  const available = await getConfiguredProviders();

  // Score each available provider for this task.
  const scored = available
    .map(({ catalog, hasKey, apiKey }) => ({
      catalog,
      hasKey,
      apiKey,
      score: TASK_CAPABILITY_PREF[task](catalog),
    }))
    .sort((a, b) => b.score - a.score);

  // In own-keys mode, only use providers with a configured key.
  // In free/hybrid mode, prefer providers with keys, then free providers.
  const withKey = scored.filter((s) => s.hasKey);
  const withoutKey = scored.filter((s) => !s.hasKey);

  let chosen:
    | { catalog: ProviderCatalogEntry; hasKey: boolean; apiKey?: string; score: number }
    | null = null;
  let usedFallback = false;
  let fallbackFrom: string | undefined;

  if (mode === "own-keys") {
    chosen = withKey[0] ?? null;
  } else {
    // free / hybrid: prefer keyed providers, then free-tier providers
    chosen = withKey[0] ?? withoutKey[0] ?? null;
    if (chosen && !chosen.hasKey && mode === "hybrid") {
      // could use keyed, but fell back to free — note it
    }
  }

  // If no external provider is available, fall back to zai-default.
  if (!chosen) {
    usedFallback = true;
    fallbackFrom = "(no external provider configured)";
    return {
      role,
      taskType: task,
      providerId: "zai-default",
      providerName: "Z.ai Default (built-in)",
      reason: `No configured provider available for ${mode} mode; using built-in free provider.`,
      fallback: true,
      fallbackFrom,
      backend: "zai-default",
    };
  }

  return {
    role,
    taskType: task,
    providerId: chosen.catalog.id,
    providerName: chosen.catalog.name,
    reason: `Selected for ${task} task (${explainTaskFit(chosen.catalog, task)}). Mode: ${mode}. ${
      chosen.hasKey ? "API key configured." : "Free tier (no key needed)."
    }`,
    fallback: usedFallback,
    fallbackFrom,
    backend: chosen.hasKey ? "openai-compatible" : "zai-default",
    model: chosen.catalog.defaultModel,
  };
}

function explainTaskFit(p: ProviderCatalogEntry, task: TaskType): string {
  const parts: string[] = [];
  if (task === "long-context") parts.push(`ctx ${p.contextWindow >= 128000 ? "high" : "med"}`);
  if (task === "reasoning") parts.push(`reasoning ${p.reasoningSuitability}`);
  if (task === "coding") parts.push(`coding ${p.codingSuitability}`);
  if (task === "synthesis") parts.push(`synthesis ${p.reasoningSuitability}`);
  if (task === "review") parts.push(`review ${p.reasoningSuitability}`);
  return parts.join(", ") || `general ${p.reasoningSuitability}`;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ExecuteOptions {
  decision: RoutingDecision;
  messages: { system: string; user: string };
  retries?: number;
  /** If true, request JSON-only output. */
  jsonMode?: boolean;
}

export interface ExecuteResult {
  content: string;
  decision: RoutingDecision;
  attempts: number;
  fellBackToZai: boolean;
}

/**
 * Execute an LLM call via the routed provider. If an external provider
 * fails (rate limit, auth error, network), automatically falls back to
 * zai-default and records the fallback.
 */
export async function executeWithRouting(
  opts: ExecuteOptions,
): Promise<ExecuteResult> {
  const { decision, messages } = opts;
  const retries = opts.retries ?? 1;

  // zai-default: always uses z-ai-web-dev-sdk
  if (decision.backend === "zai-default") {
    const content = await callZai(messages, opts.jsonMode, retries);
    return { content, decision, attempts: 1, fellBackToZai: false };
  }

  // openai-compatible: try fetch(), fall back to zai on failure
  const cfg = await db.providerConfig.findUnique({
    where: { providerId: decision.providerId },
  });
  if (!cfg) {
    // key was removed — fall back
    const fallbackDecision: RoutingDecision = {
      ...decision,
      fallback: true,
      fallbackFrom: decision.providerName,
      backend: "zai-default",
      providerId: "zai-default",
      providerName: "Z.ai Default (built-in)",
      reason: `${decision.providerName} key not found; fell back to built-in provider.`,
    };
    const content = await callZai(messages, opts.jsonMode, retries);
    return { content, decision: fallbackDecision, attempts: 1, fellBackToZai: true };
  }

  const catalog = getProviderById(decision.providerId);
  if (!catalog) {
    const content = await callZai(messages, opts.jsonMode, retries);
    return {
      content,
      decision: { ...decision, fallback: true, backend: "zai-default" },
      attempts: 1,
      fellBackToZai: true,
    };
  }

  try {
    const content = await callOpenAiCompatible(
      catalog,
      cfg.apiKeyEnc,
      messages,
      opts.jsonMode,
      retries,
    );
    return { content, decision, attempts: 1, fellBackToZai: false };
  } catch (err) {
    // Fall back to zai-default
    const fallbackDecision: RoutingDecision = {
      ...decision,
      fallback: true,
      fallbackFrom: decision.providerName,
      backend: "zai-default",
      providerId: "zai-default",
      providerName: "Z.ai Default (built-in)",
      reason: `${decision.providerName} failed (${
        err instanceof Error ? err.message.slice(0, 80) : "unknown error"
      }); fell back to built-in provider.`,
    };
    const content = await callZai(messages, opts.jsonMode, retries);
    return { content, decision: fallbackDecision, attempts: 2, fellBackToZai: true };
  }
}

async function callZai(
  messages: { system: string; user: string },
  jsonMode?: boolean,
  retries = 1,
): Promise<string> {
  const zai = await getZai();
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const system = jsonMode
        ? messages.system +
          "\n\nRespond with a single valid JSON object and nothing else. No markdown fences, no commentary."
        : messages.system;
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: system },
          { role: "user", content: messages.user },
        ],
        thinking: { type: "disabled" },
      });
      const content = completion.choices[0]?.message?.content ?? "";
      if (!content.trim()) throw new Error("Empty response");
      return content;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("ZAI call failed");
}

async function callOpenAiCompatible(
  catalog: ProviderCatalogEntry,
  apiKey: string,
  messages: { system: string; user: string },
  jsonMode?: boolean,
  retries = 1,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (catalog.authMethod === "bearer") headers["Authorization"] = `Bearer ${apiKey}`;
  else if (catalog.authMethod === "x-api-key") headers["x-api-key"] = apiKey;

  const body: Record<string, unknown> = {
    model: catalog.defaultModel,
    messages: [
      { role: "system", content: messages.system },
      { role: "user", content: messages.user },
    ],
    temperature: 0.7,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(catalog.apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content || !content.trim()) throw new Error("Empty response");
      return content;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Provider call failed");
}

/** Mask an API key for safe display: show first 3 + last 4 chars. */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 3)}••••${key.slice(-4)}`;
}

/** Build a routing plan for all council roles at once (for preview/display). */
export async function buildRoutingPlan(): Promise<RoutingDecision[]> {
  const roles: CouncilRole[] = [
    "moderator",
    "productManager",
    "businessAnalyst",
    "solutionsArchitect",
    "engineeringLead",
    "qaLead",
    "securityReviewer",
    "uxReviewer",
    "deliveryManager",
  ];
  return Promise.all(roles.map((r) => routeProvider(r)));
}
