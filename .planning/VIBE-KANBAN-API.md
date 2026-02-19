# Vibe Kanban API (DeepWiki, current snapshot)

Date: 2026-02-15
Source: `DeepWiki` for `BloopAI/vibe-kanban` (repo) + existing CLI docs/code.

## Notes
- Vibe Kanban has two server surfaces:
  - Local server APIs under `/api/...` (CLI/UI/server)
  - Remote server APIs under `/v1/...` (cloud `crates/remote`)
- Local server also exposes some remote proxy routes under `/api/remote/...`.

## Response envelope and errors
- API responses use a standardized wrapper with fields:
  - `success: boolean`
  - `data` / `error_data`
  - `message`
- Frontend handlers reject failed responses and can throw/return structured `ApiError` containing `statusCode`.

## Local server REST routes (`/api`)

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}`
- `POST /api/projects/{id}/open-editor`
- `GET /api/projects/{id}/search?q={query}&mode={mode}`
- `GET /api/projects/{projectId}/repositories`
- `POST /api/projects/{projectId}/repositories`
- `DELETE /api/projects/{projectId}/repositories/{repoId}`

### Tasks
- `GET /api/tasks/{taskId}`
- `POST /api/tasks`
- `POST /api/tasks/create-and-start`
- `PUT /api/tasks/{taskId}`
- `DELETE /api/tasks/{taskId}`

### Task attempts / Workspaces
- `POST /api/task-attempts`
- `GET /api/task-attempts`
- `GET /api/task-attempts/{id}`
- `PUT /api/task-attempts/{id}`
- `DELETE /api/task-attempts/{id}`
- `GET /api/task-attempts/{id}/branch-status`
- `GET /api/task-attempts/{id}/repos`
- `GET /api/task-attempts/{id}/diff/ws`
- `POST /api/task-attempts/{id}/merge`
- `POST /api/task-attempts/{id}/push`
- `POST /api/task-attempts/{id}/push/force`
- `POST /api/task-attempts/{id}/rebase`
- `POST /api/task-attempts/{id}/rebase/continue`
- `POST /api/task-attempts/{id}/conflicts/abort`
- `POST /api/task-attempts/{id}/pr`
- `POST /api/task-attempts/{id}/pr/attach`
- `GET /api/task-attempts/{id}/pr/comments`
- `POST /api/task-attempts/from-pr`
- `POST /api/task-attempts/{id}/open-editor`
- `GET /api/task-attempts/{id}/first-message`
- `GET /api/task-attempts/{id}/children`
- `POST /api/task-attempts/{id}/change-target-branch`
- `POST /api/task-attempts/{id}/rename-branch`
- `POST /api/task-attempts/{id}/unlink`
- `POST /api/task-attempts/{id}/link`
- `POST /api/task-attempts/{id}/run-agent-setup`
- `POST /api/task-attempts/{id}/gh-cli-setup`
- `POST /api/task-attempts/{id}/start-dev-server`
- `POST /api/task-attempts/{id}/run-setup-script`
- `POST /api/task-attempts/{id}/run-cleanup-script`
- `POST /api/task-attempts/{id}/run-archive-script`
- `POST /api/task-attempts/{id}/stop`
- `POST /api/task-attempts/{id}/mark-seen`

### Repositories
- `GET /api/repos`
- `GET /api/repos/recent`
- `GET /api/repos/{repoId}`
- `PUT /api/repos/{repoId}`
- `POST /api/repos`
- `POST /api/repos/init`
- `GET /api/repos/{repoId}/branches`
- `POST /api/repos/batch`
- `POST /api/repos/{repoId}/open-editor`
- `GET /api/repos/{repoId}/search?q={query}&mode={mode}`
- `GET /api/repos/{repoId}/prs?remote={remoteName}`
- `GET /api/repos/{repoId}/remotes`

### Sessions
- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/sessions/{sessionId}`
- `POST /api/sessions/{sessionId}/follow-up`
- `POST /api/sessions/{sessionId}/review`
- `POST /api/sessions/{sessionId}/reset`
- `POST /api/sessions/{sessionId}/queue`
- `DELETE /api/sessions/{sessionId}/queue`
- `GET /api/sessions/{sessionId}/queue`

### Containers
- `GET /api/containers/info`
- `GET /api/containers/attempt-context`

### Misc local routes seen in docs
- `GET /api/remote/projects?organization_id={organization_id}`
- `GET /api/organizations`
- `GET /api/repos/{repo_id}/remotes`
- `POST /session/{session_id}/summarize`
- `POST /api/task-attempts/{id}/summary`
- `GET /api/task-attempts/stream/ws`
- `GET /api/workspaces/stream/ws`
- `GET /api/tasks/stream/ws`
- `GET /api/execution-processes/stream/ws`
- `GET /api/projects/stream/ws`
- `GET /api/scratch/stream/ws`

