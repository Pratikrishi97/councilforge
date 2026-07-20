# Examples

Worked examples for CouncilForge. Each one shows the **input** you paste, the **configuration** you pick, the **process** the pipeline runs, and the **kind of output** you get — using fictional data (no real keys or PII).

## Start here

New to CouncilForge? Read [`prd-generation.md`](./prd-generation.md) first — it's the reference example and shows the full 29-stage run end to end. Then try [`skill-only-usage.md`](./skill-only-usage.md) if you'd rather run the council inside your IDE with no app.

## Index

| Example | Capability it demonstrates | Doc type / output |
|---------|----------------------------|-------------------|
| [`prd-generation.md`](./prd-generation.md) | Brief → decision-ready product doc (full pipeline) | PRD |
| [`brd-generation.md`](./brd-generation.md) | Business need → stakeholder-facing doc | BRD |
| [`repository-analysis.md`](./repository-analysis.md) | Point at a GitHub repo → analysis & doc | Repo intel + doc |
| [`council-debate.md`](./council-debate.md) | The visible multi-role debate & consensus | Council transcript |
| [`acceptance-tests.md`](./acceptance-tests.md) | Requirements → Given/When/Then + coverage | Acceptance tests |
| [`scenario-simulation.md`](./scenario-simulation.md) | "What-if" cross-functional analysis | Scenario report |
| [`skill-only-usage.md`](./skill-only-usage.md) | Running the council from the portable skill in an AI IDE | Any doc, no app |
| [`local-mode-ollama.md`](./local-mode-ollama.md) | Air-gapped end-to-end run against a local model | Any doc, offline |

> `examples/websocket/` contains unrelated sample transport code and is not part of the worked-example set.

## The worked-example contract

Every example file above contains:

1. **Title + one-line purpose**
2. **Input** — the exact source material to paste (fenced)
3. **Configuration** — source type, doc type, provider mode, domain pack, council depth, output format
4. **Expected Output** — sections produced, at least one representative Mermaid diagram or table, with `Confirmed` / `Inferred` / `Assumption` labels where relevant
5. **Explanation** — why the engine behaved that way (which stages ran, how routing was chosen, why the doc type was picked)

Want to add one? Follow the same contract and link it into the table above.
