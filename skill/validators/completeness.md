# Validator — Completeness

> Rules for the `completeness` quality gate in `workflows/validate.md`.
> Verifies that every required section, field, and artifact is present and
> substantive.

## Gate definition
- **Gate name:** `completeness`
- **Statuses:** `pass` / `warn` / `fail`
- **Stage:** Validate (Stage 8)

## Pass criteria
The gate returns `pass` when **all** of the following hold:

1. **Template coverage.** Every section in the chosen document type's
   template (`templates/<doc-type>.md`) appears as an `##` heading in the
   generated document, in the correct order.
2. **Section substance.** Every section has substantive content — not a
   stub, not "TBD", not a single sentence. Minimum: 2 sentences or 1
   table or 1 list with ≥ 2 items per section.
3. **Required artifacts present:**
   - At least one Mermaid diagram (``` ```mermaid ``` fence).
   - At least one table (Markdown table syntax).
   - At least one bulleted list.
   - At least one fenced code block (only if the doc type requires it:
     TECH_DESIGN, FRD with API schemas).
4. **Inline labels present.** At least one of each where relevant:
   `Confirmed`, `Inferred`, `Assumption`. (For docs with no inferred
   content, `Inferred` may be absent — but the gate warns.)
5. **Acceptance criteria present** (for PRD, FRD, SOW). Each must-have
   functional requirement has at least one Given/When/Then acceptance
   criterion.
6. **Traceability present** (for PRD, TECH_DESIGN, SOW). At least one
   traceability row linking business objective → requirement → feature →
   acceptance criteria → test scenario → release item → owner.
7. **Open questions present** (for all doc types). At least one open
   question, or an explicit statement that none remain.

## Warn criteria
The gate returns `warn` when any of the following hold (but no `fail`
criteria are triggered):

1. A section is present but thinner than the substance threshold (e.g.
   one sentence where two are expected).
2. Mermaid diagram is present but trivial (e.g. a flowchart with one
   node).
3. Inline labels are present but unbalanced (e.g. 20 `Confirmed`, 0
   `Inferred`, 0 `Assumption` in a doc that should have all three).
4. Acceptance criteria exist but not for every must-priority requirement.
5. Traceability exists but has < 3 rows.

## Fail criteria
The gate returns `fail` when **any** of the following hold:

1. A required template section is missing entirely.
2. A section is a stub (`TBD`, `TODO`, `coming soon`, or a single short
   sentence with no substantive content).
3. No Mermaid diagram is present.
4. No table is present.
5. No acceptance criteria are present (for PRD, FRD, SOW).
6. No traceability is present (for PRD, TECH_DESIGN, SOW).
7. Required fields from the upstream JSON are dropped (e.g. the PRD's
   Risks section doesn't reference any risk from the gaps/risks stage).

## Validation algorithm
```
function checkCompleteness(document, docType, requirements, gapsRisks):
  template = loadTemplate(docType)
  sections = extractH2Headings(document)

  # 1. Template coverage
  missingSections = template.structure.filter(s => !sections.includes(s))
  if missingSections.length > 0:
    return fail("Missing sections: " + missingSections.join(", "))

  # 2. Section substance
  stubSections = sections.filter(s => sectionWordCount(document, s) < 30)
  if stubSections.length > 0:
    return fail("Stub sections: " + stubSections.join(", "))

  # 3. Required artifacts
  if not containsMermaid(document): return fail("No Mermaid diagram")
  if not containsTable(document):    return fail("No table")

  # 4. Inline labels
  labels = countLabels(document)
  if labels.confirmed == 0: return warn("No 'Confirmed' labels")
  if labels.inferred == 0 and docType != "AUDIT": return warn("No 'Inferred' labels")
  if labels.assumption == 0: return warn("No 'Assumption' labels")

  # 5. Acceptance criteria (PRD, FRD, SOW only)
  if docType in [PRD, FRD, SOW]:
    acCount = countAcceptanceCriteria(document)
    if acCount == 0: return fail("No acceptance criteria")
    mustCount = requirements.functionalNeeds.filter(r => r.priority == "must").length
    if acCount < mustCount: return warn("AC count < must-priority requirements")

  # 6. Traceability (PRD, TECH_DESIGN, SOW)
  if docType in [PRD, TECH_DESIGN, SOW]:
    traceRows = countTraceabilityRows(document)
    if traceRows == 0: return fail("No traceability table")
    if traceRows < 3: return warn("Traceability table too short")

  return pass()
```

## Notes
- "Substantive content" is intentionally fuzzy. The 30-word heuristic is a
  floor, not a ceiling — a section with 30 words of pure filler still
  fails the `clarity` gate.
- The completeness gate runs **before** the consistency gate. A document
  can be complete but inconsistent.
- This gate is **mechanical** — it can be checked by a parser without an
  LLM. Host IDEs are encouraged to implement it as a static check rather
  than a model call to save cost and improve reliability.
