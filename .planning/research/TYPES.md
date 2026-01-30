# Type Definitions Research: vibe-kanban CLI Alignment

**Project:** vk CLI
**Researched:** 2026-01-30
**Overall Confidence:** HIGH (verified via DeepWiki and official GitHub types)

## Executive Summary

The CLI's `src/api/types.ts` has significant gaps compared to the current vibe-kanban API types defined in `shared/types.ts`. Key missing types include **Session**, **ExecutionProcess**, and the complete **CreateFollowUpAttempt** request structure. The follow-up endpoint is currently using a simplified `{ message: string }` type when the API expects a more complex structure with executor profile selection and retry options.

---

## Quality Gate Checklist

- [x] Session type fully documented
- [x] ExecutionProcess type documented
- [x] All field-level differences noted
- [x] New types identified

---

## 1. Session Type (MISSING IN CLI)

The CLI has no Session type. The API defines:

```typescript
interface Session {
  id: string;
  workspace_id: string;
  executor: string | null;
  created_at: string;
  updated_at: string;
}
```

**Impact:** Cannot work with session-based APIs. The follow-up endpoint is session-based (`POST /api/sessions/{id}/follow-up`), but the CLI currently uses workspace-based endpoint.

---

## 2. ExecutionProcess Type (MISSING IN CLI)

The CLI has no ExecutionProcess type. The API defines:

```typescript
interface ExecutionProcess {
  id: string;
  session_id: string;
  run_reason: ExecutionProcessRunReason;
  executor_action: ExecutorAction;
  status: ExecutionProcessStatus;
  exit_code: bigint | null;
  dropped: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

type ExecutionProcessStatus = "running" | "completed" | "failed" | "killed";

type ExecutionProcessRunReason = "setupscript" | "cleanupscript" | "codingagent" | "devserver";
```

**Impact:** Cannot display execution status or query running processes.

---

## 3. FollowUpRequest / CreateFollowUpAttempt (MAJOR MISMATCH)

### CLI Current Definition (INCORRECT)
```typescript
interface FollowUpRequest {
  message: string;
}
```

### API Actual Definition
```typescript
interface CreateFollowUpAttempt {
  prompt: string;                           // Note: "prompt" not "message"
  executor_profile_id: ExecutorProfileId;   // Required executor selection
  retry_process_id: string | null;          // Optional retry of failed process
  force_when_dirty: boolean | null;         // Force even with uncommitted changes
  perform_git_reset: boolean | null;        // Reset git state before follow-up
}
```

**Impact:**
- Field name mismatch (`message` vs `prompt`)
- Missing required `executor_profile_id` field
- Missing optional control flags for advanced follow-up behavior

---

## 4. Task Type Field Differences

### CLI Definition
```typescript
interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  parent_workspace_id: string | null;
  shared_task_id: string | null;            // <-- NOT in API
  created_at: string;
  updated_at: string;
}
```

### API Definition
```typescript
interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  parent_workspace_id: string | null;
  created_at: string;
  updated_at: string;
}
```

**Differences:**
| Field | CLI | API | Action |
|-------|-----|-----|--------|
| `shared_task_id` | Present | **Missing** | REMOVE from CLI |

---

## 5. TaskStatus Enum Differences

### CLI Definition
```typescript
type TaskStatus = "todo" | "inprogress" | "inreview" | "done" | "cancelled";
```

### API Definition
```typescript
type TaskStatus = "todo" | "inprogress" | "inreview" | "done" | "cancelled";
```

**Status:** MATCHES - No changes needed.

---

## 6. CreateTask Field Differences

### CLI Definition
```typescript
interface CreateTask {
  project_id: string;
  title: string;
  description?: string;
  image_ids?: string[] | null;
}
```

### API Definition
```typescript
interface CreateTask {
  project_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;                      // <-- MISSING in CLI
  parent_workspace_id?: string;             // <-- MISSING in CLI
  image_ids?: string[] | null;
}
```

**Differences:**
| Field | CLI | API | Action |
|-------|-----|-----|--------|
| `status` | Missing | Optional | ADD to CLI |
| `parent_workspace_id` | Missing | Optional | ADD to CLI |

---

## 7. Workspace Type Field Differences

### CLI Definition
```typescript
interface Workspace {
  id: string;
  task_id: string;
  container_ref: string | null;
  branch: string;
  agent_working_dir: string | null;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  pinned: boolean;
  name: string | null;
}
```

### API Definition
```typescript
interface Workspace {
  id: string;
  task_id: string;
  container_ref: string | null;
  branch: string;
  agent_working_dir: string | null;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  pinned: boolean;
  name: string | null;
}
```

**Status:** MATCHES - No changes needed.

---

## 8. WorkspaceRepo Type Field Differences

### CLI Definition
```typescript
interface WorkspaceRepo {
  workspace_id: string;
  repo_id: string;
  worktree_path: string | null;
  branch: string;
  created_at: string;
}
```

