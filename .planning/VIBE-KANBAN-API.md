# Vibe Kanban API (DeepWiki, current snapshot)

Date: 2026-02-19
Source: `DeepWiki` for `BloopAI/vibe-kanban` (repo, indexed 2026-02-14, commit 61c39d) + existing CLI docs/code.

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
- `GET /api/projects/{id}`
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
- `GET /api/tasks/{taskId}/with-relationships`
- `POST /api/tasks/{taskId}/share`

### Task attempts / Workspaces
- `POST /api/task-attempts`
- `GET /api/task-attempts`  (query: `task_id`, `archived`, `limit`)
- `GET /api/task-attempts/count`
- `GET /api/task-attempts/{id}`
- `PUT /api/task-attempts/{id}`
- `DELETE /api/task-attempts/{id}` (query: `delete_branches`)
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
- `GET /api/task-attempts/{id}/pr/comments`  (query: `repo_id`)
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
- `PUT /api/task-attempts/{id}/mark-seen`

### Repositories
- `GET /api/repos`
- `GET /api/repos/recent`
- `GET /api/repos/{repoId}`
- `PUT /api/repos/{repoId}`
- `DELETE /api/repos/{repoId}`
- `POST /api/repos`  (register existing repo)
- `POST /api/repos/init`
- `GET /api/repos/{repoId}/branches`
- `POST /api/repos/batch`
- `POST /api/repos/{repoId}/open-editor`
- `GET /api/repos/{repoId}/search?q={query}&mode={mode}`
- `GET /api/repos/{repoId}/prs?remote={remoteName}`
- `GET /api/repos/{repoId}/remotes`

### Sessions
- `GET /api/sessions`  (query: `workspace_id`)
- `POST /api/sessions`
- `GET /api/sessions/{sessionId}`
- `POST /api/sessions/{sessionId}/follow-up`
- `POST /api/sessions/{sessionId}/review`
- `POST /api/sessions/{sessionId}/reset`
- `POST /api/sessions/{sessionId}/queue`
- `DELETE /api/sessions/{sessionId}/queue`
- `GET /api/sessions/{sessionId}/queue/status`

### Execution Processes
- `GET /api/execution-processes`  (query: `session_id`, `show_soft_deleted`)
- `GET /api/execution-processes/{id}`
- `GET /api/execution-processes/{id}/repo-states`
- `POST /api/execution-processes/{id}/kill`

### Images
- `POST /api/images/upload`
- `GET /api/images/{id}/metadata`
- `DELETE /api/images/{id}`
- `GET /api/images/{id}/proxy/{filename}`

### Approvals
- `GET /api/approvals/pending`
- `POST /api/approvals/{id}/approve`
- `POST /api/approvals/{id}/deny`

### Tags
- `GET /api/tags`  (query: `search`)
- `POST /api/tags`
- `PUT /api/tags/{id}`
- `DELETE /api/tags/{id}`

### Configuration
- `GET /api/config`
- `PUT /api/config`
- `GET /api/system`
- `GET /api/config/executors/mcp-servers`  (query: `executor`)
- `PUT /api/config/executors/mcp-servers`
- `GET /api/config/check-editor`  (query: `editor_type`)
- `GET /api/config/check-agent`  (query: `executor`)

### Scratch
- `GET /api/scratch/{type}`
- `POST /api/scratch`
- `PUT /api/scratch/{id}`
- `DELETE /api/scratch/{id}`

### Workspace Summary
- `POST /api/workspace-summary`

### Filesystem
- `GET /api/filesystem/list`  (query: `path`)

### Containers
- `GET /api/containers/info`
- `GET /api/containers/attempt-context`

### OAuth / Remote Sync
- `GET /api/oauth/status`
- `POST /api/oauth/login/{provider}`
- `POST /api/oauth/logout`
- `GET /api/oauth/token`
- `GET /api/organizations`
- `POST /api/organizations`
- `GET /api/organizations/{id}/members`
- `POST /api/organizations/{id}/invitations`
- `POST /api/migration`

### Misc local routes
- `GET /api/remote/projects?organization_id={organization_id}`

## Local websocket streams
- Workspace diff: `GET /api/task-attempts/{id}/diff/stream` (query: `stats_only`)
- Workspaces updates: `GET /api/task-attempts/stream` (query: `archived`, `limit`)
- Task updates: `GET /api/tasks/stream` (query: `project_id`)
- Execution processes: `GET /api/execution-processes/ws` (query: `session_id`, `show_soft_deleted`)
- Execution process logs: `GET /api/execution-processes/{id}/logs/ws`
- Queued messages: `GET /api/queued-messages/ws`

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

## Key types (from DeepWiki, cross-referenced with ts-rs generated types)

### Workspace
```
id: string
task_id: string
container_ref: string | null
branch: string
agent_working_dir: string | null
setup_completed_at: string | null
created_at: string
updated_at: string
archived: boolean
pinned: boolean
name: string | null
```

