# Assets

Visual documentation for CouncilForge. At launch these are **Mermaid/ASCII diagrams** (render natively on GitHub, stay in sync with the code, and diff cleanly in PRs). Binary screenshots and recorded demos are planned — see the [roadmap](../ROADMAP.md#later).

These diagrams are the **canonical source** for the visuals referenced in [`README.md`](../README.md) and [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md). If a diagram and the architecture doc ever disagree, the architecture doc (and ultimately `src/lib/pipeline.ts`) wins — update the diagram to match.

## Index

| Diagram | File | Shows |
|---------|------|-------|
| Architecture layers | [`diagrams/architecture-layers.md`](./diagrams/architecture-layers.md) | The 7 cooperating layers, top to bottom |
| Pipeline stages | [`diagrams/pipeline-stages.md`](./diagrams/pipeline-stages.md) | All 29 stages grouped into 7 visible phases |
| Council flow | [`diagrams/council-flow.md`](./diagrams/council-flow.md) | Round 1 → Round 2 → Moderator → AI voting |
| Provider routing | [`diagrams/provider-routing.md`](./diagrams/provider-routing.md) | The 4 modes and the fallback chain |

## Using these in docs

Reference a diagram from any Markdown file with a relative link. For example, from the repo-root `README.md`:

```markdown
See the [pipeline stages diagram](./assets/diagrams/pipeline-stages.md).
```

(Adjust the relative prefix to match the referencing file's location.)

GitHub renders the Mermaid blocks inline when you open the file.
