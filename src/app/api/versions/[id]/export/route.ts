import { db } from "@/lib/db";
import { audit, AuditActions } from "@/lib/audit";
import { getDocType } from "@/lib/doc-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeParse<T = unknown>(v: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

/**
 * Export a version's document + structured data in multiple formats.
 * Supported: markdown (default), json, csv (traceability), issues (Jira/Linear/GitHub).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "markdown";

  const v = await db.docVersion.findUnique({ where: { id } });
  if (!v) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cfg = getDocType(v.docType);
  void audit({
    action: AuditActions.EXPORT,
    projectId: v.projectId,
    versionId: v.id,
    details: { format, docType: v.docType, versionNumber: v.versionNumber },
  });

  if (format === "markdown") {
    const slug = cfg.short.toLowerCase().replace(/\s+/g, "-");
    return new Response(v.document ?? "", {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-v${v.versionNumber}.md"`,
      },
    });
  }

  if (format === "json") {
    const data = {
      version: {
        id: v.id,
        projectId: v.projectId,
        versionNumber: v.versionNumber,
        docType: v.docType,
        docTypeReason: v.docTypeReason,
        status: v.status,
        revised: v.revised,
        qualityScore: v.qualityScore,
        createdAt: v.createdAt,
        document: v.document,
        contextMap: safeParse(v.contextMap),
        requirements: safeParse(v.requirements),
        gaps: safeParse(v.gaps),
        risks: safeParse(v.risks),
        strategy: safeParse(v.strategy),
        traceability: safeParse(v.traceability),
        assumptions: safeParse(v.assumptions),
        confidence: safeParse(v.confidence),
        openQuestions: safeParse(v.openQuestions),
        nextActions: safeParse(v.nextActions),
        qualityGates: safeParse(v.qualityGates),
        research: safeParse(v.research),
        competitorIntel: safeParse(v.competitorIntel),
        featureRecs: safeParse(v.featureRecs),
        costEstimate: safeParse(v.costEstimate),
        sprintPlan: safeParse(v.sprintPlan),
        archSimulation: safeParse(v.archSimulation),
        knowledgeGraph: safeParse(v.knowledgeGraph),
        decisionJournal: safeParse(v.decisionJournal),
        scenarioSimulation: safeParse(v.scenarioSimulation),
        aiVoting: safeParse(v.aiVoting),
        dynamicCouncil: safeParse(v.dynamicCouncil),
        providerLog: safeParse(v.providerLog),
        validationCouncil: safeParse(v.validationCouncil),
        generationManifest: safeParse(v.generationManifest),
        changeSummary: v.changeSummary,
        changedSections: safeParse(v.changedSections),
      },
    };
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${cfg.short.toLowerCase()}-v${v.versionNumber}.json"`,
      },
    });
  }

  if (format === "csv") {
    // Export traceability matrix as CSV
    const traceability = safeParse<{
      businessObjective?: string;
      requirement?: string;
      feature?: string;
      acceptanceCriteria?: string;
      testScenario?: string;
      releaseItem?: string;
      owner?: string;
    }[]>(v.traceability);

    const headers = [
      "Business Objective",
      "Requirement",
      "Feature",
      "Acceptance Criteria",
      "Test Scenario",
      "Release Item",
      "Owner",
    ];

    const escapeCsv = (s: string) => {
      if (!s) return "";
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = (traceability ?? []).map((t) =>
      [
        t.businessObjective ?? "",
        t.requirement ?? "",
        t.feature ?? "",
        t.acceptanceCriteria ?? "",
        t.testScenario ?? "",
        t.releaseItem ?? "",
        t.owner ?? "",
      ]
        .map(escapeCsv)
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="traceability-v${v.versionNumber}.csv"`,
      },
    });
  }

  if (format === "issues") {
    // Export requirements as issue-tracker-compatible JSON (Jira/Linear/GitHub)
    const requirements = safeParse<{
      functionalNeeds?: {
        id?: string;
        statement?: string;
        capability?: string;
        priority?: string;
        inferred?: boolean;
      }[];
    }>(v.requirements);

    const issues = (requirements?.functionalNeeds ?? []).map((r) => ({
      title: r.statement ?? r.id ?? "Untitled requirement",
      description: `${r.statement ?? ""}\n\n**Capability:** ${r.capability ?? "N/A"}\n**Priority:** ${r.priority ?? "medium"}\n**Inferred:** ${r.inferred ? "yes" : "no"}`,
      labels: [
        `priority:${r.priority ?? "medium"}`,
        r.capability ?? "general",
        r.inferred ? "inferred" : "confirmed",
      ].filter(Boolean),
      // Jira-style
      issuetype: { name: r.priority === "must" ? "Story" : "Task" },
      // Linear-style
      team: "engineering",
      // GitHub-style
      assignee: null,
    }));

    return new Response(
      JSON.stringify(
        {
          meta: {
            source: "CouncilForge",
            versionId: v.id,
            versionNumber: v.versionNumber,
            docType: v.docType,
            exportedAt: new Date().toISOString(),
          },
          issues,
        },
        null,
        2,
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="issues-v${v.versionNumber}.json"`,
        },
      },
    );
  }

  return new Response(
    JSON.stringify({ error: `Unknown format: ${format}` }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}