## Local websocket streams
- Task attempts diff: `GET /api/task-attempts/{id}/diff/ws`
- Workspaces updates: `GET /api/task-attempts/stream/ws`
- Workspace logs/process streams are handled in dedicated WS handlers (execution process raw/normalized, scratchpad, projects, tasks, etc.).
- Terminal sessions use websocket connections for interactive streams.

## Remote server REST routes (`/v1`)
- `GET /v1/organizations`
- `POST /v1/organizations`
- `GET /v1/organizations/{org_id}`
- `PATCH /v1/organizations/{org_id}`
- `DELETE /v1/organizations/{org_id}`
- `GET /v1/projects`
- `GET /v1/projects/{project_id}`
- `POST /v1/migration/projects`
- `POST /v1/issues`
- `GET /v1/issues`
- `GET /v1/issues/{issue_id}`
- `PATCH /v1/issues/{issue_id}`
- `DELETE /v1/issues/{issue_id}`
- `POST /v1/issues/bulk`
- `POST /v1/migration/issues`
- `POST /v1/migration/workspaces`
- `POST /v1/billing/webhook`
- `GET /v1/organizations/{org_id}/billing`
- `POST /v1/organizations/{org_id}/billing/portal`
- `POST /v1/organizations/{org_id}/billing/checkout`

## Legacy CLI-focused API surface (from this CLI client)
For comparison, the current `vk` CLI currently uses only a smaller subset:
- `projects`, `tasks`, `task-attempts`, `repos`, `sessions`
- Common workspace routes used by CLI: `/rename-branch`, `/merge`, `/push`, `/rebase`, `/stop`, `/pr`, `/branch-status`, `/pr/attach`, `/repos`, `/pr/comments`
- `task-attempts` are still prefixed with `task-attempts` and response envelope expected with `success/data`.

## API -> vk command table (current CLI)

Legend: `n/a` means the CLI has no direct command for that endpoint.

### Local `/api` endpoints

