"use client";

import { create } from "zustand";
import type { DocType } from "@/lib/doc-types";

export type StageKey =
  | "ingest"
  | "understand"
  | "dynamic_council"
  | "research"
  | "hypotheses"
  | "debate_round1"
  | "debate_round2"
  | "moderator"
  | "ai_voting"
  | "requirements"
  | "gaps_risks"
  | "competitor_intel"
  | "feature_recs"
  | "strategy"
  | "generate"
  | "validate"
  | "revise"
  | "validation_council"
  | "acceptance_tests"
  | "backlog"
  | "roadmap"
  | "evaluation"
  | "cost_estimate"
  | "sprint_plan"
  | "arch_simulation"
  | "scenario_simulation"
  | "knowledge_graph"
  | "decision_journal"
  | "metadata";

export type StageStatus = "idle" | "running" | "done" | "skipped" | "error";

export interface StageState {
  status: StageStatus;
  data?: unknown;
  skipReason?: string;
}

export interface RoutingDecision {
  role: string;
  taskType: string;
  providerId: string;
  providerName: string;
  reason: string;
  fallback: boolean;
  fallbackFrom?: string;
  backend: string;
  model?: string;
}

export interface ProviderLogEntry {
  stage: string;
  role?: string;
  decision: RoutingDecision;
  at: string;
}

interface PipelineEvent {
  type:
    | "stage_start"
    | "stage_complete"
    | "stage_skipped"
    | "doc_type_resolved"
    | "version_created"
    | "revision_applied"
    | "provider_routed"
    | "gate_reached"
    | "manifest_built"
    | "error"
    | "complete";
  stage?: StageKey;
  label?: string;
  data?: unknown;
  reason?: string;
  docType?: DocType;
  message?: string;
  projectId?: string;
  versionId?: string;
  versionNumber?: number;
  focus?: string;
  decision?: RoutingDecision;
  manifest?: unknown;
}

export interface ProjectListItem {
  id: string;
  name: string;
  sourceType: string;
  repoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  versions: {
    id: string;
    versionNumber: number;
    docType: string;
    status: string;
    qualityScore: number | null;
    createdAt: string;
  }[];
  _count: { versions: number };
}

export interface ProjectMemory {
  goals?: string[];
  stakeholders?: string[];
  decisions?: { decision: string; rationale: string; date?: string }[];
  assumptions?: string[];
  risks?: { description: string; category?: string }[];
  openQuestions?: string[];
  priorSummary?: string;
}

export interface ProviderCatalogItem {
  id: string;
  name: string;
  category: string;
  website: string;
  apiEndpoint: string;
  openAiCompatible: boolean;
  authMethod: string;
  requiresApiKey: boolean;
  freeTierAvailable: boolean;
  trialCredits: boolean;
  contextWindow: number;
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
  codingSuitability: string;
  reasoningSuitability: string;
  longContextSuitability: string;
  latencyProfile: string;
  rateLimits: string;
  bestUseCases: string[];
  limitations: string[];
  setupNotes: string;
  documentationUrl: string;
  warnings: string[];
  defaultModel: string;
  enabled: boolean;
  keyConfigured: boolean;
  keyMasked: string | null;
}

export interface OnboardingState {
  onboardingComplete: boolean;
  providerMode: "own-keys" | "free" | "hybrid" | "local";
  registryVersion: string | null;
  routingPlan: RoutingDecision[] | null;
}

interface WorkspaceState {
  // --- onboarding / providers ---
  onboarding: OnboardingState | null;
  providers: ProviderCatalogItem[];
  onboardingModalOpen: boolean;
  registryModalOpen: boolean;
  bootstrapLoading: boolean;

  // --- input ---
  sourceType: "repo" | "text" | "mixed";
  repoUrl: string;
  text: string;
  docType: DocType;
  audience: string;
  continueProjectId: string | null;

  // --- pipeline ---
  running: boolean;
  error: string | null;
  stages: Record<StageKey, StageState>;
  providerLog: ProviderLogEntry[];
  resolvedDocType: DocType | null;
  resolvedDocReason: string | null;
  currentProjectId: string | null;
  currentVersionId: string | null;
  currentVersionNumber: number | null;
  revisionApplied: boolean;
  revisionFocus: string | null;

  // --- project list / memory ---
  projects: ProjectListItem[];
  projectsLoading: boolean;
  memory: ProjectMemory | null;
  loadedVersionId: string | null;
  parentVersionId: string | null;
  parentDocument: string | null;

