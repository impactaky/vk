# External Integrations

**Analysis Date:** 2026-01-30

## APIs & External Services

**vibe-kanban Backend:**
- Service - REST API for project, task, and workspace management
  - SDK/Client: Custom `ApiClient` class in `src/api/client.ts`
  - Auth: None (direct HTTP with Content-Type: application/json)
  - Endpoints:
    - `/api/projects` - CRUD operations on projects
    - `/api/tasks?project_id={id}` - Task management per project
    - `/api/task-attempts` - Workspace (formerly attempt) management
    - `/api/repos` - Repository management
    - `/api/task-attempts/{id}/pr` - PR creation and management
    - `/api/task-attempts/{id}/branch-status` - Git branch status
    - `/api/task-attempts/{id}/merge` - Merge operations
    - `/api/task-attempts/{id}/push` - Push to remote
    - `/api/task-attempts/{id}/rebase` - Rebase branches
    - `/api/task-attempts/{id}/stop` - Stop running workspace
    - `/api/task-attempts/{id}/pr/comments` - Unified PR comments
  - Response format: `{ success: boolean, data?: T, error?: string, message?: string }`
  - Client: `src/api/client.ts` - `ApiClient` class with async request method
  - Status: Critical dependency, CLI won't function without this

## Data Storage

**Databases:**
- None - Stateless CLI tool
- Backend database is managed by vibe-kanban server (out of scope)

**File Storage:**
- Local filesystem only
  - Config file: `~/.config/vibe-kanban/vk-config.json`
  - Deno permissions: `--allow-read`, `--allow-write`
  - Managed by: `src/api/config.ts`

**Caching:**
- None - All requests are fresh to vibe-kanban API
- Client-side filtering done in memory for search/filter operations
  - Example: `src/utils/filter.ts` filters projects/tasks/workspaces by criteria

## Authentication & Identity

**Auth Provider:**
- None - CLI is stateless
- vibe-kanban server handles authentication (out of scope for CLI)
- API requests include: `Content-Type: application/json` header only

**Configuration:**
- API endpoint configuration via `VK_API_URL` environment variable or config file
- Location: `src/api/config.ts`
- Default: `http://localhost:3000`

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Approach: Conditional verbose logging via `src/utils/verbose.ts`
- Activation: `-v` or `--verbose` global option
- Output: Logs to stderr with request/response details
  - Format: `--- API Request ---`, `--- API Response ---` headers
  - Includes: Method, URL, request body, status code, response body
- Usage: `vk --verbose project list` or similar with `-v` flag

**Request Tracing:**
- Implementation: `isVerbose()` flag in `src/api/client.ts`
- Logs both successful and failed API calls with full details
- Helps debugging API interactions with vibe-kanban server

## CI/CD & Deployment

**Hosting:**
- Docker Compose (development/testing only)
  - Service: `vibe-kanban` - Node.js 20-slim running vibe-kanban server
  - Service: `vk` - Deno latest running CLI tests
  - Network: Services communicate via service name (vibe-kanban:3000)
  - Volumes: Shared test data via `shared-test-data` volume
  - See: `docker-compose.yml`

**CI Pipeline:**
- GitHub Actions (assumed, .github/workflows directory exists)
- Likely handles: Testing, linting, formatting, building

**Release:**
- Cross-platform binaries via GitHub Actions
  - Reference: Comment in recent commits mentions "release workflow with cross-platform binaries"
  - Workflow location: `.github/workflows/` (not detailed here)

## Environment Configuration

**Required env vars:**
- `VK_API_URL` (optional) - Override default API endpoint
  - Default: `http://localhost:3000`
  - Used in: `src/api/config.ts`
  - Scope: Global for all commands

**Optional env vars:**
- `HOME` - User home directory for config file (Unix/Linux)
- `USERPROFILE` - User home directory for config file (Windows)
  - Deno uses whichever is set; handled in `src/api/config.ts`

**Secrets location:**
- API endpoint is only configurable data
- No secrets stored locally (stateless CLI)
- vibe-kanban server handles token/auth management

## Webhooks & Callbacks

**Incoming:**
- None - CLI is a client, doesn't expose endpoints

**Outgoing:**
- None - CLI doesn't create webhooks
- PR creation via GitHub API is done by vibe-kanban backend, not CLI
- CLI only calls vibe-kanban API endpoints to trigger PR operations

## Git Integration

**External Tool:**
- git (command-line executable) - Git operations
  - Permission: `--allow-run=git` in Deno installation
  - Usage: `src/utils/git.ts`
  - Operations:
    - Get remote URL: `git remote get-url origin`
    - Extract repository information
  - Status: Optional for basic CLI use, required for branch-related operations

**Interactive Selection Tool:**
- fzf (command-line executable) - Fuzzy finder for interactive selection
  - Permission: `--allow-run=fzf` in Deno installation
  - Usage: `src/utils/fzf.ts`
  - Purpose: Enhanced UX for selecting projects, tasks, attempts
  - Status: Optional - CLI works without it, but some interactive features degrade gracefully
  - Fallback: When fzf not available, CLI prompts differently

## Client Library

**ApiClient:**
- Location: `src/api/client.ts`
- Factory: `ApiClient.create()` - Async constructor pattern
- Methods:
  - Projects: listProjects, getProject, createProject, updateProject, deleteProject
  - Project repos: listProjectRepos, addProjectRepo, removeProjectRepo
  - Tasks: listTasks, getTask, createTask, updateTask, deleteTask
  - Workspaces: listWorkspaces, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace
  - Git ops: mergeWorkspace, pushWorkspace, rebaseWorkspace, stopWorkspace
  - PR ops: createPR, attachPR, getPRComments, getBranchStatus
  - Repos: listRepos, getRepo, updateRepo, registerRepo, initRepo, getRepoBranches
- Error handling: Throws Error on API failure with status and message
- Request pattern: Private `request<T>()` method handles:
  - URL construction
  - Header injection (Content-Type: application/json)
  - Response parsing and validation
  - Verbose logging when enabled

---

*Integration audit: 2026-01-30*
