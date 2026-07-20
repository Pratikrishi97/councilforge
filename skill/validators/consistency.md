# Validator — Consistency

> Rules for the `consistency` quality gate in `workflows/validate.md`.
> Verifies that the document is internally consistent and consistent with
> the upstream pipeline output.

## Gate definition
- **Gate name:** `consistency`
- **Statuses:** `pass` / `warn` / `fail`
- **Stage:** Validate (Stage 8)

## Pass criteria
The gate returns `pass` when **all** of the following hold:

1. **Terminology stable.** The same concept is referred to by the same
   term throughout. No synonyms oscillating (e.g. "user" vs "customer"
   vs "account holder" used interchangeably without explicit definition).
2. **Numbers consistent.** Any metric, threshold, or count cited in one
   section matches the same metric cited elsewhere. (e.g. if §4 Goals
   says "reduce time-to-first-value to under 3 minutes" and §9 Success
   metrics says "target: 2 minutes", that's a contradiction.)
3. **Roles consistent.** Stakeholder names and role titles match the
   personas/stakeholders sections. No new stakeholders appear in §11
   Dependencies who weren't introduced in §6.
4. **Requirements traceable.** Every requirement ID cited in the
   document exists in the upstream `requirements.functionalNeeds` or
   `requirements.nonFunctionalNeeds` JSON. No phantom IDs.
5. **Risks acknowledged.** Every `high`-severity risk from the upstream
   `gapsRisks.risks` JSON is referenced in the document's Risks section.
6. **Acceptance criteria linked.** Every acceptance criterion in the
   document references a valid `requirementId` from the upstream
   requirements JSON.
7. **Decisions consistent with consensus.** Any decision stated in the
   document matches the moderator's `consensus.recommendedApproach` and
   `consensus.keyDecisionsNeeded`. If the document contradicts the
   council, the contradiction must be explicitly flagged as an
   `Open Question`.
8. **No internal contradictions.** No two sections make claims that
   cannot both be true.

## Warn criteria
The gate returns `warn` when any of the following hold (but no `fail`
criteria are triggered):

1. Terminology drifts but is defined (e.g. "user (hereafter 'customer')").
2. A metric is restated with a slight variation that doesn't contradict
   but could confuse (e.g. "under 3 minutes" vs "≤ 3 minutes").
3. A risk from the upstream JSON is mentioned but not in the Risks
   section (e.g. referenced in Open Questions instead).
4. A new stakeholder appears in Dependencies but is plausibly the same as
   one in Stakeholders under a different name.
5. An acceptance criterion references a requirement ID that exists but
   the AC doesn't actually test what the requirement says.

## Fail criteria
The gate returns `fail` when **any** of the following hold:

1. A direct internal contradiction (e.g. "non-goals: support offline
   mode" in §5 and "users can work offline" in §8).
2. A requirement ID cited in the document does not exist in the upstream
   `requirements` JSON.
3. A `high`-severity upstream risk is not mentioned anywhere in the
   document.
4. A decision in the document contradicts the moderator consensus
   without being flagged as an `Open Question`.
5. Acceptance criteria reference a `requirementId` that doesn't exist.
6. The personas section says "primary persona: enterprise admin" but
   every user journey describes a consumer end-user.

## Validation algorithm
```
function checkConsistency(document, docType, requirements, gapsRisks, debate):
  # 1. Terminology stability (LLM-assisted)
  terms = extractDefinedTerms(document)
  drift = detectTerminologyDrift(document, terms)
  if drift.contradictions > 0: return fail("Terminology contradiction: " + drift.details)

  # 2. Numbers consistent
  metrics = extractMetrics(document)
  for m in metrics:
    if m.citedMultipleTimes and m.values are not all equal:
      return fail("Metric contradiction: " + m.name)

  # 3. Roles consistent
  docStakeholders = extractStakeholders(document)
  upstreamStakeholders = requirements.permissionsAndRoles + debate.stakeholders
  orphans = docStakeholders.filter(s => !upstreamStakeholders.includes(s))
  if orphans.length > 2: return warn("Undocumented stakeholders: " + orphans)

  # 4. Requirements traceable
  citedIds = extractRequirementIds(document)
  validIds = requirements.functionalNeeds.map(r => r.id) +
             requirements.nonFunctionalNeeds.map(r => r.id)
  phantom = citedIds.filter(id => !validIds.includes(id))
  if phantom.length > 0: return fail("Phantom requirement IDs: " + phantom)

  # 5. Risks acknowledged
  highRisks = gapsRisks.risks.filter(r => r.severity == "high")
  for r in highRisks:
    if not mentionedInDocument(document, r): return fail("Unacknowledged high risk: " + r.id)

  # 6. AC linked
  acRows = extractAcceptanceCriteria(document)
  for ac in acRows:
    if ac.requirementId and !validIds.includes(ac.requirementId):
      return fail("AC references invalid requirementId: " + ac.requirementId)

  # 7. Decisions consistent with consensus
  docDecisions = extractDecisions(document)
  for d in docDecisions:
    if contradictsConsensus(d, debate.moderator.consensus):
      if not flaggedAsOpenQuestion(document, d):
        return fail("Decision contradicts council consensus: " + d)

  # 8. Internal contradictions (LLM-assisted)
  contradictions = detectInternalContradictions(document)
  if contradictions.length > 0: return fail("Internal contradictions: " + contradictions)

  return pass()
```

## Notes
- This gate is **partially LLM-assisted**. Steps 1, 7, and 8 require a
  model call; the rest are mechanical.
- The consistency gate runs **after** the completeness gate. A document
  can be complete but inconsistent.
- Contradictions are the most damaging document defect — they erode
  reader trust faster than any other failure. The `fail` bar here is
  deliberately strict.
- The `contradictsConsensus` check is the council's voice in validation:
  if the document drifts from what the council agreed on, the gate
  catches it.
