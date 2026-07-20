---
name: Provider request
about: Propose adding or overriding an LLM provider in the registry
title: "[provider] "
labels: provider, needs-triage
assignees: ""
---

## Provider name & homepage

- **Name:** [e.g. Together AI]
- **Homepage:** [https://...]
- **Docs / API reference:** [https://...]

## API details

- **OpenAI-compatible base URL:** [e.g. `https://api.together.xyz/v1`]
- **Chat completions path:** [e.g. `/chat/completions`]
- **Auth method:** [Bearer token / `x-api-key` header / query param / other]
- **OpenAI-format requests supported?** [yes / no]

## Category & capabilities

- **Category:** [free / trial / premium]
- **Default model:** [e.g. `meta-llama/Llama-3.3-70B-Instruct-Turbo`]
- **Context window:** [e.g. 128000]
- **Rate limits (if known):** [e.g. 60 req/min, 1M tokens/day]

## Suited pipeline-stage class

Which class of stages does this provider fit best? (See `docs/ARCHITECTURE.md` for the stage list.)

- [ ] Low-latency (debate rounds, strategy)
- [ ] Large-context (understand, research, generate)
- [ ] Quality-critical (generate, validate, evaluation)

## Registry source

- [ ] This provider **is** listed in [`cheahjs/free-llm-api-resources`](https://github.com/cheahjs/free-llm-api-resources)
- [ ] This provider is **not** in that source (please note why it should be added anyway)

## Warnings / caveats

Anything users should know? (e.g. trains on data by default, restrictive quotas, region limits, opt-out required.)

## Contribution

- [ ] I read [`CONTRIBUTING.md` → "How to add a new provider"](../../CONTRIBUTING.md) and I'm willing to open a PR.
- [ ] I'm just proposing — someone else can implement it.
