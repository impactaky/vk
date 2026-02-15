# External Integrations

**Analysis Date:** 2026-01-30

## APIs & External Services

**Vibe-Kanban Backend API:**

- Primary API consumed by this CLI
  - SDK/Client: `ApiClient` class in `src/api/client.ts`
  - Base URL configuration: `src/api/config.ts`
  - Types defined in `src/api/types.ts`
  - Default endpoint: `http://localhost:3000`
  - Environment override: `VK_API_URL`

**GitHub Integration (Implicit):**

- Pull Request (PR) creation/management via vibe-kanban API
  - Endpoints: `/task-attempts/{id}/pr`, `/task-attempts/{id}/pr/attach`,
    `/task-attempts/{id}/pr/comments`
  - Type definitions: `CreatePRRequest`, `PRResult`, `UnifiedPRComment` in
    `src/api/types.ts`
  - Not directly integrated; goes through vibe-kanban API layer

## Data Storage

**Databases:**

- Not direct database integration
- All data persisted via vibe-kanban API endpoints
- Client manages only local configuration

**Configuration Storage:**

- Local filesystem: `~/.config/vibe-kanban/vk-config.json`
  - Managed by: `src/api/config.ts`
  - Contains: `apiUrl`
  - Creation: Automatic if missing (defaults to `http://localhost:3000`)

**File Storage:**

- Local filesystem only
- Configuration file read/write in `~/.config/vibe-kanban/`
- No cloud storage integration

**Caching:**

- None (stateless client)

## Authentication & Identity

**Auth Provider:**

- Not applicable (API authentication handled by vibe-kanban backend)
- This CLI assumes vibe-kanban API is publicly accessible or on localhost
- No API key/token management in this codebase

## Monitoring & Observability

**Error Tracking:**

- None (stderr output only)

**Logs:**

- Console output via `console.log()`
- Verbose mode available via `-v, --verbose` flag
  - Logs API request/response details to console
  - Implemented in `src/utils/verbose.ts`
  - Controlled by `isVerbose()` and `verboseLog()` functions
  - API client logs request method, URL, body, response status, and response
    body when enabled

**Debugging:**

- `--ai` flag outputs CLI schema as JSON for AI consumption

## CI/CD & Deployment

**Hosting:**

- Compiled binaries published to GitHub Releases via Actions
- Supports installation via `deno install` globally or locally

**CI Pipeline:**

- GitHub Actions (`.github/workflows/ci.yml`)
  - Triggered on: push to main, pull requests to main
  - Jobs:
    1. **check** (Ubuntu):
       - Formatting check: `deno fmt --check`
       - Linting: `deno lint`
       - Type check: `deno check src/main.ts`
       - Unit tests: `deno test --allow-read --allow-write --allow-env src/`
    2. **integration-test** (Ubuntu):
       - Docker Compose integration: `docker compose run --rm vk`
       - Runs against containerized vibe-kanban API

- GitHub Actions (`.github/workflows/release.yml`)
  - Triggered on: git tags matching `v*`
  - Jobs:
    1. **ci**: Runs same checks as CI
    2. **build**: Cross-platform binary compilation for 5 targets (Linux
       x86/ARM, Windows x86, macOS x86/ARM)
    3. **release**: Creates GitHub Release with compiled binaries

## Environment Configuration

**Required env vars:**

- `VK_API_URL` (optional) - Overrides default API endpoint

**Optional env vars:**

- `HOME` / `USERPROFILE` - For locating config directory
  (`~/.config/vibe-kanban/`)

**Secrets location:**

- No secrets managed by this codebase
- Config file location: `~/.config/vibe-kanban/vk-config.json`

## Webhooks & Callbacks

**Incoming:**

- None (pure CLI client)

**Outgoing:**

- API calls to vibe-kanban backend endpoints:
  - `/api/projects` - Project CRUD
  - `/api/tasks` - Task CRUD
  - `/api/repos` - Repository CRUD
  - `/api/task-attempts` - Workspace/Attempt CRUD
  - `/api/task-attempts/{id}/pr` - PR operations
  - `/api/task-attempts/{id}/merge`, `/push`, `/rebase`, `/rename-branch` - Git
    operations
  - `/api/task-attempts/{id}/follow-up` - Message passing to running workspaces

## External Tool Integration

**fzf (Optional):**

- Executable name: `fzf`
- Used for interactive selection of projects, tasks, workspaces
- Invoked via `Deno.run()` with `--allow-run=fzf` permission
- Fallback: CLI arguments or interactive prompts if fzf not available
- Implementation: `src/utils/fzf.ts`

**Git:**

- Executable name: `git`
- Used for getting current branch, repository information
- Invoked via `Deno.run()` with `--allow-run=git` permission
- Operations:
  - `git rev-parse --abbrev-ref HEAD` - Get current branch
  - `git config --get remote.origin.url` - Get repo remote
- Implementation: `src/utils/git.ts`

**Browser/Desktop App Opener:**

- Library: `@opensrc/deno-open` v1.0.0
- Used in: `src/commands/task.ts` to open task URLs
- Purpose: Open URLs in default browser/application

## Docker Integration

**Docker Compose:**

- File: `docker-compose.yml`
- Services:
  1. **vibe-kanban** - Node.js v20-slim running vibe-kanban server
     - Port: 3000
     - Health check: HTTP GET to `/api/projects`
  2. **vk** - Deno CLI in separate container
     - Runs integration tests against vibe-kanban service
     - Environment: `VK_API_URL=http://vibe-kanban:3000`
     - Depends on: vibe-kanban service health
- Shared volume: `shared-test-data` for test coordination

---

_Integration audit: 2026-01-30_
