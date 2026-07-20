# Workflow — Debate

## Stage
**Stage 3 of 10** — Council debate. The core differentiator of this skill.

## Purpose
Force **adversarial cross-functional reasoning** before any document is
written. Eight expert roles propose independently, respond to each other,
and a moderator synthesizes consensus. Single-prompt generation produces
generic output; the council produces output that has already survived the
cross-functional review it would normally get in week three.

## Sub-stages
| Sub-stage | What happens                                            |
|-----------|--------------------------------------------------------|
| 3a Round 1 | Each role proposes independently (parallel).          |
| 3b Round 2 | Each role sees Round 1, responds, revises if persuaded.|
| 3c Synthesis | Moderator merges into consensus, surfaces conflicts. |

## Input requirements
- **Context map** (from `workflows/understand.md`)
- **Hypotheses** (optional, from a hypotheses stage)
- **Role prompts**: load `roles/<role>.md` as the system prompt for each
  of the eight debate roles
- **Moderator prompt**: load `roles/moderator.md` for stage 3c

The eight debate roles are: Product Manager, Business Analyst, Solutions
Architect, Engineering Lead, QA Lead, Security Reviewer, UX Reviewer,
Delivery Manager. The Compliance Reviewer is added when the domain is
regulated (see `roles/compliance-reviewer.md`).

## Output format

### Round 1 (per role, parallel)
```json
{
  "<roleCamelCase>": {
    "proposal": "1-2 sentence thesis",
    "topPriorities": ["2-4 items"],
    "risks": ["2-4 items"],
    "missingInfo": ["2-4 items"],
    "assumptionsChallenged": ["2-4 items"]
  }
}
```

### Round 2 (per role, sees Round 1)
```json
{
  "<roleCamelCase>": {
    "responses": [
      { "to": "roleName", "point": "string", "agree": false, "reason": "string" }
    ],
    "revised": true,
    "revisedStance": "1 sentence if revised, else empty",
    "standsBy": ["1-3 items"],
    "withdraws": ["1-3 items"]
  }
}
```

### Moderator synthesis
See `roles/moderator.md` for the full schema. Headline fields:
- `consensus` — top priorities, top risks, top gaps, key decisions needed,
  recommended approach
- `conflicts` — description, roles, resolution, resolved, compromise
- `unresolvedDisagreements` — description, objecting role, objection,
  why unresolved, final decision
- `needsAnotherRound` — boolean (usually false)
- `rationale` — how the council converged
- `candidateDirections` + `chosenDirection` + `chosenWhy`

## Provider routing recommendation
- **Latency profile**: low per role (each Round 1 call is small).
- **Context window**: medium (role prompt + context map + hypotheses).
- **Recommended provider class**: low-latency providers — Groq, Cerebras,
  SambaNova, Vercel AI Gateway, Cloudflare Workers AI.
- **Parallelizable**: Round 1 is embarrassingly parallel — run all eight
  roles concurrently on the same or different providers. Round 2 is also
  parallel. Moderator must run after both.
- **Cost tip**: use the cheapest model that follows instructions for Rounds
  1 and 2; the synthesis doesn't need frontier quality.

## Validation rules
- Round 1: every role must produce all five fields. Empty arrays are
  allowed only if the role genuinely has nothing to add (rare).
- Round 1: each array has 2-4 items. Not 0, not 10.
- Round 2: each role must respond to **at least one** other role.
- Round 2: `revised: true` requires a non-empty `revisedStance`;
  `revised: false` requires an empty `revisedStance`.
- Moderator: `needsAnotherRound` must be `false` unless a material conflict
  cannot be resolved without new information from a later stage.
- Moderator: every `conflicts` entry must have a `resolution` even if
  `resolved: false` (the resolution field describes what was decided, even
  if "deferred to engineering with X and Y as inputs").
- Moderator: `rationale` must be ≥ 2 sentences and must reference at least
  one concrete signal from the context map.

## Failure modes
- **Roles agree too quickly** — Round 2 has no responses. Mitigation: force
  at least one response per role, ideally to a role with a differing view.
- **Moderator forces false consensus** — `conflicts: []`. Mitigation: if
  Round 2 has disagreements, the moderator must surface at least one
  conflict.
- **Round 2 revisions without reason** — `revised: true` but
  `revisedStance` is empty or generic. Mitigation: re-run with the
  constraint "the revised stance must differ from the original in a
  specific, named way".
- **Moderator picks the loudest role** — `chosenDirection` matches one
  role's proposal verbatim with no synthesis. Mitigation: require the
  `chosenWhy` to reference at least two roles' positions.
