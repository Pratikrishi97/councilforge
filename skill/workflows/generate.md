# Workflow — Generate

## Stage
**Stage 7 of 10** — Draft the final document.

## Purpose
Produce a complete, decision-ready Markdown document following the
canonical structure for the chosen document type. This is the artifact
the user reads, signs off on, and hands to engineering.

## Input requirements
- **Document type** (from `workflows/strategy.md`)
- **Context map** (from `workflows/understand.md`)
- **Debate + consensus** (from `workflows/debate.md`)
- **Requirements** (from `workflows/requirements.md`)
- **Gaps & risks** (from `workflows/gaps-risks.md`)
- **Strategy** (from `workflows/strategy.md`)
- **Audience** (optional; default "mixed business + technical stakeholders")
- **Revision focus** (optional; from `workflows/validate.md` if revising)
- **Prior document** (optional; for version upgrades)
- **Template** (load `templates/<doc-type>.md` for the canonical section
  order)

## Output format
A single Markdown document. No JSON, no commentary, no preamble. Just the
document.

## Output rules (non-negotiable)
1. **Markdown only** — no HTML, JSX, or vendor DSL.
2. `#` for the title, `##` for major sections (matching the template's
   section list), `###` for sub-sections, `####` sparingly.
3. **Tables** for risks, assumptions, traceability, comparison,
   responsibilities, decisions, timeline.
4. **Bullet lists** for requirements, risks, open questions, action items.
5. **Fenced code blocks** for JSON schemas, sample config, pseudo-APIs.
6. **At least one Mermaid diagram** (` ```mermaid `) — flowchart, sequence,
   ER, or state — where it adds clarity.
7. **Inline labels**: `Confirmed`, `Inferred`, `Assumption`, `Risk`, `Gap`,
   `Open Question`, `Recommendation`.
8. **Acceptance criteria** in Given/When/Then where applicable.
9. **Tie every requirement** back to a business or user need.
10. **Do NOT** include assumptions/confidence/open-questions sections in the
    document body — those are produced separately in the metadata stage.
11. The document must be **complete enough to act on**, not a stub.
12. If project memory exists, **preserve established terminology** and
    decisions.
13. Mark inferred items with `(inferred)` inline; assumptions with
    `(assumption)` inline.

## Provider routing recommendation
- **Latency profile**: medium-high (long-form generation).
- **Context window**: large (all upstream JSON + the document itself in
  output).
- **Recommended provider class**: highest-quality model available — this
  is the stage where model quality matters most. If the host has access to
  a frontier model (Claude Sonnet/Opus, GPT-5, Gemini 2.5 Pro), use it
  here even if earlier stages used cheaper providers.
- **Fallback**: large-context free-tier providers (Google AI Studio 1M,
  Mistral Codestral 256K, Cohere 256K) if no frontier model is available.
- **Avoid**: tiny-context providers — the upstream context won't fit and
  the output will be truncated.

## Validation rules
- Every section from the template's `structure` list must appear as an `##`
  heading, in order.
- At least one Mermaid diagram must be present.
- At least one table must be present (risks, traceability, etc.).
- Inline labels must appear at least once each where relevant
  (`Confirmed`, `Inferred`, `Assumption`).
- No section may be a stub — every section must have substantive content.
- No invented metrics, stakeholders, timelines, or business rules.
- If `revisionFocus` was provided, the revised document must address every
  item in it.

## Failure modes
- **Stub sections** — "TBD" or one-sentence sections. Mitigation: enforce
  minimum content per section; re-run with revision focus on stubs.
- **No Mermaid diagram** — model skipped it. Mitigation: post-process to
  detect ` ```mermaid ` and re-run with explicit constraint.
- **Generic boilerplate** — "this section describes the risks". Mitigation:
  require concrete content referencing the gaps/risks JSON.
- **Labels omitted** — model writes prose without `Confirmed`/`Inferred`/
  `Assumption` markers. Mitigation: post-process to count label usage and
  re-run if zero.
- **Truncated output** — model hit output token limit. Mitigation: split
  the document generation into per-section calls and concatenate.
- **Template structure ignored** — model invents its own sections.
  Mitigation: enforce section-heading check against the template.
