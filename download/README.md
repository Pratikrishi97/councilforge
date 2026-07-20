# Exports

CouncilForge does not ship pre-generated files here. Every generated version is exported **on demand** from the persisted `DocVersion`, so exports always reflect the latest run.

## How to export

From the app, use the export control on a completed version, or call the API directly:

```
GET /api/versions/{id}/export?format=md      # Markdown (includes Mermaid diagrams)
GET /api/versions/{id}/export?format=json    # Structured JSON for programmatic use
GET /api/versions/{id}/export?format=csv     # Requirements / tests / backlog as rows
GET /api/versions/{id}/export?format=issues  # Issue-tracker format (GitHub / Jira / Linear)
```

Each export bundles the document, requirements, acceptance tests, backlog, roadmap, and traceability matrix.

> This directory is a convenient place to save exported files locally. It is intentionally empty in the repository (its contents are git-ignored) — nothing here is required at runtime.