  // --- actions: onboarding ---
  fetchOnboarding: () => Promise<void>;
  completeOnboarding: (mode: OnboardingState["providerMode"]) => Promise<void>;
  setProviderMode: (mode: OnboardingState["providerMode"]) => Promise<void>;
  setOnboardingModalOpen: (open: boolean) => void;
  setRegistryModalOpen: (open: boolean) => void;
  bootstrapRegistry: () => Promise<void>;
  fetchProviders: () => Promise<void>;
  addProviderKey: (providerId: string, apiKey: string) => Promise<boolean>;
  removeProviderKey: (providerId: string) => Promise<boolean>;

  // --- actions: pipeline ---
  setSourceType: (s: "repo" | "text" | "mixed") => void;
  setRepoUrl: (v: string) => void;
  setText: (v: string) => void;
  setDocType: (d: DocType) => void;
  setAudience: (v: string) => void;
  setContinueProject: (id: string | null) => void;
  startGeneration: () => Promise<void>;
  abortGeneration: () => void;
  resetPipeline: () => void;
  refreshProjects: () => Promise<void>;
  loadVersion: (versionId: string, parentDoc?: string | null) => Promise<void>;
  loadProjectMemory: (projectId: string) => Promise<void>;
}

const INITIAL_STAGES: Record<StageKey, StageState> = {
  ingest: { status: "idle" },
  understand: { status: "idle" },
  dynamic_council: { status: "idle" },
  research: { status: "idle" },
  hypotheses: { status: "idle" },
  debate_round1: { status: "idle" },
  debate_round2: { status: "idle" },
  moderator: { status: "idle" },
  ai_voting: { status: "idle" },
  requirements: { status: "idle" },
  gaps_risks: { status: "idle" },
  competitor_intel: { status: "idle" },
  feature_recs: { status: "idle" },
  strategy: { status: "idle" },
  generate: { status: "idle" },
  validate: { status: "idle" },
  revise: { status: "idle" },
  validation_council: { status: "idle" },
  acceptance_tests: { status: "idle" },
  backlog: { status: "idle" },
  roadmap: { status: "idle" },
  evaluation: { status: "idle" },
  cost_estimate: { status: "idle" },
  sprint_plan: { status: "idle" },
  arch_simulation: { status: "idle" },
  scenario_simulation: { status: "idle" },
  knowledge_graph: { status: "idle" },
  decision_journal: { status: "idle" },
  metadata: { status: "idle" },
};

