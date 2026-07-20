# Pipeline — 29 stages in 7 phases

The pipeline runs 29 stages in `STAGE_ORDER` (see [`src/lib/pipeline.ts`](../../src/lib/pipeline.ts)), streamed live to the browser as SSE events. Stage names below match [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) exactly.

```mermaid
flowchart TD
    subgraph P1["Ingest & Understand (1–4)"]
        S1[1 · ingest] --> S2[2 · understand] --> S3[3 · dynamic_council] --> S4[4 · research]
    end
    subgraph P2["Council Debate (5–9)"]
        S5[5 · hypotheses] --> S6[6 · debate_round1] --> S7[7 · debate_round2] --> S8[8 · moderator] --> S9[9 · ai_voting]
    end
    subgraph P3["Requirements & Strategy (10–14)"]
        S10[10 · requirements] --> S11[11 · gaps_risks] --> S12[12 · competitor_intel] --> S13[13 · feature_recs] --> S14[14 · strategy]
    end
    subgraph P4["Document (15–18)"]
        S15[15 · generate] --> S16[16 · validate] --> S17[17 · revise] --> S18[18 · validation_council]
    end
    subgraph P5["Tests & Delivery (19–22)"]
        S19[19 · acceptance_tests] --> S20[20 · backlog] --> S21[21 · roadmap] --> S22[22 · evaluation]
    end
    subgraph P6["Intelligence & Simulation (23–26)"]
        S23[23 · cost_estimate] --> S24[24 · sprint_plan] --> S25[25 · arch_simulation] --> S26[26 · scenario_simulation]
    end
    subgraph P7["Knowledge & Metadata (27–29)"]
        S27[27 · knowledge_graph] --> S28[28 · decision_journal] --> S29[29 · metadata]
    end

    P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7
```

Every stage emits `stage_start` / `stage_complete` events; a failure emits `stage_skipped` with a reason and the pipeline degrades gracefully. Stage 17 (`revise`) runs at most once, only when validation gates fail.
