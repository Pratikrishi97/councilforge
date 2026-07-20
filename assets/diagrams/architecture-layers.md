# Architecture — the 7 layers

CouncilForge is organized into seven cooperating layers. Each has one clear responsibility and a small public surface for the layer above it. This mirrors [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) exactly.

```mermaid
flowchart TB
    L1["<b>1 · Experience</b><br/>Next.js 16 app · 12-tab workspace · dashboard · exports<br/>shadcn/ui · Zustand · SSE streaming"]
    L2["<b>2 · Orchestration</b><br/>runPipeline() async generator · 29 stages · gates · manifest<br/>revisions · document diffing · project memory"]
    L3["<b>3 · Intelligence</b><br/>AI Council · research · validation · evaluation<br/>8+ roles · 2-round debate · moderator · voting"]
    L4["<b>4 · Knowledge</b><br/>knowledge graph · decision journal · evidence · prompt registry<br/>typed nodes/edges · impact propagator · domain packs"]
    L5["<b>5 · Execution</b><br/>provider router · 4 modes · fallback chains<br/>23-provider catalog · performance telemetry"]
    L6["<b>6 · Governance</b><br/>policy engine · evaluation rubrics · health score<br/>next-best-action · audit log · observability"]
    L7["<b>7 · Infrastructure</b><br/>Prisma 6 + SQLite/PostgreSQL · z-ai-web-dev-sdk<br/>GitHub fetcher · 38 API routes"]

    L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7
```

**Read next:** [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) for the full layer breakdown, data flow, DB models, and API surface.