### API Definition
```typescript
interface WorkspaceRepo {
  id: string;                               // <-- MISSING in CLI
  workspace_id: string;
  repo_id: string;
  target_branch: string;                    // <-- Different name from CLI "branch"
  created_at: string;
  updated_at: string;                       // <-- MISSING in CLI
}
```

**Differences:**
| Field | CLI | API | Action |
|-------|-----|-----|--------|
| `id` | Missing | Present | ADD |
| `worktree_path` | Present | **Missing** | REMOVE (or verify API) |
| `branch` | Present | `target_branch` | RENAME |
| `updated_at` | Missing | Present | ADD |

---

## 9. Repo Type Field Differences

### CLI Definition
```typescript
interface Repo {
  id: string;
  path: string;
  name: string;
  display_name: string;
  setup_script: string | null;
  cleanup_script: string | null;
  copy_files: string | null;
  parallel_setup_script: boolean;
  dev_server_script: string | null;
  default_target_branch: string | null;
  created_at: string;
  updated_at: string;
}
```

### API Definition
```typescript
interface Repo {
  id: string;
  path: string;
  name: string;
  display_name: string;
  setup_script: string | null;
  cleanup_script: string | null;
  copy_files: string | null;
  parallel_setup_script: boolean;
  dev_server_script: string | null;
  default_target_branch: string | null;
  default_working_dir: string | null;       // <-- MISSING in CLI
  created_at: string;
  updated_at: string;
}
```

**Differences:**
| Field | CLI | API | Action |
|-------|-----|-----|--------|
| `default_working_dir` | Missing | Present | ADD |

---

## 10. UpdateRepo Type Field Differences

### CLI Definition
```typescript
interface UpdateRepo {
  display_name?: string | null;
  setup_script?: string | null;
  cleanup_script?: string | null;
  copy_files?: string | null;
  parallel_setup_script?: boolean | null;
  dev_server_script?: string | null;
}
```

### API Definition
```typescript
interface UpdateRepo {
  display_name?: string | null;
  setup_script?: string | null;
  cleanup_script?: string | null;
  copy_files?: string | null;
  parallel_setup_script?: boolean | null;
  dev_server_script?: string | null;
  default_target_branch?: string | null;    // <-- MISSING in CLI
  default_working_dir?: string | null;      // <-- MISSING in CLI
}
```

**Differences:**
| Field | CLI | API | Action |
|-------|-----|-----|--------|
| `default_target_branch` | Missing | Optional | ADD |
| `default_working_dir` | Missing | Optional | ADD |

---

## 11. GitBranch Type Field Differences

### CLI Definition
```typescript
interface GitBranch {
  name: string;
  is_current: boolean;
  is_remote: boolean;
}
```

### API Definition
```typescript
interface GitBranch {
  name: string;
  is_current: boolean;
  is_remote: boolean;
  last_commit_date: string;                 // <-- MISSING in CLI
}
```

**Differences:**
| Field | CLI | API | Action |
|-------|-----|-----|--------|
| `last_commit_date` | Missing | Present | ADD |

---

## 12. CreateWorkspace / CreateTaskAttemptBody Differences

### CLI Definition
```typescript
interface CreateWorkspace {
  task_id: string;
  executor_profile_id: ExecutorProfileID;
  base_branch: string;
}
```

### API Definition
```typescript
interface CreateTaskAttemptBody {
  task_id: string;
  executor_profile_id: ExecutorProfileId;
  repos: WorkspaceRepoInput[];              // <-- MISSING in CLI
}

interface WorkspaceRepoInput {
  repo_id: string;
  target_branch: string;
}
```

**Differences:**
| Field | CLI | API | Action |
|-------|-----|-----|--------|
| `base_branch` | Present | **Missing** | REMOVE (legacy field) |
| `repos` | Missing | Present | ADD (multi-repo support) |

---

## 13. PR-Related Type Differences

### CreatePRRequest - CLI vs API

**CLI Definition:**
```typescript
interface CreatePRRequest {
  title?: string;
  body?: string;
}
```

**API Definition:**
```typescript
interface CreatePrApiRequest {
  title?: string;
  body?: string;
  target_branch?: string;                   // <-- MISSING in CLI
  draft?: boolean;                          // <-- MISSING in CLI
  repo_id?: string;                         // <-- MISSING in CLI
  auto_generate_description?: boolean;      // <-- MISSING in CLI
}
```

**Differences:**
| Field | CLI | API | Action |
|-------|-----|-----|--------|
| `target_branch` | Missing | Optional | ADD |
| `draft` | Missing | Optional | ADD |
| `repo_id` | Missing | Optional | ADD (multi-repo) |
| `auto_generate_description` | Missing | Optional | ADD |

---

## 14. NEW Types to Add (Not Currently in CLI)

### Session Types
```typescript
interface Session {
  id: string;
  workspace_id: string;
  executor: string | null;
  created_at: string;
  updated_at: string;
}
```

### ExecutionProcess Types
```typescript
interface ExecutionProcess {
  id: string;
  session_id: string;
  run_reason: ExecutionProcessRunReason;
  executor_action: ExecutorAction;
  status: ExecutionProcessStatus;
  exit_code: bigint | null;
  dropped: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

type ExecutionProcessStatus = "running" | "completed" | "failed" | "killed";
type ExecutionProcessRunReason = "setupscript" | "cleanupscript" | "codingagent" | "devserver";
```

