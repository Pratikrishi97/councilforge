# Validator — Quality Score

> Rules for computing the overall `qualityScore` (0-100) and the
> `needsRevision` decision in `workflows/validate.md`. Aggregates the
> other nine gates plus additional heuristics into a single number.

## Gate definition
- **Gate name:** `quality-score` (also produces the aggregate
  `qualityScore` field)
- **Statuses:** `pass` / `warn` / `fail`
- **Stage:** Validate (Stage 8)

## The ten quality gates
1. `completeness` — see `validators/completeness.md`
2. `consistency` — see `validators/consistency.md`
3. `clarity` — concrete language, minimal jargon, no vague statements.
4. `testability` — every requirement has testable acceptance criteria.
5. `feasibility` — requirements are achievable with stated constraints.
6. `ownership` — every action item, risk, and decision has an owner.
7. `risk_coverage` — risks from Stage 5 are addressed in the document.
8. `scope_boundaries` — non-goals are explicit; scope is bounded.
9. `traceability` — business objective → requirement → feature → AC →
   test → release item → owner.
10. `document_correctness` — output follows the template structure and
    Markdown rules.

Each gate returns `pass` (10 pts), `warn` (5 pts), or `fail` (0 pts).
Sum across 10 gates = 0-100.

## Scoring algorithm
```
function computeQualityScore(gateResults):
  score = 0
  for gate in gateResults:
    if gate.status == "pass": score += 10
    if gate.status == "warn": score += 5
    if gate.status == "fail": score += 0
  return score
```

## Score bands
| Score  | Band            | Interpretation                                              |
|--------|-----------------|------------------------------------------------------------|
| 90-100 | Excellent       | Ship as-is.                                                |
| 80-89  | Good            | Ship with minor notes. Address warnings in next iteration.|
| 70-79  | Acceptable      | Ship with documented weaknesses. Plan a follow-up revision.|
| 60-69  | Marginal        | Do not ship without a revision pass.                       |
| 0-59   | Not ready       | Major rework required.                                     |

## `needsRevision` decision
The pipeline triggers **at most one** revision pass. The decision logic:

```
function decideRevision(gateResults, revisionCount, contradictionsFound):
  if revisionCount >= 1:
    return { needsRevision: false, reason: "Max revisions reached" }

  failCount = gateResults.filter(g => g.status == "fail").length
  warnCount = gateResults.filter(g => g.status == "warn").length

  if failCount > 0 or contradictionsFound.length > 0:
    return {
      needsRevision: true,
      revisionFocus: {
        sections: identifyWeakSections(gateResults),
        focus: summarizeFailures(gateResults, contradictionsFound)
      }
    }

  if warnCount >= 4:
    return {
      needsRevision: true,
      revisionFocus: {
        sections: identifyWarnSections(gateResults),
        focus: summarizeWarnings(gateResults)
      }
    }

  return { needsRevision: false, revisionFocus: null }
```

Rules:
- `needsRevision: true` requires a non-null `revisionFocus`.
- A `fail` on `completeness` or `consistency` always triggers revision.
- A `fail` on any other gate triggers revision if at least one other gate
  also fails or warns.
- After 1 revision, remaining weaknesses are reported as open questions
  instead of triggering another revision. The pipeline never loops.

## Gate-specific rules (summary)

### `clarity`
- **Pass:** concrete language throughout; minimal jargon; every vague
  term defined on first use.
- **Warn:** occasional vague statements ("improve the experience"); jargon
  used without definition.
- **Fail:** pervasive vagueness; marketing language; multiple undefined
  acronyms.

### `testability`
- **Pass:** every `must`-priority requirement has Given/When/Then ACs.
- **Warn:** some `must` requirements lack ACs; some ACs aren't
  Given/When/Then.
- **Fail:** no acceptance criteria, or ACs that aren't observable
  ("the system should work well").

### `feasibility`
- **Pass:** requirements are achievable with stated constraints (team,
  time, tech); no impossible asks.
- **Warn:** one or two requirements are stretch goals without explicit
  acknowledgement.
- **Fail:** requirements that are clearly infeasible (e.g. "100% uptime"
  without acknowledging the impossibility).

### `ownership`
- **Pass:** every action item, risk, decision, and deliverable has a
  named owner (role or person).
- **Warn:** 1-2 items lack owners.
- **Fail:** pervasive missing ownership (>30% of items).

### `risk_coverage`
- **Pass:** every `high`-severity risk from Stage 5 is addressed in the
  document's Risks section with a mitigation.
- **Warn:** high risks are mentioned but mitigations are weak or absent.
- **Fail:** high risks are missing from the document entirely.

### `scope_boundaries`
- **Pass:** non-goals are explicit and substantive; scope is bounded.
- **Warn:** non-goals are present but thin.
- **Fail:** no non-goals section, or scope is unbounded ("the system will
  do everything the user needs").

### `traceability`
- **Pass:** traceability table links business objective → requirement →
  feature → AC → test → release item → owner for the top 6-10 items.
- **Warn:** traceability exists but is incomplete (< 6 rows, or missing
  columns).
- **Fail:** no traceability, or traceability with broken links.

### `document_correctness`
- **Pass:** document follows the template's section order; Markdown is
  valid; no broken tables or malformed Mermaid.
- **Warn:** minor Markdown issues (e.g. inconsistent heading levels).
- **Fail:** template structure ignored; broken Markdown; Mermaid that
  won't render.

## Validation Council overlay
After the quality gates run, the **Validation Council** (five reviewers:
QA Lead, Security Reviewer, Engineering Lead, UX Reviewer, Delivery
Manager) independently evaluates the document. Their consensus produces:

- `overallVerdict`: `approved` / `approved-with-notes` /
  `changes-requested`
- `criticalIssues`: high-severity issues that must be fixed
- `recommendations`: medium/low-severity improvements
- `deliveryReady`: boolean

`deliveryReady` is `true` **only** when:
- `overallVerdict` is `approved` or `approved-with-notes`, AND
- `qualityScore >= 70`, AND
- No high-severity issues from any reviewer, AND
- No `fail` on `completeness` or `consistency` gates.

## Anti-patterns
- **Sycophantic scoring:** model returns 100 with all `pass`. Mitigation:
  require at least one `warn` or one entry in `weaknesses`.
- **Score inconsistent with gates:** 95 with two `fail`s. Mitigation:
  recompute the score from the gate statuses.
- **Endless revision:** model keeps finding new issues. Mitigation: hard
  cap `revisionCount` at 1.
- **Council rubber-stamp:** every reviewer returns `approve` with no
  issues. Mitigation: require each reviewer to find at least one issue or
  explicitly state "no issues found in my domain".
- **deliveryReady despite high-severity issue:** consensus overrides the
  rule. Mitigation: post-process to enforce the rule.

## Notes
- The quality score is a **heuristic**, not a guarantee. A document with
  score 95 can still have a critical defect the gates don't catch.
- The score is most useful for **trend tracking** across versions of the
  same document, not as an absolute quality measure.
- Host IDEs should display the score alongside the gate breakdown, not
  as a single number — the breakdown is more actionable.
