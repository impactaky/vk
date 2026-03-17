# External Integrations

**Analysis Date:** 2026-03-17

## APIs & External Services

**vibe-kanban API:**
- The primary external dependency is the vibe-kanban server consumed through `src/api/client.ts`.
  - SDK/Client: custom `ApiClient` in `src/api/client.ts`
  - Auth: no explicit auth headers or tokens detected in `src/api/client.ts`
- The CLI targets `/api/*` endpoints including organizations, repositories, workspaces/task-attempts, sessions, branch operations, and pull-request actions, all implemented as HTTP `fetch` requests in `src/api/client.ts`.
- Local default server settings come from `src/api/config.ts` with a fallback of `http://localhost:3000`.

**NATS messaging:**
- Branch notifications are published and consumed through NATS in `src/commands/notify.ts` and `src/commands/wait.ts`.
  - SDK/Client: `nats.deno` from `deno.json`
  - Auth: none detected; connections use plain `nats://host:port` built from config in `src/api/config.ts`

**Git hosting / pull request backends:**
- The CLI exposes PR and repo-branch operations through the vibe-kanban API rather than calling GitHub or GitLab directly. The request surface is in `src/api/client.ts` and the related types are in `src/api/types.ts`.
  - SDK/Client: indirect via `ApiClient` in `src/api/client.ts`
  - Auth: delegated to the upstream vibe-kanban server; no provider token handling is present in this repository

## Data Storage

**Databases:**
- Not detected in this repository. The CLI is stateless aside from local config and delegates persistence to the upstream vibe-kanban server via `src/api/client.ts`.
  - Connection: not applicable
  - Client: not applicable

**File Storage:**
- Local filesystem only.
- CLI config is stored at `~/.config/vibe-kanban/vk-config.json` through `src/api/config.ts`.
- Commands read prompt files from user-provided paths in `src/commands/task-attempts.ts`.

**Caching:**
- None detected in `src/` or `tests/`.

## Authentication & Identity

**Auth Provider:**
- Custom / upstream-server-managed.
  - Implementation: this repository does not implement login, token storage, or request signing; all requests in `src/api/client.ts` send JSON without auth headers.

## Monitoring & Observability

**Error Tracking:**
- None detected. Errors are surfaced to stderr by helpers such as `src/utils/error-handler.ts`.

**Logs:**
- Local console logging only.
- Verbose HTTP request/response logging is toggled by `--verbose` in `src/main.ts` and implemented in `src/utils/verbose.ts` and `src/api/client.ts`.

## CI/CD & Deployment

**Hosting:**
- CI and release automation run on GitHub Actions in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Integration tests depend on a Docker Compose environment described in `docker-compose.yml`.
- Release artifacts are uploaded to GitHub Releases by `.github/workflows/release.yml`.

**CI Pipeline:**
- GitHub Actions.
- `.github/workflows/ci.yml` runs format, lint, type-check, unit tests, and `docker compose run --rm vk`.
- `.github/workflows/release.yml` compiles binaries for Linux, macOS, and Windows targets with `deno compile`.

## Environment Configuration

**Required env vars:**
- `VK_API_URL` - overrides the base API URL in `src/api/config.ts`; also set for integration tests in `docker-compose.yml`.
- `VK_DEFAULT_EXECUTOR` - default executor profile override in `src/api/config.ts`; set in `docker-compose.yml`.
- `VK_NATS_HOST` - NATS host override in `src/api/config.ts`.
- `VK_NATS_PORT` - NATS port override in `src/api/config.ts`.
- `VK_NATS_SUBJECT` - NATS subject override in `src/api/config.ts`.
- `HOME` or `USERPROFILE` - used by `src/api/config.ts` to locate `~/.config/vibe-kanban/vk-config.json`.

**Secrets location:**
- No repository-managed secrets detected.
- User-specific runtime configuration is stored in `~/.config/vibe-kanban/vk-config.json` via `src/api/config.ts`.
- GitHub Actions secrets, if any, are not referenced directly in `.github/workflows/ci.yml` or `.github/workflows/release.yml`.

## Webhooks & Callbacks

**Incoming:**
- None implemented in this CLI repository.
- Test health polling hits `/api/health` from `tests/helpers/test-server.ts`, but that is client polling rather than a callback receiver.

**Outgoing:**
- HTTP requests from `src/api/client.ts` to the upstream vibe-kanban API.
- NATS publish events from `src/commands/notify.ts` to the configured subject.

---

*Integration audit: 2026-03-17*
