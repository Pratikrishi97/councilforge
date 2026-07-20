"use client";

import { useWorkspace } from "@/store/workspace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  moderator: "Moderator",
  productManager: "Product Manager",
  businessAnalyst: "Business Analyst",
  solutionsArchitect: "Solutions Architect",
  engineeringLead: "Engineering Lead",
  qaLead: "QA Lead",
  securityReviewer: "Security Reviewer",
  uxReviewer: "UX Reviewer",
  deliveryManager: "Delivery Manager",
};

export function RegistryModal() {
  const {
    registryModalOpen,
    setRegistryModalOpen,
    providers,
    onboarding,
    bootstrapRegistry,
    bootstrapLoading,
    setProviderMode,
  } = useWorkspace();

  const free = providers.filter((p) => p.category === "free");
  const trial = providers.filter((p) => p.category === "trial");

  return (
    <Dialog open={registryModalOpen} onOpenChange={setRegistryModalOpen}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Provider Registry & Routing
          </DialogTitle>
          <DialogDescription>
            Bootstrapped from{" "}
            <a
              href="https://github.com/cheahjs/free-llm-api-resources"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              cheahjs/free-llm-api-resources
            </a>
            . The router maps each council role to the best available provider.
          </DialogDescription>
        </DialogHeader>

        {/* Current mode + routing plan */}
        {onboarding && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mode:
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {onboarding.providerMode}
              </span>
              <div className="ml-auto flex gap-1">
                {(["free", "hybrid", "own-keys", "local"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => void setProviderMode(m)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[10px] font-medium transition",
                      onboarding.providerMode === m
                        ? "bg-primary text-primary-foreground"
                        : "border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {onboarding.routingPlan && onboarding.routingPlan.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role → Provider routing plan
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {onboarding.routingPlan.map((d) => (
                    <div
                      key={d.role}
                      className="rounded-md border bg-card p-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium">
                          {ROLE_LABELS[d.role] ?? d.role}
                        </span>
                        {d.fallback && (
                          <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-600 dark:text-amber-400">
                            fallback
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {d.providerName}
                      </p>
                      <p className="mt-0.5 text-[10px] italic text-muted-foreground/70">
                        {d.reason.slice(0, 80)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Registry list */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Registry ({providers.length} providers)
          </span>
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
            Refresh from source
          </Button>
        </div>

        <ProviderSection
          title="Free providers"
          icon={Zap}
          providers={free}
        />
        <ProviderSection
          title="Trial-credit providers"
          icon={ShieldCheck}
          providers={trial}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProviderSection({
  title,
  icon: Icon,
  providers,
}: {
  title: string;
  icon: typeof Zap;
  providers: ReturnType<typeof useWorkspace.getState>["providers"];
}) {
  if (providers.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">{title}</span>
        <span className="text-[10px] text-muted-foreground">
          ({providers.length})
        </span>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {providers.map((p) => (
          <div key={p.id} className="rounded-md border bg-card p-2.5 text-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold">{p.name}</span>
              <div className="flex items-center gap-1">
                {p.keyConfigured && (
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                    keyed
                  </span>
                )}
                {p.openAiCompatible && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    OpenAI-compat
                  </span>
                )}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
              <span>ctx: {p.contextWindow.toLocaleString()}</span>
              <span>· reasoning: {p.reasoningSuitability}</span>
              <span>· coding: {p.codingSuitability}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground/80">
              {p.rateLimits}
            </p>
            <a
              href={p.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
            >
              docs <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
