# Workflow — Research

## Stage
**Stage 2 of 10** — Competitor, feature, cost, sprint, and architecture
intelligence. **Optional** augmentation triggered on demand.

## Purpose
Augment the context map with external knowledge: similar products, common
feature sets for the domain, cost and effort estimates, a sprint plan, and
an architecture simulation. This stage is what separates a generic doc from
one that anticipates the team's actual next questions.

## Sub-stages
This workflow bundles five independent research tasks. Run any subset:

| Sub-stage         | Output                          |
|-------------------|---------------------------------|
| Competitor scan   | Comparable products, positioning|
| Feature recommendation | Common features for the domain, with priority |
| Cost estimate     | Infrastructure + ops cost model |
| Sprint plan       | Sequenced workstreams, effort ranges |
| Architecture simulation | Stress-test the proposed architecture |

## Input requirements
- **Context map** (output of `workflows/understand.md`)
- **Hypotheses** (optional, if a hypotheses stage ran between Understand
  and Research)
- **Requirements** (optional, for sprint planning sub-stage)
- **Domain hint** (optional): finance, health, education, B2B SaaS,
  consumer mobile, etc.

## Output format (JSON)
```json
{
  "competitors": [
    { "name": "string", "positioning": "string", "strengths": ["string"], "weaknesses": ["string"], "pricingModel": "string" }
  ],
  "featureRecommendations": [
    { "feature": "string", "rationale": "string", "priority": "must" | "should" | "could", "source": "competitor" | "industry-standard" | "user-expectation" }
  ],
  "costEstimate": {
    "infrastructure": [{ "item": "string", "monthlyCost": "string", "assumption": "string" }],
    "operational":    [{ "item": "string", "monthlyCost": "string", "assumption": "string" }],
    "oneTime":        [{ "item": "string", "cost": "string", "assumption": "string" }],
    "totalMonthlyRange": "string — e.g. '$500-$2,000",
    "notes": ["string"]
  },
  "sprintPlan": {
    "sprints": [
      { "sprint": 1, "goal": "string", "workstreams": [{ "name": "string", "effort": "string", "owner": "string" }], "deliverable": "string", "risk": "string" }
    ],
    "totalEstimate": "string — e.g. '6-8 sprints (12-16 weeks)'",
    "assumptions": ["string"]
  },
  "architectureSimulation": {
    "scenarios": [
      { "scenario": "string — e.g. '10x traffic spike'", "behavior": "string", "bottleneck": "string", "mitigation": "string" }
    ],
    "recommendations": ["string"]
  }
}
```

## Provider routing recommendation
- **Latency profile**: medium (synthesis-heavy across multiple sub-stages).
- **Context window**: large (competitor scan + feature rec pull in broad
  domain knowledge).
- **Recommended provider class**: large-context, strong-knowledge providers
  — Google AI Studio, OpenRouter (route to a frontier model), Cohere,
  Together AI, Mistral La Plateforme.
- **Parallelizable**: each sub-stage is independent and can run on a
  different provider concurrently to reduce wall-clock time.

## Validation rules
- Every competitor entry must have a `positioning` field — a name alone is
  useless.
- Every feature recommendation must link to a `source`
  (`competitor` / `industry-standard` / `user-expectation`). No free-floating
  opinions.
- Cost estimates must be **ranges**, not single numbers, and must include
  the assumption behind each line.
- Sprint estimates must be **ranges** (e.g. "6-8 sprints") and must list
  assumptions about team size and velocity.
- Architecture simulation must include at least one failure scenario
  (`10x traffic`, `primary region down`, `dependency outage`).
- No field may assert specific competitor revenue, market share, or user
  counts unless the source material provides them.

## Failure modes
- **Generic competitor list** — "Slack, Microsoft Teams, Discord" for any
  chat product. Mitigation: require a `positioning` differentiator per
  competitor.
- **Unbounded feature list** — model lists every possible feature.
  Mitigation: cap to top 8-12 by priority, with rationale.
- **Fake cost precision** — "$1,247/month". Mitigation: force ranges and
  assumptions.
- **Sprint plan ignoring dependencies** — workstreams sequenced without
  considering critical path. Mitigation: require a `risk` field per sprint
  that names the dependency.
