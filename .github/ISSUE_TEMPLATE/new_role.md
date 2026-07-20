---
name: Council role proposal
about: Propose a new role for the AI Council debate
title: "[role] "
labels: council-role, needs-triage
assignees: ""
---

## Role name & emoji

- **Name:** [e.g. Data Reviewer]
- **Emoji:** [e.g. 📊]
- **Proposed id:** [camelCase, e.g. `dataReviewer`]

## Mandate

What does this role own in the debate? What perspective does it bring that the existing 8 roles (Product, Business, Architecture, Engineering, QA, Security, UX, Delivery) do not?

## What it challenges

What assumptions or decisions will this role push back on? Give 2–3 concrete examples.

## The 6 debate questions

List the six questions this role answers during Round 1 / Round 2 (mirror the format of existing `skill/roles/*.md` files):

1.
2.
3.
4.
5.
6.

## Domain-specificity

- [ ] This is a **base** role (participates in every debate)
- [ ] This is a **domain-specific** role — which domain pack? [fintech / healthcare / enterprise-workflow / developer-tools / consumer-app / analytics / ai-product / migration]

## Implementation checklist (5 touchpoints)

From [`CONTRIBUTING.md` → "How to add a new council role"](../../CONTRIBUTING.md):

- [ ] Extend the `CouncilRole` union in `src/lib/provider-router.ts`
- [ ] Add `skill/roles/<role>.md` + a `*_SYSTEM` / `*User()` pair in `src/lib/prompts.ts`
- [ ] Register in `debate_round1` and `debate_round2` in `src/lib/pipeline.ts`
- [ ] (Optional) Add to a domain pack's `roles` array in `src/lib/domain-packs.ts`
- [ ] Add the role's emoji + name to the debate panel in `src/components/workspace/stage-panels.tsx`

## Contribution

- [ ] I'm willing to open a PR for this role.
- [ ] I'm just proposing — someone else can build it.
