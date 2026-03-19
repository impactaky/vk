# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**Primary backend API:**
- vibe-kanban HTTP API - the CLI issues JSON requests to `/api/*` endpoints through `src/api/client.ts`.
  - SDK/Client: internal `ApiClient` in `src/api/client.ts` built on native `fetch`.
  - Auth: Not detected in the CLI code. No authorization header handling is implemented in `src/api/client.ts`.
  - Key endpoints referenced directly include organizations, repositories, workspaces/task-attempts, sessions, branch status, merge/push/rebase, and pull request operations in `src/api/client.ts`.

**Messaging:**
- NATS - branch notification publish/subscribe flow for `vk notify` and `vk wait`.
  - SDK/Client: `npm:nats` imported as `nats.deno` in `src/commands/notify.ts` and `src/commands/wait.ts`.
  - Auth: host, port, and subject are configurable via `VK_NATS_HOST`, `VK_NATS_PORT`, `VK_NATS_SUBJECT`, or persisted config handled by `src/api/config.ts`.

**Source control platform adjacency:**
- Git hosting providers are inferred from local git remotes, not integrated via provider SDKs. `src/utils/git.ts` parses HTTPS and SSH remote URLs, and pull request URLs are returned by the backend API as strings in `src/api/types.ts`.

## Data Storage

**Databases:**
- Not detected in this CLI repository.
  - Connection: Not applicable.
  - Client: Not applicable.

**File Storage:**
- Local filesystem for CLI config only.
  - Config file: `~/.config/vibe-kanban/vk-config.json` managed by `src/api/config.ts`.
  - Prompt file input: `vk workspace create --file` and `vk workspace spin-off --file` read local text files in `src/commands/task-attempts.ts`.

**Caching:**
- None detected.

## Authentication & Identity

**Auth Provider:**
- Custom or backend-managed outside this repository.
  - Implementation: The CLI currently sends unauthenticated requests from `src/api/client.ts`; any auth is expected to be handled by the target vibe-kanban deployment, reverse proxy, or future backend changes.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- Local console output only.
  - Verbose request/response logging is toggled by `-v` or `--verbose` in `src/main.ts` and implemented in `src/api/client.ts` through `src/utils/verbose.ts`.

## CI/CD & Deployment

**Hosting:**
- GitHub Actions hosts CI and release jobs in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Integration tests depend on a Docker Compose stack that runs `npx -y vibe-kanban` inside the `vibe-kanban` service from `docker-compose.yml`.

**CI Pipeline:**
- GitHub Actions.
  - `check` job runs `deno fmt --check`, `deno lint`, `deno check src/main.ts`, and unit tests in `.github/workflows/ci.yml`.
  - `integration-test` job runs `docker compose run --rm vk` in `.github/workflows/ci.yml`.
  - `release` workflow compiles binaries and publishes GitHub Releases in `.github/workflows/release.yml`.

## Environment Configuration

**Required env vars:**
- `VK_API_URL` - overrides the persisted backend URL in `src/api/config.ts`.
- `VK_DEFAULT_EXECUTOR` - overrides default workspace executor profile in `src/api/config.ts` and is consumed by `src/commands/task-attempts.ts`.
- `VK_NATS_HOST` - overrides NATS host in `src/api/config.ts`.
- `VK_NATS_PORT` - overrides NATS port in `src/api/config.ts`.
- `VK_NATS_SUBJECT` - overrides NATS subject in `src/api/config.ts`.
- `VK_USE_DEV_API_DEFAULT` - forces `http://localhost:3000` when set to `1` and `VK_API_URL` is absent, per `src/api/config.ts`.
- `HOME` or `USERPROFILE` - determines where config is stored in `src/api/config.ts`.

**Secrets location:**
- Not detected in-repo.
- `.env` files were not detected at repo root depth 2 during this scan.
- Runtime configuration is expected from shell environment variables or the local config file written by `src/api/config.ts`.

## Webhooks & Callbacks

**Incoming:**
- None in this CLI repository.

**Outgoing:**
- HTTP requests from `src/api/client.ts` to the configured vibe-kanban backend.
- NATS publishes from `src/commands/notify.ts` to the configured subject.

---

*Integration audit: 2026-03-19*