### Task
```
id: string
project_id: string
title: string
description: string | null
status: TaskStatus  ("todo" | "inprogress" | "inreview" | "done" | "cancelled")
parent_workspace_id: string | null
created_at: string
updated_at: string
```

### Session
```
id: string
workspace_id: string
executor: string | null
created_at: string
updated_at: string
```

### ExecutionProcess
```
id: string
session_id: string
run_reason: ExecutionProcessRunReason
executor_action: ExecutorAction
status: ExecutionProcessStatus
exit_code: number | null
dropped: boolean
started_at: string
completed_at: string | null
created_at: string
updated_at: string
```

### Repo
```
id: string
path: string
name: string
display_name: string
setup_script: string | null
cleanup_script: string | null
archive_script: string | null
dev_server_script: string | null
default_target_branch: string | null
default_working_dir: string | null
created_at: string
updated_at: string
```

### CreateTaskAttemptBody
```
task_id: string
repos: WorkspaceRepoInput[]
```
Note: `executor_profile_id` is no longer part of workspace creation.
Executors are selected at session/execution level.

### CreateFollowUpAttempt
```
prompt: string
session_id: string
reset_to_message_id: string | null
executor_profile_id: ExecutorProfileId
working_dir: string | null
```

### ExecutorProfileId
```
executor: BaseCodingAgent
variant: string | null
```

### BaseCodingAgent (enum values)
```
CLAUDE_CODE, AMP, GEMINI, CODEX, OPENCODE, CURSOR, QWEN_CODE, COPILOT, DROID
```

### MergeTaskAttemptRequest
```
commit_message: string | null
use_pr: boolean
```

### AttachExistingPrRequest
```
pr_url: string
```

### InitRepoRequest
```
repo_path: string
```

### UpdateRepo
```
display_name: string | null
setup_script: string | null
cleanup_script: string | null
archive_script: string | null
dev_server_script: string | null
default_target_branch: string | null
default_working_dir: string | null
```

### GitBranch
```
name: string
is_local: boolean
```

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
| `/api/tasks/{taskId}/with-relationships` | GET | n/a |
| `/api/tasks/{taskId}/share` | POST | n/a |
| `/api/task-attempts` | GET | n/a (use `task_id`-filtered list) |
| `/api/task-attempts?task_id={id}` | GET | `vk attempt list --task ...` |
| `/api/task-attempts/count` | GET | n/a |
| `/api/task-attempts/{id}` | GET | `vk attempt show [id]` |
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
| `/api/repos` | GET | `vk repository list` |
| `/api/repos/{id}` | GET | `vk repository show [id]` |
| `/api/repos/{id}` | PUT | `vk repository update [id]` |
| `/api/repos/{id}` | DELETE | n/a |
| `/api/repos` | POST | `vk repository register` |
| `/api/repos/init` | POST | `vk repository init` |
| `/api/repos/{id}/branches` | GET | `vk repository branches [id]` |
| `/api/repos/{id}/remotes` | GET | n/a |
| `/api/repos/recent` | GET | n/a |
| `/api/repos/batch` | POST | n/a |
| `/api/repos/{id}/open-editor` | POST | n/a |
| `/api/repos/{id}/search` | GET | n/a |
| `/api/repos/{id}/prs` | GET | n/a |
| `/api/sessions` | GET | `vk session list [workspace-id]` |
| `/api/sessions/{sessionId}` | GET | `vk session show <session-id>` |
| `/api/sessions` | POST | n/a |
| `/api/sessions/{sessionId}/follow-up` | POST | `vk attempt follow-up [workspace-id] --message ...` |
| `/api/sessions/{sessionId}/review` | POST | n/a |
| `/api/sessions/{sessionId}/reset` | POST | n/a |
| `/api/sessions/{sessionId}/queue` | POST | n/a |
| `/api/sessions/{sessionId}/queue` | DELETE | n/a |
| `/api/sessions/{sessionId}/queue/status` | GET | n/a |
| `/api/execution-processes` | GET | n/a |
| `/api/execution-processes/{id}` | GET | n/a |
| `/api/execution-processes/{id}/repo-states` | GET | n/a |
| `/api/execution-processes/{id}/kill` | POST | n/a |
| `/api/images/upload` | POST | n/a |
| `/api/images/{id}/metadata` | GET | n/a |
| `/api/images/{id}` | DELETE | n/a |
| `/api/images/{id}/proxy/{filename}` | GET | n/a |
| `/api/approvals/pending` | GET | n/a |
| `/api/approvals/{id}/approve` | POST | n/a |
| `/api/approvals/{id}/deny` | POST | n/a |
| `/api/tags` | GET | n/a |
| `/api/tags` | POST | n/a |
| `/api/tags/{id}` | PUT | n/a |
| `/api/tags/{id}` | DELETE | n/a |
| `/api/config` | GET | n/a |
| `/api/config` | PUT | n/a |
| `/api/system` | GET | n/a |
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
