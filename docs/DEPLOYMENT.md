# Deployment guide

CouncilForge is a single Next.js 16 application backed by Prisma. This guide covers running it in production behind a reverse proxy, switching from SQLite to PostgreSQL, choosing a provider mode, and the environment variables you need.

> **Scope & honesty:** CouncilForge v1.0.0 is **single-user** (no authentication is wired up) and stores provider API keys **unencrypted at rest**. Read [Security considerations](#security-considerations) and [`SECURITY.md`](../SECURITY.md) before exposing it to a network. This guide documents the supported path only — it does not invent tooling that isn't in the repo.

---

## Prerequisites

- **[Bun](https://bun.sh) 1.1+** (recommended) or **Node.js 18+**
- A reverse proxy for TLS (the repo ships a [`Caddyfile`](../Caddyfile); nginx/Traefik work too)
- Optional: a PostgreSQL database for multi-writer/production workloads

---

## Build & run

CouncilForge uses the Next.js **standalone** output. The scripts below are exactly those defined in [`package.json`](../package.json) — nothing extra is required.

```bash
# 1. Install dependencies
bun install --frozen-lockfile

# 2. Generate the Prisma client and create the schema
bun run db:generate
bun run db:push

# 3. Build the standalone production bundle
bun run build

# 4. Start the production server (listens on port 3000)
bun run start
```

`bun run build` produces `.next/standalone` and copies static assets in; `bun run start` runs `NODE_ENV=production bun .next/standalone/server.js`. The server listens on **port 3000**.

> Run the app as a managed process (systemd, pm2, Docker, or your platform's process manager) so it restarts on failure. The repo does not ship a process manager — pick the one that matches your host.

---

## Reverse proxy (Caddy)

The included [`Caddyfile`](../Caddyfile) proxies inbound traffic to the app on port 3000 and forwards the standard `X-Forwarded-*` / `Host` headers. To add automatic TLS, replace the `:81` site address with your domain:

```caddy
councilforge.example.com {
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Real-IP {remote_host}
    }
}
```

```bash
caddy run --config ./Caddyfile
```

Caddy provisions and renews Let's Encrypt certificates automatically for a real domain. Keep the app bound to `localhost:3000` and let the proxy terminate TLS.

---

## Database: SQLite → PostgreSQL

**SQLite (default).** Great for single-user and evaluation. The database lives at `db/custom.db`. No external service needed. Not suitable for concurrent multi-writer workloads.

**PostgreSQL (production).** For anything beyond single-user, point Prisma at Postgres:

1. Set `DATABASE_URL` to your Postgres connection string (see below).
2. Update the datasource provider in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   > This is the one place production deviates from the default SQLite schema. It is a datasource change, not an application-logic change.
3. Apply the schema:
   ```bash
   bun run db:generate
   bun run db:push        # or: bun run db:migrate  (for tracked migrations)
   ```

---

## Provider mode for production

The four provider modes are documented in [`PROVIDER_SETUP.md`](./PROVIDER_SETUP.md). For production, prefer:

| Mode | Why |
|------|-----|
| **`own-keys`** | Predictable cost and no reliance on shared free tiers. A stage fails loudly rather than silently falling back. |
| **`local`** | Air-gapped / regulated data. All traffic stays on your machine (Ollama, LM Studio, vLLM). |

Avoid `free` mode in production — free tiers rate-limit aggressively and may log prompts. See [`PROVIDER_SETUP.md` → Security notes](./PROVIDER_SETUP.md#security-notes).

---

## Environment variables

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | Yes | `file:./db/custom.db` or `postgresql://user:pass@host:5432/councilforge` | Prisma datasource. SQLite by default. |
| `NODE_ENV` | Recommended | `production` | Set by `bun run start`; set it in your process manager too. |
| `HTTPS_PROXY` | Optional | `http://proxy:8080` | If your host is behind a corporate proxy (affects free-mode SDK calls). |

Provider API keys are **not** environment variables — they are entered in the Providers tab and stored in the DB (`ProviderConfig`). Never commit a `.env` file; `.gitignore` already excludes it.

---

## Security considerations

- **Single-user only.** There is no auth. Do not expose CouncilForge to untrusted users. Put it behind a VPN, an SSO reverse proxy, or network ACLs.
- **API keys unencrypted at rest.** `ProviderConfig` currently holds raw key values. Add envelope encryption (KMS / OS keychain) before any shared or multi-user deployment. This is a tracked limitation — see [`SECURITY.md`](../SECURITY.md) and the [roadmap](../ROADMAP.md#next).
- **Do not commit the local DB** (`db/custom.db`) or build artifacts (`.next/`).
- **Output secret-scanning** runs on every generated document (the policy engine redacts leaked credentials), but this does not substitute for the hardening above.

---

## Post-deploy checklist

- [ ] App reachable only through the TLS reverse proxy (not directly on `:3000`)
- [ ] `DATABASE_URL` points at the intended database (Postgres for production)
- [ ] Provider mode is `own-keys` or `local`
- [ ] Network access restricted (VPN / SSO / ACL) — remember there is no built-in auth
- [ ] Process manager restarts the app on failure
- [ ] `.env`, `db/custom.db`, and `.next/` are not committed

See also: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`PROVIDER_SETUP.md`](./PROVIDER_SETUP.md) · [`SECURITY.md`](../SECURITY.md) · [`ROADMAP.md`](../ROADMAP.md)
