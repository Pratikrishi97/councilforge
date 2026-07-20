"use client";

import { useState } from "react";
import { useWorkspace } from "@/store/workspace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Check,
  KeyRound,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProviderCatalogItem } from "@/store/workspace";

type Mode = "own-keys" | "free" | "hybrid" | "local";

const MODES: {
  id: Mode;
  label: string;
  icon: typeof KeyRound;
  desc: string;
  detail: string;
}[] = [
  {
    id: "own-keys",
    label: "Use my own API keys",
    icon: KeyRound,
    desc: "Bring your own provider keys (OpenAI-compatible).",
    detail:
      "Best for production. All council roles route to your configured providers. Keys are masked and never logged.",
  },
  {
    id: "free",
    label: "Use free LLM APIs",
    icon: Zap,
    desc: "Route to free-tier providers from the registry.",
    detail:
      "No keys needed for the built-in provider. Free-tier providers from the registry may have rate limits.",
  },
  {
    id: "hybrid",
    label: "Hybrid setup",
    icon: Layers,
    desc: "Mix premium keys + free providers.",
    detail:
      "The router picks the best provider per role: your keyed providers first, then free-tier fallbacks.",
  },
  {
    id: "local",
    label: "Local fallback",
    icon: ShieldCheck,
    desc: "Use only the built-in provider.",
    detail:
      "Everything runs through the platform's built-in LLM. No external calls, no keys, fully offline-capable.",
  },
];

export function OnboardingModal() {
  const {
    onboardingModalOpen,
    setOnboardingModalOpen,
    completeOnboarding,
    onboarding,
    bootstrapRegistry,
    bootstrapLoading,
    providers,
  } = useWorkspace();

  const [step, setStep] = useState<"intro" | "select" | "keys">("intro");
  const [selectedMode, setSelectedMode] = useState<Mode>("free");

  const handleFinish = async () => {
    await completeOnboarding(selectedMode);
    setStep("intro");
    setSelectedMode("free");
  };

  const openAiCompatible = providers.filter(
    (p: ProviderCatalogItem) => p.openAiCompatible,
  );

  return (
    <Dialog
      open={onboardingModalOpen}
      onOpenChange={(open) => {
        if (onboarding?.onboardingComplete) {
          setOnboardingModalOpen(open);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to the CouncilForge
          </DialogTitle>
          <DialogDescription>
            Configure how the council's expert roles connect to LLM providers.
            Different roles can use different models — the router picks the best
            one for each task.
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
              <p className="font-semibold text-foreground">Why providers?</p>
              <p className="mt-1 text-muted-foreground">
                The AI Council runs 8+ expert roles (PM, Architect, Security,
                QA…). Each role's task has different needs — long context for
                repo analysis, strong reasoning for requirements, coding
                capability for architecture. The router matches each role to
                the best available model.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-medium">Key safety</span>
              </div>
              <p className="text-xs text-muted-foreground">
                API keys are stored locally, masked in the UI, never printed
                into generated documents, and never included in logs.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <span className="font-medium">Provider registry</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void bootstrapRegistry()}
                  disabled={bootstrapLoading}
                  className="h-7 gap-1.5 text-xs"
                >
                  {bootstrapLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {providers.length > 0
                    ? `Refresh (${providers.length})`
                    : "Bootstrap"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Bootstrapped from{" "}
                <a
                  href="https://github.com/cheahjs/free-llm-api-resources"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  cheahjs/free-llm-api-resources
                </a>
                . {providers.length} providers available.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setStep("select")} className="gap-1.5">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "select" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                How do you want to configure AI providers?
              </Label>
            </div>
            <div className="grid gap-2">
              {MODES.map((m) => {
                const active = selectedMode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition",
                      active
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/40 hover:bg-accent/50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                        active ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{m.label}</span>
                        {active && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {m.desc}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        {m.detail}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("intro")}
                className="text-xs"
              >
                Back
              </Button>
              {selectedMode === "own-keys" || selectedMode === "hybrid" ? (
                <Button
                  onClick={() => setStep("keys")}
                  className="gap-1.5 text-xs"
                >
                  Configure keys
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="gap-1.5 text-xs">
                  Start using the council
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {step === "keys" && (
          <KeyConfigStep
            providers={openAiCompatible}
            onFinish={handleFinish}
            onBack={() => setStep("select")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function KeyConfigStep({
  providers,
  onFinish,
  onBack,
}: {
  providers: ProviderCatalogItem[];
  onFinish: () => void;
  onBack: () => void;
}) {
  const { addProviderKey, removeProviderKey } = useWorkspace();
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!activeProvider || !keyInput.trim()) return;
    setSaving(true);
    const ok = await addProviderKey(activeProvider, keyInput.trim());
    setSaving(false);
    if (ok) {
      setKeyInput("");
      setActiveProvider(null);
    }
  };

  const handleRemove = async (providerId: string) => {
    await removeProviderKey(providerId);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Add API keys (optional — you can skip and add later)
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Keys are masked and stored locally. The router uses keyed providers
          first, then falls back to the built-in free provider.
        </p>
      </div>

      <div className="max-h-64 space-y-1.5 overflow-y-auto scroll-thin rounded-lg border p-2">
        {providers.map((p) => (
          <div key={p.id} className="rounded-md border bg-card p-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-xs font-semibold">{p.name}</span>
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  {p.category} · {p.defaultModel}
                </span>
              </div>
              {p.keyConfigured ? (
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    {p.keyMasked}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleRemove(p.id)}
                    className="text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveProvider(p.id)}
                  className="text-[10px] font-medium text-primary hover:underline"
                >
                  + add key
                </button>
              )}
            </div>
            {activeProvider === p.id && (
              <div className="mt-2 flex gap-1.5">
                <Input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={`Paste your ${p.name} API key`}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !keyInput.trim()}
                  className="h-8 gap-1 text-xs"
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="text-xs">
          Back
        </Button>
        <Button onClick={onFinish} className="gap-1.5 text-xs">
          Finish setup
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
