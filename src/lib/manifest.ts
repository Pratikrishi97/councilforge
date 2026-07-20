import type { ProviderLogEntry } from "./provider-router";

/**
 * Generation manifest — captures the full generation recipe for
 * reproducibility. Stored per DocVersion.
 */
export interface GenerationManifest {
  /** Prompt library version (semver-ish). */
  promptVersion: string;
  /** Platform version. */
  platformVersion: string;
  /** Provider mode used. */
  providerMode: string;
  /** Provider routing log (which provider powered which stage). */
  providerLog: ProviderLogEntry[];
  /** Council roles that were active. */
  activeRoles: string[];
  /** Number of debate rounds run. */
  debateRounds: number;
  /** Whether a revision was applied. */
  revised: boolean;
  /** Quality score from validation. */
  qualityScore: number | null;
  /** Validation council verdict. */
  validationVerdict: string | null;
  /** Selected document type. */
  docType: string;
  /** Document type selection reason. */
  docTypeReason: string | null;
  /** Total stages executed. */
  totalStages: number;
  /** Gate mode setting. */
  gateMode: "enabled" | "disabled";
  /** Timestamps. */
  startedAt: string;
  completedAt: string;
  /** Total LLM calls made. */
  totalLLMCalls: number;
  /** Fallback count (how many stages fell back to zai-default). */
  fallbackCount: number;
}

export const PROMPT_VERSION = "2.0.0";
export const PLATFORM_VERSION = "ai-os-2.0";

export function buildManifest(params: {
  providerMode: string;
  providerLog: ProviderLogEntry[];
  activeRoles: string[];
  debateRounds: number;
  revised: boolean;
  qualityScore: number | null;
  validationVerdict: string | null;
  docType: string;
  docTypeReason: string | null;
  totalStages: number;
  gateMode: "enabled" | "disabled";
  startedAt: string;
}): GenerationManifest {
  const completedAt = new Date().toISOString();
  const fallbackCount = params.providerLog.filter(
    (e) => e.decision.fallback,
  ).length;

  return {
    promptVersion: PROMPT_VERSION,
    platformVersion: PLATFORM_VERSION,
    providerMode: params.providerMode,
    providerLog: params.providerLog,
    activeRoles: params.activeRoles,
    debateRounds: params.debateRounds,
    revised: params.revised,
    qualityScore: params.qualityScore,
    validationVerdict: params.validationVerdict,
    docType: params.docType,
    docTypeReason: params.docTypeReason,
    totalStages: params.totalStages,
    gateMode: params.gateMode,
    startedAt: params.startedAt,
    completedAt,
    totalLLMCalls: params.providerLog.length,
    fallbackCount,
  };
}
