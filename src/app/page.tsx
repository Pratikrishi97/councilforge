"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/store/workspace";
import { SourceInput, GenerateButton } from "@/components/workspace/source-input";
import { DocTypePicker } from "@/components/workspace/doc-type-picker";
import { PipelineProgress } from "@/components/workspace/pipeline-progress";
import { ProjectSidebar } from "@/components/workspace/project-sidebar";
import { DocumentViewer } from "@/components/workspace/document-viewer";
import { DiffView } from "@/components/workspace/diff-view";
import { ProviderLogView } from "@/components/workspace/provider-log";
import { OnboardingModal } from "@/components/workspace/onboarding-modal";
import { RegistryModal } from "@/components/workspace/registry-modal";
import { DashboardView } from "@/components/workspace/dashboard-view";
import {
  CompletenessWidget,
  NotificationsBell,
  CommentsView,
  ProviderAnalyticsView,
  ImpactPropagationView,
  OrchestratorPanel,
} from "@/components/workspace/completion-panels";
import {
  AcceptanceTestsView,
  BacklogView,
  RoadmapView,
  EvaluationView,
  HealthScoreWidget,
  NextActionsWidget,
  FeedbackButtons,
  ObservabilityView,
  PolicyView,
} from "@/components/workspace/delivery-panels";
import {
  ContextView,
  HypothesesView,
  DebateView,
  DebateRound1View,
  DebateRound2View,
  RequirementsView,
  GapsRisksView,
  StrategyView,
  ValidationView,
  ValidationCouncilView,
  MetadataView,
  ResearchView,
  CompetitorIntelView,
  FeatureRecsView,
  CostEstimateView,
  SprintPlanView,
  ArchSimulationView,
  ScenarioSimulationView,
  KnowledgeGraphView,
  DecisionJournalView,
  AIVotingView,
  DynamicCouncilView,
  Empty,
} from "@/components/workspace/stage-panels";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Brain,
  CheckSquare,
  DollarSign,
  FileStack,
  FlaskConical,
  GitCompare,
  GitGraph,
  Gavel,
  Lightbulb,
  ListChecks,
  MessagesSquare,
  Network,
  Server,
  Settings,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function Home() {
  const { stages, running, onboarding, fetchOnboarding, fetchProviders } =
    useWorkspace();
  const [view, setView] = useState<"workspace" | "dashboard">("workspace");

  useEffect(() => {
    void fetchOnboarding();
    void fetchProviders();
  }, [fetchOnboarding, fetchProviders]);

  const hasAnyOutput = Object.values(stages).some(
    (s) => s.status === "done" || s.status === "running",
  );

  const tabBadge = (stageKey: keyof typeof stages) => {
    const s = stages[stageKey];
    if (s.status === "running") return "·";
    if (s.status === "done") return "✓";
    if (s.status === "skipped") return "–";
    return "";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header view={view} setView={setView} />
      <OnboardingModal />
      <RegistryModal />

      {view === "dashboard" ? (
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-3 py-4 sm:px-5 lg:py-6">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              Executive Dashboard
            </h2>
            <p className="text-xs text-muted-foreground">
              Project intelligence across all projects — health, open items,
              decisions, provider usage, and traceability coverage.
            </p>
          </div>
          <DashboardView />
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-3 py-4 sm:px-5 lg:py-6">
          <div className="grid flex-1 gap-4 lg:grid-cols-[240px_360px_minmax(0,1fr)]">
            <aside className="order-2 rounded-xl border bg-card shadow-sm lg:order-1 lg:max-h-[calc(100vh-9rem)] lg:sticky lg:top-20">
              <ProjectSidebar />
            </aside>

            <aside className="order-1 flex flex-col gap-4 lg:order-2">
              <section className="rounded-xl border bg-card p-4 shadow-sm">
                <SourceInput />
                <div className="my-4 border-t" />
                <DocTypePicker />
                <div className="my-4 border-t" />
                <GenerateButton />
              </section>

              {(running || hasAnyOutput) && <PipelineProgress />}
            </aside>

            <section className="order-3 flex min-h-[60vh] flex-col rounded-xl border bg-card shadow-sm lg:min-h-[calc(100vh-9rem)]">
              {hasAnyOutput ? (
                <OutputTabs tabBadge={tabBadge} />
              ) : (
                <WelcomePane providerMode={onboarding?.providerMode} />
              )}
            </section>
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}

function Header({
  view,
  setView,
}: {
  view: "workspace" | "dashboard";
  setView: (v: "workspace" | "dashboard") => void;
}) {
  const { onboarding, setRegistryModalOpen, setOnboardingModalOpen } =
    useWorkspace();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-3 py-3 sm:px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight sm:text-base">
            CouncilForge
          </h1>
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            Provider-aware · Multi-agent council · Knowledge graph
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setView("workspace")}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                view === "workspace"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Workspace
            </button>
            <button
              type="button"
              onClick={() => setView("dashboard")}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition ${
                view === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              Dashboard
            </button>
          </div>
          {onboarding?.onboardingComplete && onboarding.providerMode && (
            <button
              type="button"
              onClick={() => setRegistryModalOpen(true)}
              className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              <Server className="h-3.5 w-3.5 text-primary" />
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                {onboarding.providerMode}
              </span>
            </button>
          )}
          {onboarding?.onboardingComplete && (
            <button
              type="button"
              onClick={() => setOnboardingModalOpen(true)}
              className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground md:inline-flex"
            >
              Settings
            </button>
          )}
          <NotificationsBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-start justify-between gap-2 px-3 py-3 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:px-5">
        <p>
          <span className="font-medium text-foreground">
            CouncilForge
          </span>{" "}
          · a transparent, provider-aware multi-agent requirements intelligence
          system
        </p>
        <p>
          Registry:{" "}
          <a
            href="https://github.com/cheahjs/free-llm-api-resources"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            free-llm-api-resources
          </a>
        </p>
      </div>
    </footer>
  );
}

function OutputTabs({
  tabBadge,
}: {
  tabBadge: (k: keyof ReturnType<typeof useWorkspace.getState>["stages"]) => string;
}) {
  const { stages, running, parentDocument, parentVersionId, providerLog, currentProjectId, continueProjectId, text } =
    useWorkspace();

  const doc =
    typeof stages.generate.data === "string" ? stages.generate.data : "";
  const hasParent = !!parentVersionId && !!parentDocument;

  return (
    <Tabs defaultValue="document" className="flex h-full min-h-0 flex-col">
      <TabsList className="m-2 grid w-auto grid-cols-4 self-start sm:grid-cols-6 lg:grid-cols-12">
        <TabsTrigger value="document" className="gap-1 text-xs">
          <FileStack className="h-3.5 w-3.5" />
          Doc
        </TabsTrigger>
        <TabsTrigger value="debate" className="gap-1 text-xs">
          <MessagesSquare className="h-3.5 w-3.5" />
          Council
          <Badge>{tabBadge("moderator")}</Badge>
        </TabsTrigger>
        <TabsTrigger value="requirements" className="gap-1 text-xs">
          <ListChecks className="h-3.5 w-3.5" />
          Reqs
          <Badge>{tabBadge("requirements")}</Badge>
        </TabsTrigger>
        <TabsTrigger value="gaps" className="gap-1 text-xs">
          <ShieldQuestion className="h-3.5 w-3.5" />
          Gaps
          <Badge>{tabBadge("gaps_risks")}</Badge>
        </TabsTrigger>
        <TabsTrigger value="intel" className="gap-1 text-xs">
          <Zap className="h-3.5 w-3.5" />
          Intel
          <Badge>{tabBadge("competitor_intel")}</Badge>
        </TabsTrigger>
        <TabsTrigger value="tests" className="gap-1 text-xs">
          <FlaskConical className="h-3.5 w-3.5" />
          Tests
          <Badge>{tabBadge("acceptance_tests")}</Badge>
        </TabsTrigger>
        <TabsTrigger value="delivery" className="gap-1 text-xs">
          <DollarSign className="h-3.5 w-3.5" />
          Delivery
          <Badge>{tabBadge("cost_estimate")}</Badge>
        </TabsTrigger>
        <TabsTrigger value="decisions" className="gap-1 text-xs">
          <Gavel className="h-3.5 w-3.5" />
          Decisions
          <Badge>{tabBadge("decision_journal")}</Badge>
        </TabsTrigger>
        <TabsTrigger value="validate" className="gap-1 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          Validate
          <Badge>{tabBadge("validation_council")}</Badge>
        </TabsTrigger>
        <TabsTrigger value="gov" className="gap-1 text-xs">
          <Settings className="h-3.5 w-3.5" />
          Govern
        </TabsTrigger>
        <TabsTrigger value="providers" className="gap-1 text-xs">
          <Server className="h-3.5 w-3.5" />
          Providers
          <Badge>{providerLog.length > 0 ? `${providerLog.length}` : ""}</Badge>
        </TabsTrigger>
        <TabsTrigger value="diff" className="gap-1 text-xs">
          <GitCompare className="h-3.5 w-3.5" />
          Diff
        </TabsTrigger>
      </TabsList>

      <TabsContent value="document" className="mt-0 min-h-0 flex-1 overflow-hidden">
        <DocumentViewer />
      </TabsContent>

      {/* Council tab with nested round selector */}
      <TabsContent
        value="debate"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <Tabs defaultValue="moderator">
          <TabsList className="mb-3 grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="moderator" className="text-xs">
              Moderator
              <Badge>{tabBadge("moderator")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="round1" className="text-xs">
              Round 1
              <Badge>{tabBadge("debate_round1")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="round2" className="text-xs">
              Round 2
              <Badge>{tabBadge("debate_round2")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="voting" className="text-xs">
              Voting
              <Badge>{tabBadge("ai_voting")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="council" className="text-xs">
              Dyn. Council
              <Badge>{tabBadge("dynamic_council")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="context" className="text-xs">
              Context
              <Badge>{tabBadge("understand")}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="moderator">
            {running && stages.moderator.status === "running" ? (
              <RunningNote label="Moderator synthesizing the debate…" />
            ) : (
              <DebateView data={stages.moderator.data} />
            )}
          </TabsContent>
          <TabsContent value="round1">
            {running && stages.debate_round1.status === "running" ? (
              <RunningNote label="Council roles proposing their positions…" />
            ) : (
              <DebateRound1View data={stages.debate_round1.data} />
            )}
          </TabsContent>
          <TabsContent value="round2">
            {running && stages.debate_round2.status === "running" ? (
              <RunningNote label="Roles responding to each other + revising…" />
            ) : (
              <DebateRound2View data={stages.debate_round2.data} />
            )}
          </TabsContent>
          <TabsContent value="voting">
            {running && stages.ai_voting.status === "running" ? (
              <RunningNote label="Council voting on key decisions…" />
            ) : (
              <AIVotingView data={stages.ai_voting.data} />
            )}
          </TabsContent>
          <TabsContent value="council">
            {running && stages.dynamic_council.status === "running" ? (
              <RunningNote label="Adapting council to project domain…" />
            ) : (
              <DynamicCouncilView data={stages.dynamic_council.data} />
            )}
          </TabsContent>
          <TabsContent value="context">
            {running && stages.understand.status === "running" ? (
              <RunningNote label="Understanding source + repo intelligence…" />
            ) : (
              <ContextView data={stages.understand.data} />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent
        value="requirements"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        {running && stages.requirements.status === "running" ? (
          <RunningNote label="Discovering & inferring requirements…" />
        ) : (
          <RequirementsView data={stages.requirements.data} />
        )}
      </TabsContent>

      <TabsContent
        value="gaps"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        {running && stages.gaps_risks.status === "running" ? (
          <RunningNote label="Detecting gaps & risks…" />
        ) : (
          <GapsRisksView data={stages.gaps_risks.data} />
        )}
      </TabsContent>

      {/* Intelligence tab: research + competitors + feature recs + scenarios + arch sim + knowledge graph */}
      <TabsContent
        value="intel"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <Tabs defaultValue="research">
          <TabsList className="mb-3 grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="research" className="text-xs">
              Research
              <Badge>{tabBadge("research")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="competitors" className="text-xs">
              Competitors
              <Badge>{tabBadge("competitor_intel")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs">
              Features
              <Badge>{tabBadge("feature_recs")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archsim" className="text-xs">
              Arch Sim
              <Badge>{tabBadge("arch_simulation")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs">
              Scenarios
              <Badge>{tabBadge("scenario_simulation")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="graph" className="text-xs">
              Knowledge Graph
              <Badge>{tabBadge("knowledge_graph")}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="research">
            {running && stages.research.status === "running" ? (
              <RunningNote label="Autonomous research agent gathering evidence…" />
            ) : (
              <ResearchView data={stages.research.data} />
            )}
          </TabsContent>
          <TabsContent value="competitors">
            {running && stages.competitor_intel.status === "running" ? (
              <RunningNote label="Analyzing competitors…" />
            ) : (
              <CompetitorIntelView data={stages.competitor_intel.data} />
            )}
          </TabsContent>
          <TabsContent value="features">
            {running && stages.feature_recs.status === "running" ? (
              <RunningNote label="Generating feature recommendations…" />
            ) : (
              <FeatureRecsView data={stages.feature_recs.data} />
            )}
          </TabsContent>
          <TabsContent value="archsim">
            {running && stages.arch_simulation.status === "running" ? (
              <RunningNote label="Simulating architecture failure paths…" />
            ) : (
              <ArchSimulationView data={stages.arch_simulation.data} />
            )}
          </TabsContent>
          <TabsContent value="scenarios">
            {running && stages.scenario_simulation.status === "running" ? (
              <RunningNote label="Simulating what-if scenarios…" />
            ) : (
              <ScenarioSimulationView data={stages.scenario_simulation.data} />
            )}
          </TabsContent>
          <TabsContent value="graph">
            {running && stages.knowledge_graph.status === "running" ? (
              <RunningNote label="Building the knowledge graph…" />
            ) : (
              <KnowledgeGraphView data={stages.knowledge_graph.data} />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>

      {/* Delivery tab: cost + sprint plan */}
      <TabsContent
        value="delivery"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <Tabs defaultValue="cost">
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value="cost" className="text-xs">
              Cost Estimate
              <Badge>{tabBadge("cost_estimate")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sprint" className="text-xs">
              Sprint Plan
              <Badge>{tabBadge("sprint_plan")}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cost">
            {running && stages.cost_estimate.status === "running" ? (
              <RunningNote label="Estimating effort and cost…" />
            ) : (
              <CostEstimateView data={stages.cost_estimate.data} />
            )}
          </TabsContent>
          <TabsContent value="sprint">
            {running && stages.sprint_plan.status === "running" ? (
              <RunningNote label="Planning sprint delivery…" />
            ) : (
              <SprintPlanView data={stages.sprint_plan.data} />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>

      {/* Decisions tab: decision journal + traceability */}
      <TabsContent
        value="decisions"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <Tabs defaultValue="journal">
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value="journal" className="text-xs">
              Decision Journal
              <Badge>{tabBadge("decision_journal")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="metadata" className="text-xs">
              Traceability & Confidence
              <Badge>{tabBadge("metadata")}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="journal">
            {running && stages.decision_journal.status === "running" ? (
              <RunningNote label="Logging decisions to the journal…" />
            ) : (
              <DecisionJournalView data={stages.decision_journal.data} />
            )}
          </TabsContent>
          <TabsContent value="metadata">
            {running && stages.metadata.status === "running" ? (
              <RunningNote label="Building traceability + metadata…" />
            ) : (
              <MetadataView data={stages.metadata.data} />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent
        value="validate"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <Tabs defaultValue="council">
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value="council" className="text-xs">
              Validation Council
              <Badge>{tabBadge("validation_council")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="gates" className="text-xs">
              Quality Gates
              <Badge>{tabBadge("validate")}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="council">
            {running && stages.validation_council.status === "running" ? (
              <RunningNote label="Validation council reviewing the document…" />
            ) : (
              <ValidationCouncilView data={stages.validation_council.data} />
            )}
          </TabsContent>
          <TabsContent value="gates">
            {running && stages.validate.status === "running" ? (
              <RunningNote label="Running quality gates + self-critique…" />
            ) : (
              <ValidationView data={stages.validate.data} />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>

      {/* Tests tab: acceptance tests + backlog + roadmap + evaluation */}
      <TabsContent
        value="tests"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <Tabs defaultValue="acceptance">
          <TabsList className="mb-3 grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="acceptance" className="text-xs">
              Acceptance Tests
              <Badge>{tabBadge("acceptance_tests")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="backlog" className="text-xs">
              Backlog
              <Badge>{tabBadge("backlog")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="text-xs">
              Roadmap
              <Badge>{tabBadge("roadmap")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="text-xs">
              Evaluation
              <Badge>{tabBadge("evaluation")}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="acceptance">
            {currentProjectId ? (
              <AcceptanceTestsView projectId={currentProjectId} />
            ) : (
              <Empty label="Acceptance tests will appear here after the tests stage runs." />
            )}
          </TabsContent>
          <TabsContent value="backlog">
            {currentProjectId ? (
              <BacklogView projectId={currentProjectId} />
            ) : (
              <Empty label="Backlog items will appear here after the backlog stage runs." />
            )}
          </TabsContent>
          <TabsContent value="roadmap">
            {currentProjectId ? (
              <RoadmapView projectId={currentProjectId} />
            ) : (
              <Empty label="Roadmap phases will appear here after the roadmap stage runs." />
            )}
          </TabsContent>
          <TabsContent value="evaluation">
            {running && stages.evaluation.status === "running" ? (
              <RunningNote label="Evaluating document against rubric…" />
            ) : (
              <EvaluationView data={stages.evaluation.data} />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>

      {/* Governance tab: health + next actions + observability + policies */}
      <TabsContent
        value="gov"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <Tabs defaultValue="health">
          <TabsList className="mb-3 grid w-full grid-cols-3 lg:grid-cols-8">
            <TabsTrigger value="health" className="text-xs">Health</TabsTrigger>
            <TabsTrigger value="complete" className="text-xs">Complete</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            <TabsTrigger value="orch" className="text-xs">Orchestr.</TabsTrigger>
            <TabsTrigger value="obs" className="text-xs">Diagn.</TabsTrigger>
            <TabsTrigger value="providers" className="text-xs">Providers</TabsTrigger>
            <TabsTrigger value="impact" className="text-xs">Impact</TabsTrigger>
            <TabsTrigger value="policies" className="text-xs">Policies</TabsTrigger>
          </TabsList>
          <TabsContent value="health">
            {currentProjectId ? (
              <HealthScoreWidget projectId={currentProjectId} />
            ) : (
              <Empty label="Generate a document to see project health scores." />
            )}
          </TabsContent>
          <TabsContent value="complete">
            {currentProjectId ? (
              <CompletenessWidget projectId={currentProjectId} />
            ) : (
              <Empty label="Generate a document to check project completeness." />
            )}
          </TabsContent>
          <TabsContent value="actions">
            {currentProjectId ? (
              <NextActionsWidget projectId={currentProjectId} />
            ) : (
              <Empty label="Next-best-action recommendations will appear here." />
            )}
          </TabsContent>
          <TabsContent value="orch">
            <OrchestratorPanel
              isContinuation={!!continueProjectId}
              inputLength={text.length}
              fullRun={false}
            />
          </TabsContent>
          <TabsContent value="obs">
            {currentProjectId ? (
              <ObservabilityView projectId={currentProjectId} />
            ) : (
              <Empty label="Observability events will appear here after generation." />
            )}
          </TabsContent>
          <TabsContent value="providers">
            <ProviderAnalyticsView />
          </TabsContent>
          <TabsContent value="impact">
            <ImpactPropagationView />
          </TabsContent>
          <TabsContent value="policies">
            {currentProjectId ? (
              <PolicyView projectId={currentProjectId} />
            ) : (
              <Empty label="Policies will appear here once a project is created." />
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent
        value="providers"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <ProviderLogView />
      </TabsContent>

      <TabsContent
        value="diff"
        className="mt-0 min-h-0 flex-1 overflow-y-auto scroll-thin p-4"
      >
        <DiffView oldDoc={parentDocument} newDoc={doc} hasParent={hasParent} />
      </TabsContent>
    </Tabs>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <span className="ml-0.5 text-[10px] text-primary">{children}</span>;
}

function RunningNote({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function WelcomePane({
  providerMode,
}: {
  providerMode?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border bg-accent/50 px-3 py-1 text-[11px] font-medium text-accent-foreground">
            <MessagesSquare className="h-3 w-3" />
            A transparent AI Council in your browser
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Eight expert roles{" "}
            <span className="text-primary">debate, revise, and converge</span>{" "}
            into decision-ready documents
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The council inspects your source, runs a visible two-round debate
            with a moderator, infers requirements, detects gaps and risks, picks
            the right document type, drafts it, validates it with a second
            council, and remembers everything for the next version.
          </p>

          {providerMode && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-accent/40 px-3 py-1.5 text-xs">
              <Server className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Provider mode:</span>
              <span className="font-bold text-primary">{providerMode}</span>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: BookOpen,
                title: "1 · Understand",
                desc: "Deep repo intelligence: architecture, bounded contexts, data model, security, CI/CD, user journeys.",
              },
              {
                icon: Lightbulb,
                title: "2 · Hypotheses",
                desc: "Testable beliefs with evidence, validation approach, and impact-if-wrong.",
              },
              {
                icon: MessagesSquare,
                title: "3 · Council debate",
                desc: "Round 1: roles propose. Round 2: they respond + revise. Moderator synthesizes consensus.",
              },
              {
                icon: ListChecks,
                title: "4 · Requirements",
                desc: "Inference engine: login → password policy, MFA, sessions. Confirmed vs inferred, always labeled.",
              },
              {
                icon: ShieldQuestion,
                title: "5 · Gaps & Risks",
                desc: "10 gap categories + 6 risk categories, with severity, likelihood, impact, mitigation, owner.",
              },
              {
                icon: Target,
                title: "6 · Strategy + Generate",
                desc: "Picks PRD / BRD / FRD / SOW / Tech Design / Audit / Roadmap — then drafts from consensus.",
              },
              {
                icon: ShieldCheck,
                title: "7 · Validate + Revise",
                desc: "Quality gates + self-critique, then a validation council of 5 reviewers approves or flags.",
              },
              {
                icon: Server,
                title: "8 · Provider-aware",
                desc: "Each stage routes to the best provider (free tier, your keys, or built-in fallback). Full routing log visible.",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="rounded-lg border bg-card p-3.5 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
