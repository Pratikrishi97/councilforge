# Security Policy

## Supported versions

The CouncilForge is at **v1.0.0**. Security fixes are applied to the latest `main` branch and released as patch versions. We do not maintain backport branches for older releases at this time.

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | ✅ Latest `main`   |
| < 1.0   | ❌ Not supported   |

---

## API key handling

This project takes API key security seriously. The following guarantees are enforced throughout the codebase:

### Storage
- API keys you configure through the **Providers** tab are stored in the local SQLite database in the `ProviderConfig` table.
- The **masked representation** (e.g. `sk-...abc4`) is stored in `apiKeyMasked` and shown in the UI.
- The actual key value is stored in `apiKeyEnc`.
  > ⚠️ **For local / single-user deployments only.** The `apiKeyEnc` field is currently stored as the raw value. **Before exposing this app to multiple users or to the internet**, you must:
  > - Add real envelope encryption (e.g. AES-GCM with a key derived from an environment variable or a secrets manager).
  > - Put the deployment behind authentication (NextAuth is a dependency and ready to be wired up).
  > - Serve over HTTPS and set secure cookies.

### Never logged
- API keys are **never** written to the application log, the dev/server log files (`dev.log`, `server.log`), or the observability event log.
- The provider router records `providerId`, `providerName`, `reason`, `fallback`, and `model` — **never** the key itself.
- Audit log entries record `action: "provider_key_added"` / `"provider_key_removed"` with the provider ID only, never the key.

### Never in documents
- The policy engine runs `checkOutputPolicies()` on every generated document and rejects output that looks like a leaked secret (AWS keys, OpenAI keys, JWTs, private keys, connection strings).
- Generated documents, exported files (JSON / CSV / Markdown / issue-tracker format), and the decision journal are all scanned for credential patterns before being persisted or returned.
- If a leak is detected, the relevant section is redacted and a `policy_violation` notification is raised.

### Never sent to third parties
- Keys are only sent to the **provider they belong to** (e.g. an OpenRouter key is sent only to `openrouter.ai` as an `Authorization` header).
- Keys are **never** included in prompts, document content, repository fetches, or anything sent to GitHub.
- The `free` mode (`z-ai-web-dev-sdk`) requires no key and never transmits your other keys anywhere.

### Local mode
- In `local` mode, the configured `baseURL` (e.g. `http://localhost:11434/v1` for Ollama) is the only endpoint contacted. No traffic leaves your machine.

---

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, use **[GitHub's private vulnerability reporting](https://github.com/Pratikrishi97/councilforge/security/advisories/new)** (Security → Report a vulnerability). This keeps the report private until a fix is coordinated. Include:

1. A description of the vulnerability and its impact.
2. Steps to reproduce, or a proof-of-concept.
3. Affected versions (default to `main` if unsure).
4. Any suggested mitigations.

You should receive an acknowledgement within **72 hours**. We'll work with you to understand the scope, develop a fix, and coordinate disclosure. Responsible reporters will be credited in the release notes (unless they prefer to remain anonymous).

### Scope

Vulnerabilities in this repository are in scope, including:

- API key leakage (logs, documents, exports, observability).
- Authentication / authorization bypass (once auth is wired up).
- SQL injection or Prisma query issues.
- SSRF in the GitHub fetcher.
- XSS or CSRF in the workspace UI.
- Prompt injection that exfiltrates keys or secrets into documents.

### Out of scope

- Vulnerabilities in upstream dependencies (report to the upstream maintainer; we'll bump versions once a fix is available).
- Issues in providers themselves (report to the provider).
- Theoretical attacks requiring physical access to the server.
- Self-XSS requiring the victim to paste the payload themselves.
- Rate limiting or denial-of-service on the dev server (it's not a production target).

---

## Provider security notes

The provider registry is bootstrapped from [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources). Treat that source as **trusted but unverified** — review any provider's terms of service before sending it data, and never send regulated data (PII, PHI, payment data) to a provider you haven't vetted.

### Free-tier providers
- Free tiers often log prompts for abuse detection. **Do not send sensitive data to free-tier providers.**
- Rate limits are aggressive; expect fallbacks and partial failures.
- Provider availability is not guaranteed — the router's fallback chain handles this, but plan for it.

### Own-keys / hybrid modes
- Your keys are stored locally (see "Storage" above). Rotate them regularly.
- Use provider-specific features where available: OpenRouter's privacy mode, Together AI's SOC 2 controls, Google AI Studio's data controls.
- Set spending caps at the provider to avoid runaway costs during long pipeline runs.

### Local mode
- Verify your local endpoint (Ollama, LM Studio, vLLM) is bound to `localhost` and not exposed to the network.
- Local models can still leak data if the endpoint is shared — keep it single-tenant.

### GitHub fetcher
- `src/lib/github.ts` uses the public GitHub REST API (no auth) with aggressive rate-limit handling.
- It fetches repository metadata, README, and the file tree. **It does not clone or execute code from the repository.**
- Do not feed it URLs to private repositories — those will fail silently.

---

## Hardening checklist for production deployment

If you intend to deploy this beyond a local single-user dev environment:

- [ ] Enable real envelope encryption for `ProviderConfig.apiKeyEnc`.
- [ ] Wire up NextAuth with a real session store (the dependency is already installed).
- [ ] Serve over HTTPS with HSTS.
- [ ] Set `DATABASE_URL` to a managed database (PostgreSQL works — change the Prisma `datasource` provider).
- [ ] Restrict CORS to known origins.
- [ ] Set up rate limiting on `/api/generate` and `/api/providers/keys`.
- [ ] Enable the policy engine's strict mode for any regulated domain.
- [ ] Run the audit log to a tamper-evident sink (append-only storage, SIEM).
- [ ] Disable `local` mode if untrusted users have accounts.

---

## Contact

- Security reports: **[GitHub private vulnerability reporting](https://github.com/Pratikrishi97/councilforge/security/advisories/new)**
- General questions: [GitHub Discussions](https://github.com/Pratikrishi97/councilforge/discussions)
- Non-security bugs: [GitHub Issues](https://github.com/Pratikrishi97/councilforge/issues)
