# Implementation Plan: VK Project Remote APIs for api/remotes

This plan updates the implementation so `/api/remote` uses the VK Project (remote server) as the source of truth for repository operations where possible, with local fallback for compatibility.

**References:**
- `api-migrate.md` (migration spec)
- VK remote server: `crates/remote/`
- Local proxy: `crates/server/src/routes/remote/`
- **DeepWiki:** [BloopAI/vibe-kanban](https://deepwiki.com/BloopAI/vibe-kanban)
  - [9.1 REST API Endpoints](https://deepwiki.com/BloopAI/vibe-kanban/9.1-rest-api-endpoints)
  - [9 API Reference](https://deepwiki.com/BloopAI/vibe-kanban/9-api-reference)
  - [6 Git and GitHub Integration](https://deepwiki.com/BloopAI/vibe-kanban/6-git-and-github-integration)
- Local planning docs: `.planning/VIBE-KANBAN-API.md`, `.planning/research/ENDPOINTS.md`

---

## 0. DeepWiki-Derived API Summary

From DeepWiki and local research (`.planning/`):

### Two server surfaces (VIBE-KANBAN-API.md)
- **Local server** (`/api/...`): CLI, UI, local development
- **Remote server** (`/v1/...`): Cloud `crates/remote`, org-scoped
- **Local proxy** (`/api/remote/...`): Proxies remote APIs through local server

### Existing `/api/remote` routes (from docs)
- `GET /api/remote/projects?organization_id={organization_id}` — list remote projects

### Remote `/v1` routes (VIBE-KANBAN-API.md lines 122–143)
- Organizations: CRUD, billing, portal, checkout
- Projects: `GET /v1/projects`, `GET /v1/projects/{project_id}`
- Issues, migration, billing webhooks

### GitHub App routes (implementation plan / remote crate)
- `GET /v1/organizations/:org_id/github-app/repositories` — fetch/sync repos from GitHub
- `GET /v1/organizations/:org_id/github-app/status` — installation status
- `PATCH .../repositories/review-enabled` (bulk), `PATCH .../repositories/:repo_id/review-enabled` (per-repo)

### Response envelope (all endpoints)
- `success: boolean`
- `data` / `error_data`
- `message`

---

## 1. Current State Summary

### Remote server (VK Project) – already implemented

| Endpoint | Purpose |
|---------|---------|
| `GET /v1/organizations/:org_id/github-app/repositories` | Fetches repos from GitHub API, syncs to DB, returns `Vec<RepositoryDetails>` |
| `GET /v1/organizations/:org_id/github-app/status` | Returns installation status + cached repos |
| `PATCH /v1/organizations/:org_id/github-app/repositories/review-enabled` | Bulk toggle review_enabled |
| `PATCH /v1/organizations/:org_id/github-app/repositories/:repo_id/review-enabled` | Per-repo toggle |

**RepositoryDetails** (in `crates/remote/src/routes/github_app.rs`):
- `id: String` (UUID)
- `github_repo_id: i64`
- `repo_full_name: String`
- `review_enabled: bool`

### Local server – `/api/remote` proxy

Currently proxies: projects, issues, assignees, tags, relationships, workspaces, pull-requests, project-statuses.
**Missing:** GitHub App repositories routes.

### RemoteClient – gaps

Has: `list_remote_projects`, `get_remote_project`.
**Missing:** `list_github_app_repositories(org_id)`, `get_github_app_status(org_id)`.

### vk CLI – current state

- **API client** (`src/api/client.ts`): No `/api/remote` methods
- **Config** (`src/api/config.ts`): `VK_API_URL` only; no `VK_SHARED_API_BASE` (that is server-side)
- **Flow:** vk → local server (`VK_API_URL`) → local server proxies `/api/remote/*` to cloud when configured
- **Project type** (`src/api/types.ts`): `Project` has `remote_project_id: string | null`
- **Local vs remote** (`src/commands/attempt.ts:1049`): `isLocalhost(config.apiUrl)` used for `cd` (spawn vs SSH)

### Data model

- **Local:** `repos` (path-based), `project_repos` (project↔repo junction), `projects` (with optional `remote_project_id`).
- **Remote:** `projects` (org-scoped), `github_app_repositories` (installation-scoped, linked via org → installation).

---

## 2. Implementation Plan

### Phase 1: Shared types and RemoteClient (backend foundation)

#### 1.1 Add shared DTOs in api-types

- Create `crates/api-types/src/github_app.rs`:
  - `RepositoryDetails` (or reuse if moving from remote crate):
    ```rust
    pub struct RepositoryDetails {
        pub id: String,
        pub github_repo_id: i64,
        pub repo_full_name: String,
        pub review_enabled: bool,
    }
    ```
  - `ListGitHubAppRepositoriesResponse` (wrapper if needed).
  - `GitHubAppStatusResponse` (if status endpoint is to be used).
- Re-export from `api-types/src/lib.rs`.
- Ensure `#[derive(Serialize, Deserialize, TS)]` for TS generation.

#### 1.2 Add RemoteClient methods

In `crates/services/src/services/remote_client.rs`:

- `list_github_app_repositories(org_id: Uuid) -> Result<Vec<RepositoryDetails>, RemoteClientError>`
  - Calls `GET /v1/organizations/{org_id}/github-app/repositories`.
- `get_github_app_status(org_id: Uuid) -> Result<GitHubAppStatusResponse, RemoteClientError>` (optional, for richer UI)
  - Calls `GET /v1/organizations/{org_id}/github-app/status`.

#### 1.3 Regenerate TypeScript types

- Run `pnpm run generate-types` (local types).
- Run `pnpm run remote:generate-types` if remote types are generated separately.
- Update `shared/types.ts` / `shared/remote-types.ts` as per project conventions.

---

### Phase 2: Local server – add `/api/remote` GitHub App routes

#### 2.1 New route module

Create `crates/server/src/routes/remote/github_app.rs`:

- `GET /organizations/:org_id/github-app/repositories` → proxies to `client.list_github_app_repositories(org_id)`.
- Optionally: `GET /organizations/:org_id/github-app/status` → proxies to `client.get_github_app_status(org_id)`.

Handler pattern (follow existing `projects.rs`, `issues.rs`):

```rust
async fn list_github_app_repositories(
    State(deployment): State<DeploymentImpl>,
    Path(org_id): Path<Uuid>,
) -> Result<ResponseJson<ApiResponse<Vec<RepositoryDetails>>>, ApiError> {
    let client = deployment.remote_client()?;
    let repos = client.list_github_app_repositories(org_id).await?;
    Ok(ResponseJson(ApiResponse::success(repos)))
}
```

#### 2.2 Mount routes

In `crates/server/src/routes/remote/mod.rs`:

- Add `mod github_app;`
- Merge `github_app::router()` into the remote router.

**Resulting path:** `GET /api/remote/organizations/:org_id/github-app/repositories`.

---

### Phase 3: vk CLI – api/remote integration

vk CLI talks to the local server via `VK_API_URL`. When the local server has remote proxy enabled, vk can call `/api/remote/*` on the same base URL.

#### 3.1 Add types in vk

In `src/api/types.ts`:

```typescript
/** GitHub App repository from remote (DeepWiki: github-app/repositories). */
export interface RepositoryDetails {
  id: string;
  github_repo_id: number;
  repo_full_name: string;
  review_enabled: boolean;
}

/** GitHub App status response (optional, for richer UI). */
export interface GitHubAppStatusResponse {
  installed?: boolean;
  installation_id?: string;
  repos?: RepositoryDetails[];
  // Add fields as per remote endpoint schema
}
```

#### 3.2 Add api/remote methods to ApiClient

In `src/api/client.ts`:

```typescript
/** List GitHub App repositories for an organization. Calls GET /api/remote/organizations/:org_id/github-app/repositories. */
listRemoteGitHubRepositories(organizationId: string): Promise<RepositoryDetails[]> {
  return this.request<RepositoryDetails[]>(
    `/remote/organizations/${organizationId}/github-app/repositories`
  );
}

/** Get GitHub App status for an organization. Calls GET /api/remote/organizations/:org_id/github-app/status. */
getRemoteGitHubAppStatus(organizationId: string): Promise<GitHubAppStatusResponse> {
  return this.request<GitHubAppStatusResponse>(
    `/remote/organizations/${organizationId}/github-app/status`
  );
}

/** List remote projects. Calls GET /api/remote/projects?organization_id=... */
listRemoteProjects(organizationId: string): Promise<Project[]> {
  return this.request<Project[]>(
    `/remote/projects?organization_id=${organizationId}`
  );
}
```

Note: `this.request()` uses `${this.baseUrl}/api${path}` — so path should be `/remote/...` (no leading `/api`).

#### 3.3 Error handling

- Remote proxy may return 503/404 when `VK_SHARED_API_BASE` is unset or remote unavailable.
- vk should catch these and show a clear message: "Remote API not configured" or "Connect to a VK cloud instance to use this feature."

#### 3.4 Optional: vk commands

| Command | Use case |
|---------|----------|
| `vk remote repos list --org <org_id>` | List GitHub App repos for org (P3) |
| `vk project list --remote --org <org_id>` | List remote projects (extends existing `listRemoteProjects`) |

Implementation: add when there is user demand; Phase 3.2 (client methods) is sufficient for programmatic use.

---

### Phase 4: Frontend – typed API helpers

#### 4.1 Add remote GitHub App API

In `frontend/src/lib/api.ts`:

```typescript
export const remoteGitHubAppApi = {
  listRepositories: async (organizationId: string): Promise<RepositoryDetails[]> => {
    const response = await makeRequest(
      `/api/remote/organizations/${organizationId}/github-app/repositories`
    );
    const result = await handleApiResponse<RepositoryDetails[]>(response);
    return result;
  },
  // getStatus: async (organizationId: string) => ... if needed
};
```

Use shared types from `shared/types.ts` (generated from api-types).

#### 4.2 Update consumers

- Settings / Remote Projects: where org is selected, add "List repos from GitHub" or similar using `remoteGitHubAppApi.listRepositories(orgId)` when VK cloud is configured.
- Keep backward compatibility: if no `VK_SHARED_API_BASE` or no remote client, do not call these endpoints (or handle 404/503 gracefully).

---

### Phase 5: Task link / workspace sync – remote-first repo context

#### 5.1 Identify task-attempt link flow

- `POST /api/task-attempts/:id/link` – in `crates/server/src/routes/task_attempts/` (or similar).
- Currently resolves project/repo context from local DB (`project_repos`, `repos`).

#### 5.2 Enrichment strategy

- When linking, if the task's project has `remote_project_id`:
  1. Call remote project to get org_id.
  2. Optionally call `list_github_app_repositories(org_id)` to validate/enrich repo info.
- Map `repo_full_name` (e.g. `owner/repo`) to local repo by path or create a placeholder if local repo does not exist.
- Fallback: keep existing local-only resolution when remote is unavailable.

**Files to touch:** task_attempt link handler, deployment/repo service.

---

### Phase 6: MCP repo tools – remote option

#### 6.1 Extend MCP repos tools

In `crates/mcp/src/task_server/tools/repos.rs`:

- Add optional `list_repos_remote(organization_id)` tool that calls:
  - `GET /api/remote/organizations/{org_id}/github-app/repositories`
- Keep `list_repos` calling `/api/repos` (local) as default.
- Consider: `list_repos` could try remote first when `organization_id` context is available (e.g. from active workspace), then fall back to local.

#### 6.2 Tool schema

- Add `organization_id` as optional param to a new tool or to `list_repos`.
- Document that when using VK cloud, agents can list repos from the org's GitHub App installation.

---

### Phase 7: Optional – unified repos endpoint

- `GET /api/remote/repos?organization_id=...` (optional):
  - Proxies to `list_github_app_repositories` for a simpler single endpoint.
  - Useful if frontend/MCP want a single "list remote repos" path without nesting under org.

---

## 3. Implementation Task List

Checklist format for tracking progress. Execute in order; dependencies noted.

### Phase 1: Backend foundation
- [ ] **1.1** Create `crates/api-types/src/github_app.rs` with `RepositoryDetails`, `GitHubAppStatusResponse`
- [ ] **1.2** Add `#[derive(Serialize, Deserialize, TS)]` and re-export from `api-types/src/lib.rs`
- [ ] **1.3** Add `list_github_app_repositories(org_id)` to `crates/services/src/services/remote_client.rs`
- [ ] **1.4** Add `get_github_app_status(org_id)` to `remote_client.rs` (optional)
- [ ] **1.5** Run `pnpm run generate-types`; update `shared/types.ts`

### Phase 2: Server routes
- [ ] **2.1** Create `crates/server/src/routes/remote/github_app.rs` with handlers
- [ ] **2.2** Implement `GET /organizations/:org_id/github-app/repositories` handler
- [ ] **2.3** Implement `GET /organizations/:org_id/github-app/status` handler (optional)
- [ ] **2.4** Add `mod github_app` and mount `github_app::router()` in `routes/remote/mod.rs`

### Phase 3: vk CLI
- [ ] **3.1** Add `RepositoryDetails` and `GitHubAppStatusResponse` to `src/api/types.ts`
- [ ] **3.2** Add `listRemoteGitHubRepositories(organizationId)` to `src/api/client.ts`
- [ ] **3.3** Add `getRemoteGitHubAppStatus(organizationId)` to `src/api/client.ts`
- [ ] **3.4** Add `listRemoteProjects(organizationId)` to `src/api/client.ts`
- [ ] **3.5** Add error handling for 404/503 with clear user-facing messages
- [ ] **3.6** *(Optional)* Add `vk remote repos list --org <org_id>` command
- [ ] **3.7** *(Optional)* Add `vk project list --remote --org <org_id>` option

### Phase 4: Frontend
- [ ] **4.1** Add `remoteGitHubAppApi.listRepositories()` to `frontend/src/lib/api.ts`
- [ ] **4.2** Add `remoteGitHubAppApi.getStatus()` if used (optional)
- [ ] **4.3** Wire Settings / Remote Projects to use `remoteGitHubAppApi` when remote configured
- [ ] **4.4** Handle 404/503 when `VK_SHARED_API_BASE` unset

### Phase 5: Task link enrichment
- [ ] **5.1** Locate `POST /api/task-attempts/:id/link` handler
- [ ] **5.2** When project has `remote_project_id`, fetch org_id from remote project
- [ ] **5.3** Optionally call `list_github_app_repositories(org_id)` to enrich repo context
- [ ] **5.4** Map `repo_full_name` to local repo; create placeholder if missing
- [ ] **5.5** Preserve local-only flow when remote unavailable

### Phase 6: MCP tools
- [ ] **6.1** Add `list_repos_remote(organization_id)` tool to `crates/mcp/.../tools/repos.rs`
- [ ] **6.2** Add `organization_id` param to tool schema
- [ ] **6.3** Document remote repos usage for VK cloud agents
- [ ] **6.4** *(Optional)* Have `list_repos` try remote first when org context available

### Phase 7: Optional
- [ ] **7.1** Add `GET /api/remote/repos?organization_id=...` unified endpoint
- [ ] **7.2** Update frontend/MCP to use unified endpoint if preferred

### Verification
- [ ] **V1** Backend: repos endpoint returns data with `VK_SHARED_API_BASE` set
- [ ] **V2** Backend: appropriate error when remote unconfigured
- [ ] **V3** vk: `listRemoteGitHubRepositories` succeeds and fails gracefully
- [ ] **V4** Task link works for local-only and remote-linked projects
- [ ] **V5** MCP tool returns remote repos when org context available

---

## 4. File Checklist (by area)

| Area | File(s) | Action |
|------|---------|--------|
| api-types | `crates/api-types/src/github_app.rs`, `lib.rs` | Add RepositoryDetails, response types |
| services | `remote_client.rs` | Add `list_github_app_repositories`, optional `get_github_app_status` |
| server | `routes/remote/mod.rs`, `routes/remote/github_app.rs` | New module, mount routes |
| shared | `shared/types.ts` | Regenerate via `pnpm run generate-types` |
| **vk** | `src/api/types.ts` | Add RepositoryDetails, GitHubAppStatusResponse |
| **vk** | `src/api/client.ts` | Add listRemoteGitHubRepositories, getRemoteGitHubAppStatus, listRemoteProjects |
| frontend | `api.ts` | Add `remoteGitHubAppApi` |
| frontend | Settings / Remote Projects components | Use new API when remote available |
| task_attempts | Link handler | Enrich from remote repos when remote_project_id set |
| MCP | `tools/repos.rs` | Add remote listing tool or param |

---

## 5. Testing Checklist

### Backend
- [ ] With `VK_SHARED_API_BASE` set: `GET /api/remote/organizations/:org_id/github-app/repositories` returns repos.
- [ ] Without remote: same request returns appropriate error (no client, 503, etc.).
- [ ] RemoteClient retries on transient errors (already uses backon).
- [ ] TS types compile; frontend `remoteGitHubAppApi` is typed.

### vk CLI
- [ ] `client.listRemoteGitHubRepositories(orgId)` succeeds when server has remote proxy.
- [ ] `client.listRemoteGitHubRepositories(orgId)` fails gracefully (clear error) when remote unavailable.
- [ ] `client.listRemoteProjects(orgId)` works (existing endpoint).

### MCP & Task link
- [ ] MCP tool returns remote repos when org context available.
- [ ] Task link still works for local-only projects.
- [ ] Task link enriches repo context when project has remote_project_id.

---

## 6. Order of Implementation

1. **Phase 1** – api-types + RemoteClient (enables Phase 2).
2. **Phase 2** – server routes (enables vk, frontend, MCP).
3. **Phase 3** – vk CLI (client methods; can parallel with Phase 4).
4. **Phase 4** – frontend (can be done in parallel).
5. **Phase 5** – task link enrichment (depends on Phase 1–2).
6. **Phase 6** – MCP tools.

Phases 1–2 are the minimum for a working remote repo API. Phase 3 enables vk to use api/remote. Phases 4–6 improve UX and agent capabilities.

---

## 7. DeepWiki URL Reference (for future updates)

| Section | URL |
|---------|-----|
| Main | https://deepwiki.com/BloopAI/vibe-kanban |
| REST API Endpoints | https://deepwiki.com/BloopAI/vibe-kanban/9.1-rest-api-endpoints |
| API Reference | https://deepwiki.com/BloopAI/vibe-kanban/9-api-reference |
| Git & GitHub | https://deepwiki.com/BloopAI/vibe-kanban/6-git-and-github-integration |

When DeepWiki pages load correctly, verify schema and paths against this plan and update `.planning/VIBE-KANBAN-API.md` accordingly.