### ExecutorAction Types (Discriminated Union)
```typescript
type ExecutorAction =
  | { typ: "CodingAgentInitialRequest"; next_action: CodingAgentInitialRequest }
  | { typ: "CodingAgentFollowUpRequest"; next_action: CodingAgentFollowUpRequest }
  | { typ: "ScriptRequest"; next_action: ScriptRequest }
  | { typ: "ReviewRequest"; next_action: ReviewRequest };

interface CodingAgentInitialRequest {
  prompt: string;
  executor_profile_id: ExecutorProfileId;
  working_dir: string | null;
}

interface CodingAgentFollowUpRequest {
  prompt: string;
  session_id: string;
  reset_to_message_id: string | null;
  executor_profile_id: ExecutorProfileId;
  working_dir: string | null;
}

interface ScriptRequest {
  script: string;
  language: "Bash";
  context: "SetupScript" | "CleanupScript" | "DevServer" | "ToolInstallScript";
  working_dir: string | null;
}

interface ReviewRequest {
  executor_profile_id: ExecutorProfileId;
  context: RepoReviewContext[];
  prompt: string | null;
  session_id: string | null;
  working_dir: string | null;
}
```

### WorkspaceWithStatus
```typescript
interface WorkspaceWithStatus extends Workspace {
  is_running: boolean;
  is_errored: boolean;
}
```

### WorkspaceSummary (for list views)
```typescript
interface WorkspaceSummary {
  workspace_id: string;
  latest_session_id: string | null;
  has_pending_approval: boolean;
  files_changed: number;
  lines_added: number;
  lines_removed: number;
  latest_process_completed_at: string | null;
  latest_process_status: ExecutionProcessStatus | null;
  has_running_dev_server: boolean;
  has_unseen_turns: boolean;
  pr_status: MergeStatus | null;
}
```

### RepoBranchStatus (enhanced branch status)
```typescript
interface RepoBranchStatus {
  repo_id: string;
  repo_name: string;
  commits_behind: number;
  commits_ahead: number;
  has_uncommitted_changes: boolean;
  head_oid: string;
  uncommitted_count: number;
  untracked_count: number;
  target_branch_name: string;
  remote_commits_behind: number;
  remote_commits_ahead: number;
  merges: Merge[];
  is_rebase_in_progress: boolean;
  conflict_op: ConflictOp | null;
  conflicted_files: string[];
  is_target_remote: boolean;
}

type ConflictOp = "rebase" | "merge" | "cherry_pick" | "revert";
```

---

## 15. Summary of Required Changes

### Types to ADD (New Files/Sections)

| Type | Priority | Reason |
|------|----------|--------|
| `Session` | HIGH | Follow-up endpoint refactor |
| `ExecutionProcess` | HIGH | Status tracking |
| `ExecutionProcessStatus` | HIGH | Enum for process states |
| `ExecutionProcessRunReason` | HIGH | Enum for process types |
| `ExecutorAction` | MEDIUM | Process action details |
| `WorkspaceWithStatus` | MEDIUM | Enhanced workspace info |
| `WorkspaceSummary` | MEDIUM | Efficient list views |
| `RepoBranchStatus` | MEDIUM | Detailed branch status |

### Types to UPDATE (Field Changes)

| Type | Change | Priority |
|------|--------|----------|
| `FollowUpRequest` | Rename to `CreateFollowUpAttempt`, change `message` to `prompt`, add required fields | **CRITICAL** |
| `Task` | Remove `shared_task_id` | HIGH |
| `CreateTask` | Add `status`, `parent_workspace_id` | MEDIUM |
| `WorkspaceRepo` | Add `id`, `updated_at`, rename `branch` to `target_branch`, remove `worktree_path` | HIGH |
| `Repo` | Add `default_working_dir` | MEDIUM |
| `UpdateRepo` | Add `default_target_branch`, `default_working_dir` | MEDIUM |
| `GitBranch` | Add `last_commit_date` | LOW |
| `CreateWorkspace` | Remove `base_branch`, add `repos` array | HIGH |
| `CreatePRRequest` | Add `target_branch`, `draft`, `repo_id`, `auto_generate_description` | MEDIUM |

### Types to REMOVE

| Type | Reason |
|------|--------|
| `WorkspaceStatus` enum | Not used in current API (status tracking is via ExecutionProcess) |

---

## Sources

- [DeepWiki BloopAI/vibe-kanban](https://deepwiki.com/BloopAI/vibe-kanban) - Data models, API routes
- [GitHub shared/types.ts](https://github.com/BloopAI/vibe-kanban/blob/main/shared/types.ts) - Authoritative type definitions
- [vibe-kanban Documentation](https://www.vibekanban.com/docs) - Official docs

**Confidence Level:** HIGH - Types verified against official GitHub repository `shared/types.ts` which is auto-generated from Rust via ts-rs.
