# Council flow — debate to consensus

The AI Council is the core differentiator: a visible, adversarial, multi-role debate instead of a single prompt. This is stages 6–9 of the [pipeline](./pipeline-stages.md).

```mermaid
sequenceDiagram
    participant U as Source material
    participant R1 as Round 1 (independent proposals)
    participant R2 as Round 2 (responses & revisions)
    participant M as Moderator
    participant V as AI Voting

    U->>R1: Each role proposes independently
    Note over R1: 🎯 Product · 💼 Business · 🏗️ Architecture<br/>⚙️ Engineering · 🧪 QA · 🔐 Security<br/>🎨 UX · 📦 Delivery (+ domain roles)
    R1->>R2: Roles see each other's proposals
    Note over R2: Respond · revise stance · stand by · withdraw
    R2->>M: All proposals + responses
    Note over M: Synthesize consensus OR<br/>report honest disagreement<br/>+ conflicts + unresolved items
    M->>V: Candidate directions
    Note over V: Weighted, multi-criteria ballots<br/>with per-role rationale
    V->>U: Decision recorded in the journal<br/>(supporters, objectors, confidence)
```

**Why it matters:** when someone later asks *"why did we pick X over Y?"*, the answer is on the record — the objecting role, the feasibility note, and the moderator's tie-breaker. See the [`council-debate` example](../../examples/council-debate.md).