let activeController: AbortController | null = null;

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  onboarding: null,
  providers: [],
  onboardingModalOpen: false,
  registryModalOpen: false,
  bootstrapLoading: false,

  sourceType: "text",
  repoUrl: "",
  text: "",
  docType: "AUTO",
  audience: "",
  continueProjectId: null,

  running: false,
  error: null,
  stages: { ...INITIAL_STAGES },
  providerLog: [],
  resolvedDocType: null,
  resolvedDocReason: null,
  currentProjectId: null,
  currentVersionId: null,
  currentVersionNumber: null,
  revisionApplied: false,
  revisionFocus: null,

  projects: [],
  projectsLoading: false,
  memory: null,
  loadedVersionId: null,
  parentVersionId: null,
  parentDocument: null,

  fetchOnboarding: async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      set({
        onboarding: {
          onboardingComplete: data.onboardingComplete,
          providerMode: data.providerMode,
          registryVersion: data.registryVersion,
          routingPlan: data.routingPlan,
        },
        onboardingModalOpen: !data.onboardingComplete,
      });
    } catch {
      /* ignore */
    }
  },

  completeOnboarding: async (mode) => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerMode: mode }),
      });
      await get().fetchOnboarding();
      set({ onboardingModalOpen: false });
    } catch {
      /* ignore */
    }
  },

  setProviderMode: async (mode) => {
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerMode: mode }),
      });
      await get().fetchOnboarding();
    } catch {
      /* ignore */
    }
  },

  setOnboardingModalOpen: (open) => set({ onboardingModalOpen: open }),
  setRegistryModalOpen: (open) => set({ registryModalOpen: open }),

  bootstrapRegistry: async () => {
    set({ bootstrapLoading: true });
    try {
      const res = await fetch("/api/providers/bootstrap", { method: "POST" });
      if (res.ok) {
        await get().fetchProviders();
        await get().fetchOnboarding();
      }
    } catch {
      /* ignore */
    }
    set({ bootstrapLoading: false });
  },

  fetchProviders: async () => {
    try {
      const res = await fetch("/api/providers/bootstrap", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      set({ providers: data.providers ?? [] });
    } catch {
      /* ignore */
    }
  },

  addProviderKey: async (providerId, apiKey) => {
    try {
      const res = await fetch("/api/providers/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, apiKey }),
      });
      if (!res.ok) return false;
      await get().fetchProviders();
      return true;
    } catch {
      return false;
    }
  },

  removeProviderKey: async (providerId) => {
    try {
      const res = await fetch(`/api/providers/keys/${providerId}`, {
        method: "DELETE",
      });
      if (!res.ok) return false;
      await get().fetchProviders();
      return true;
    } catch {
      return false;
    }
  },

  setSourceType: (s) => set({ sourceType: s }),
  setRepoUrl: (v) => set({ repoUrl: v }),
  setText: (v) => set({ text: v }),
  setDocType: (d) => set({ docType: d }),
  setAudience: (v) => set({ audience: v }),
  setContinueProject: (id) => set({ continueProjectId: id, memory: null }),

  resetPipeline: () =>
    set({
      stages: { ...INITIAL_STAGES },
      providerLog: [],
      error: null,
      resolvedDocType: null,
      resolvedDocReason: null,
      currentProjectId: null,
      currentVersionId: null,
      currentVersionNumber: null,
      revisionApplied: false,
      revisionFocus: null,
      loadedVersionId: null,
      parentVersionId: null,
      parentDocument: null,
    }),

  abortGeneration: () => {
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    set({ running: false });
  },

  startGeneration: async () => {
    // Guard: require onboarding before generation
    const { onboarding } = get();
    if (!onboarding?.onboardingComplete) {
      set({ onboardingModalOpen: true });
      return;
    }

    const { sourceType, repoUrl, text, docType, audience, continueProjectId } =
      get();
    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;

    set({
      running: true,
      error: null,
      stages: { ...INITIAL_STAGES },
      providerLog: [],
      resolvedDocType: docType === "AUTO" ? null : docType,
      resolvedDocReason: null,
      currentProjectId: continueProjectId,
      currentVersionId: null,
      currentVersionNumber: null,
      revisionApplied: false,
      revisionFocus: null,
      loadedVersionId: null,
      parentVersionId: null,
      parentDocument: null,
    });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: continueProjectId ?? undefined,
          sourceType,
          repoUrl,
          text,
          docType,
          audience,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const msg = await safeError(res);
        set({ running: false, error: msg });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          let evt: PipelineEvent;
          try {
            evt = JSON.parse(payload) as PipelineEvent;
          } catch {
            continue;
          }
          applyEvent(evt, set, get);
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        set({ running: false });
        return;
      }
      set({
        running: false,
        error: err instanceof Error ? err.message : "Stream failed.",
      });
    } finally {
      if (activeController === controller) activeController = null;
      set({ running: false });
      void get().refreshProjects();
      const { currentVersionId, error } = get();
      if (currentVersionId && !error) {
        void get().loadVersion(currentVersionId);
      }
    }
  },

  refreshProjects: async () => {
    set({ projectsLoading: true });
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      set({ projects: data.projects ?? [], projectsLoading: false });
    } catch {
      set({ projectsLoading: false });
    }
  },

  loadProjectMemory: async (projectId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      set({ memory: data.project?.memory ?? null });
    } catch {
      /* ignore */
    }
  },

  loadVersion: async (versionId, parentDoc) => {
    set({ loadedVersionId: versionId, error: null });
    try {
      const res = await fetch(`/api/versions/${versionId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        set({ error: "Could not load version." });
        return;
      }
      const data = await res.json();
      const v = data.version;
      set({
        stages: {
          ingest: { status: "done", data: v.repoIntel ? { repoSummary: { name: v.repoIntel.owner + "/" + v.repoIntel.repo } } : { sourceType: v.sourceType } },
          understand: { status: "done", data: v.contextMap },
          dynamic_council: { status: "done", data: v.dynamicCouncil },
          research: { status: "done", data: v.research },
          hypotheses: { status: "done", data: v.hypotheses },
          debate_round1: {
            status: "done",
            data: v.debateRounds?.round1 ?? null,
          },
          debate_round2: {
            status: "done",
            data: v.debateRounds?.round2 ?? null,
          },
          moderator: { status: "done", data: v.debateRounds?.moderator ?? v.debate },
          ai_voting: { status: "done", data: v.aiVoting },
          requirements: { status: "done", data: v.requirements },
          gaps_risks: { status: "done", data: { gaps: v.gaps, risks: v.risks } },
          competitor_intel: { status: "done", data: v.competitorIntel },
          feature_recs: { status: "done", data: v.featureRecs },
          strategy: { status: "done", data: v.strategy },
          generate: { status: "done", data: v.document },
          validate: {
            status: "done",
            data: v.qualityGates
              ? {
                  qualityScore: v.qualityScore,
                  qualityGates: v.qualityGates,
                  strengths: [],
                  weaknesses: [],
                  contradictionsFound: [],
                }
              : null,
          },
          revise: v.revised
            ? { status: "done", data: v.document }
            : { status: "skipped", skipReason: "No revision needed" },
          validation_council: { status: "done", data: v.validationCouncil },
          acceptance_tests: { status: "done", data: null }, // loaded via API
          backlog: { status: "done", data: null }, // loaded via API
          roadmap: { status: "done", data: null }, // loaded via API
          evaluation: { status: "done", data: null }, // loaded via API
          cost_estimate: { status: "done", data: v.costEstimate },
          sprint_plan: { status: "done", data: v.sprintPlan },
          arch_simulation: { status: "done", data: v.archSimulation },
          scenario_simulation: { status: "done", data: v.scenarioSimulation },
          knowledge_graph: { status: "done", data: v.knowledgeGraph },
          decision_journal: { status: "done", data: v.decisionJournal },
          metadata: {
            status: "done",
            data: {
              assumptions: v.assumptions,
              confidence: v.confidence,
              openQuestions: v.openQuestions,
              nextActions: v.nextActions,
              traceability: v.traceability,
              changeSummary: v.changeSummary,
            },
          },
        },
        providerLog: v.providerLog ?? [],
        resolvedDocType: v.docType,
        resolvedDocReason: v.docTypeReason,
        currentProjectId: v.projectId,
        currentVersionId: v.id,
        currentVersionNumber: v.versionNumber,
        revisionApplied: v.revised,
        revisionFocus: v.revisionFocus?.focus ?? null,
        docType: v.docType,
        sourceType: v.sourceType,
        repoUrl:
          v.sourceType === "repo" || v.sourceType === "mixed"
            ? v.sourceInput
            : "",
        text: v.sourceType === "text" ? v.sourceInput : "",
        audience: v.audience ?? "",
        parentVersionId: v.parentVersionId,
        parentDocument: parentDoc ?? null,
      });
      if (v.parentVersionId && !parentDoc) {
        try {
          const pres = await fetch(`/api/versions/${v.parentVersionId}`, {
            cache: "no-store",
          });
          if (pres.ok) {
            const pdata = await pres.json();
            set({ parentDocument: pdata.version?.document ?? null });
          }
        } catch {
          /* ignore */
        }
      }
      // fetch knowledge graph from the dedicated API if not on the version
      if (!v.knowledgeGraph && v.projectId) {
        try {
          const kres = await fetch(`/api/projects/${v.projectId}/knowledge`, {
            cache: "no-store",
          });
          if (kres.ok) {
            const kdata = await kres.json();
            if (kdata.nodes && kdata.nodes.length > 0) {
              set({
                stages: {
                  ...get().stages,
                  knowledge_graph: { status: "done", data: kdata },
                },
              });
            }
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      set({ error: "Failed to load version." });
    }
  },
}));

function applyEvent(
  evt: PipelineEvent,
  set: (partial: Partial<WorkspaceState>) => void,
  get: () => WorkspaceState,
) {
  switch (evt.type) {
    case "stage_start":
      if (!evt.stage) return;
      set({
        stages: {
          ...get().stages,
          [evt.stage]: { status: "running" },
        },
      });
      break;
    case "stage_complete":
      if (!evt.stage) return;
      set({
        stages: {
          ...get().stages,
          [evt.stage]: { status: "done", data: evt.data },
        },
      });
      break;
    case "stage_skipped":
      if (!evt.stage) return;
      set({
        stages: {
          ...get().stages,
          [evt.stage]: { status: "skipped", skipReason: evt.reason },
        },
      });
      break;
    case "provider_routed":
      if (!evt.stage || !evt.decision) return;
      set({
        providerLog: [
          ...get().providerLog,
          {
            stage: evt.stage,
            decision: evt.decision,
            at: new Date().toISOString(),
          },
        ],
      });
      break;
    case "doc_type_resolved":
      set({
        resolvedDocType: evt.docType ?? null,
        resolvedDocReason: evt.reason ?? null,
      });
      break;
    case "version_created":
      set({
        currentProjectId: evt.projectId ?? get().currentProjectId,
        currentVersionId: evt.versionId ?? null,
        currentVersionNumber: evt.versionNumber ?? null,
      });
      break;
    case "revision_applied":
      set({ revisionApplied: true, revisionFocus: evt.focus ?? null });
      break;
    case "complete":
      set({
        running: false,
        currentProjectId: evt.projectId ?? get().currentProjectId,
        currentVersionId: evt.versionId ?? get().currentVersionId,
      });
      break;
    case "error":
      set({ running: false, error: evt.message ?? "Unknown error." });
      break;
  }
}

async function safeError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error ?? `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}
