# Workflow — Knowledge Graph

## Stage
**Stage 9 of 10** — Entities, relationships, and decision graph.
**Optional** augmentation.

## Purpose
Extract a structured knowledge graph from the entire pipeline output:
entities (features, requirements, stakeholders, risks, decisions), their
relationships, and a decision graph showing how consensus was reached.
Useful for downstream tooling (impact analysis, search, traceability UIs).

## Input requirements
- **Context map** (from `workflows/understand.md`)
- **Requirements** (from `workflows/requirements.md`)
- **Gaps & risks** (from `workflows/gaps-risks.md`)
- **Debate + consensus** (from `workflows/debate.md`)
- **Generated document** (from `workflows/generate.md`)
- **Metadata** (from the metadata stage)

## Output format (JSON)
```json
{
  "entities": [
    {
      "id": "string — e.g. 'req:F-001'",
      "type": "requirement" | "feature" | "stakeholder" | "risk" | "gap" | "decision" | "assumption" | "component" | "milestone",
      "label": "string — human-readable",
      "properties": { /* arbitrary key-value */ }
    }
  ],
  "relationships": [
    {
      "from": "entityId",
      "to": "entityId",
      "type": "depends_on" | "blocks" | "traces_to" | "owned_by" | "mitigates" | "contradicts" | "supports" | "derived_from",
      "properties": { /* optional */ }
    }
  ],
  "decisionGraph": {
    "decisions": [
      {
        "id": "string",
        "decision": "string",
        "rationale": "string",
        "alternatives": ["string"],
        "decidedBy": "roleName",
        "status": "proposed" | "accepted" | "withdrawn" | "deferred"
      }
    ],
    "decisionLinks": [
      { "from": "decisionId", "to": "decisionId", "type": "supersedes" | "refines" | "depends_on" }
    ]
  },
  "clusters": [
    { "id": "string", "label": "string", "entityIds": ["string"] }
  ]
}
```

## Provider routing recommendation
- **Latency profile**: medium (graph extraction is synthesis-heavy).
- **Context window**: medium-large (all upstream JSON).
- **Recommended provider class**: instruction-following providers with
  strong JSON output — OpenRouter, Cohere, Google AI Studio, Mistral La
  Plateforme.
- **Avoid**: providers with weak JSON adherence — graph schemas are
  unforgiving of dropped fields.

## Validation rules
- Every `entities[].id` must be unique.
- Every `relationships[]` entry must reference existing entity IDs in both
  `from` and `to`.
- `decisionGraph.decisions` must include every decision recorded in the
  moderator synthesis (`consensus.keyDecisionsNeeded`).
- `decisionGraph.decisions[].status` must be one of the four allowed
  values; deferred decisions must have a `properties.deferredTo` field.
- No orphan entities — every entity must appear in at least one
  relationship, or be assigned to a cluster.
- `clusters` are optional but recommended for large graphs (>30 entities).

## Failure modes
- **Dangling relationships** — `from` or `to` references a non-existent
  entity. Mitigation: post-process to validate referential integrity.
- **Flat decision graph** — decisions exist but no `decisionLinks`.
  Mitigation: require at least one link per decision where applicable.
- **Entity explosion** — model creates an entity per sentence. Mitigation:
  cap to top 30-50 entities by importance.
- **Missing decisions** — graph omits decisions from the moderator
  synthesis. Mitigation: cross-check against `consensus.keyDecisionsNeeded`.