| API endpoint | Method | `vk` command |
|---|---:|---|
| `/api/projects` | GET | `vk project list` |
| `/api/projects/{id}` | GET | `vk project show [id]` |
| `/api/projects` | POST | `vk project create` |
| `/api/projects/{id}` | PUT | `vk project update [id]` |
| `/api/projects/{id}` | DELETE | `vk project delete [id]` |
| `/api/projects/{id}/open-editor` | POST | n/a |
| `/api/projects/{id}/search` | GET | n/a |
| `/api/projects/{projectId}/repositories` | GET | `vk project repos [id]` |
| `/api/projects/{projectId}/repositories` | POST | `vk project add-repo [id]` |
| `/api/projects/{projectId}/repositories/{repoId}` | DELETE | `vk project remove-repo [id] --repo ...` |
| `/api/tasks/{taskId}` | GET | `vk task show [id]` |
| `/api/tasks` | POST | `vk task create` |
| `/api/tasks/create-and-start` | POST | n/a |
| `/api/tasks/{taskId}` | PUT | `vk task update [id]` |
| `/api/tasks/{taskId}` | DELETE | `vk task delete [id]` |
| `/api/task-attempts` | GET | n/a (use `task_id`-filtered list) |
| `/api/task-attempts?task_id={id}` | GET | `vk attempt list --task ...` |
| `/api/task-attempts/{id}` | GET | `vk attempt show [id]` |
| `/api/task-attempts/{id}` | POST | n/a |
| `/api/task-attempts` | POST | `vk attempt create` |
| `/api/task-attempts/{id}` | PUT | `vk attempt update [id]` |
| `/api/task-attempts/{id}` | DELETE | `vk attempt delete [id]` |
| `/api/task-attempts/{id}/branch-status` | GET | `vk attempt branch-status [id]` |
| `/api/task-attempts/{id}/repos` | GET | `vk attempt repos [id]` |
| `/api/task-attempts/{id}/diff/ws` | GET | n/a |
| `/api/task-attempts/{id}/merge` | POST | `vk attempt merge [id]` |
| `/api/task-attempts/{id}/push` | POST | `vk attempt push [id]` |
| `/api/task-attempts/{id}/push/force` | POST | `vk attempt force-push [id]` |
| `/api/task-attempts/{id}/rebase` | POST | `vk attempt rebase [id]` |
| `/api/task-attempts/{id}/rebase/continue` | POST | n/a |
| `/api/task-attempts/{id}/conflicts/abort` | POST | `vk attempt abort-conflicts [id]` |
| `/api/task-attempts/{id}/pr` | POST | `vk attempt pr [id]` |
| `/api/task-attempts/{id}/pr/attach` | POST | `vk attempt attach-pr [id]` |
| `/api/task-attempts/{id}/pr/comments` | GET | `vk attempt pr-comments [id]` |
| `/api/task-attempts/from-pr` | POST | n/a |
| `/api/task-attempts/{id}/open-editor` | POST | n/a |
| `/api/task-attempts/{id}/first-message` | GET | n/a |
| `/api/task-attempts/{id}/children` | GET | n/a |
| `/api/task-attempts/{id}/change-target-branch` | POST | n/a |
| `/api/task-attempts/{id}/rename-branch` | POST | `vk attempt update [id] --branch ...` |
| `/api/task-attempts/{id}/unlink` | POST | n/a |
| `/api/task-attempts/{id}/link` | POST | n/a |
| `/api/task-attempts/{id}/run-agent-setup` | POST | n/a |
| `/api/task-attempts/{id}/gh-cli-setup` | POST | n/a |
| `/api/task-attempts/{id}/start-dev-server` | POST | n/a |
| `/api/task-attempts/{id}/run-setup-script` | POST | n/a |
| `/api/task-attempts/{id}/run-cleanup-script` | POST | n/a |
| `/api/task-attempts/{id}/run-archive-script` | POST | n/a |
| `/api/task-attempts/{id}/stop` | POST | `vk attempt stop [id]` |
| `/api/task-attempts/{id}/mark-seen` | PUT | n/a |
| `/api/task-attempts/{id}/summary` | POST | n/a |
| `/api/repos` | GET | `vk repository list` |
| `/api/repos/{id}` | GET | `vk repository show [id]` |
| `/api/repos/{id}` | PUT | `vk repository update [id]` |
| `/api/repos` | POST | `vk repository register` |
| `/api/repos/init` | POST | `vk repository init` |
| `/api/repos/{id}/branches` | GET | `vk repository branches [id]` |
| `/api/repos/{id}/remotes` | GET | n/a |
| `/api/repos/recent` | GET | n/a |
| `/api/repos/batch` | POST | n/a |
| `/api/repos/{id}/open-editor` | POST | n/a |
| `/api/repos/{id}/search` | GET | n/a |
| `/api/repos/{id}/prs` | GET | n/a |
| `/api/repos/{repo_id}/remotes` | GET | n/a |
| `/api/sessions` | GET | `vk session list [workspace-id]` |
| `/api/sessions/{sessionId}` | GET | `vk session show <session-id>` |
| `/api/sessions` | POST | n/a |
| `/api/sessions/{sessionId}/follow-up` | POST | `vk attempt follow-up [workspace-id] --message ...` |
| `/api/sessions/{sessionId}/review` | POST | n/a |
| `/api/sessions/{sessionId}/reset` | POST | n/a |
| `/api/sessions/{sessionId}/queue` | POST | n/a |
| `/api/sessions/{sessionId}/queue` | DELETE | n/a |
| `/api/sessions/{sessionId}/queue` | GET | n/a |
| `/api/containers/info` | GET | n/a |
| `/api/containers/attempt-context` | GET | n/a |
| `/api/remote/projects?organization_id={organization_id}` | GET | n/a |
| `/api/organizations` | GET | n/a |

### Remote `/v1` endpoints (cloud service)

| API endpoint | Method | `vk` command |
|---|---:|---|
| `/v1/organizations` | GET | n/a |
| `/v1/organizations` | POST | n/a |
| `/v1/organizations/{org_id}` | GET | n/a |
| `/v1/organizations/{org_id}` | PATCH | n/a |
| `/v1/organizations/{org_id}` | DELETE | n/a |
| `/v1/projects` | GET | n/a |
| `/v1/projects/{project_id}` | GET | n/a |
| `/v1/migration/projects` | POST | n/a |
| `/v1/issues` | POST | n/a |
| `/v1/issues` | GET | n/a |
| `/v1/issues/{issue_id}` | GET | n/a |
| `/v1/issues/{issue_id}` | PATCH | n/a |
| `/v1/issues/{issue_id}` | DELETE | n/a |
| `/v1/issues/bulk` | POST | n/a |
| `/v1/migration/issues` | POST | n/a |
| `/v1/migration/workspaces` | POST | n/a |
| `/v1/billing/webhook` | POST | n/a |
| `/v1/organizations/{org_id}/billing` | GET | n/a |
| `/v1/organizations/{org_id}/billing/portal` | POST | n/a |
| `/v1/organizations/{org_id}/billing/checkout` | POST | n/a |

### Non-API command behavior

- `vk config`: local config read/write only, no API call
- `vk attempt open`: local web UI launch, not an API invocation
- `vk attempt cd`: local shell/SSH behavior, not an API invocation
