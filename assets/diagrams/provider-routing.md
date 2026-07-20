# Provider routing — 4 modes + fallback

The router maps each council role + task type to the best available provider, then executes with an automatic fallback chain. Mode is chosen at onboarding and changeable in the Providers tab. See [`docs/PROVIDER_SETUP.md`](../../docs/PROVIDER_SETUP.md).

```mermaid
flowchart TD
    Start([Stage needs an LLM call]) --> Mode{Provider mode?}

    Mode -->|free| F["Built-in z-ai-web-dev-sdk<br/>+ no-signup free tiers"]
    Mode -->|hybrid| H["Your keys on quality-critical stages<br/>free providers elsewhere"]
    Mode -->|own-keys| O["ONLY your configured providers"]
    Mode -->|local| L["Local OpenAI-compatible endpoint<br/>(Ollama / LM Studio / vLLM)"]

    F --> Try[Call chosen provider]
    H --> Try
    O --> Try
    L --> Try

    Try --> OK{Success?}
    OK -->|yes| Done([Return text + RoutingDecision])
    OK -->|no| FB{Mode allows fallback?}
    FB -->|free / hybrid| Next[Fall back to next provider<br/>→ ultimately zai-default]
    FB -->|own-keys / local| Fail[Stage fails loudly<br/>no silent downgrade]
    Next --> Try
    Fail --> Done
```

Every routed call records a `RoutingDecision` (provider, model, reason, whether it was a fallback) and an observability event, visible in the Providers tab.
