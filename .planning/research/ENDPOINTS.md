# API Endpoint Comparison: CLI vs vibe-kanban Backend

**Researched:** 2026-01-30
**Confidence:** HIGH (DeepWiki documentation verified)
**Sources:**
- DeepWiki: https://deepwiki.com/BloopAI/vibe-kanban/9.1-rest-api-endpoints
- DeepWiki: https://deepwiki.com/BloopAI/vibe-kanban/9-api-reference
- CLI Source: `src/api/client.ts`

---

## Summary of Issues

| Category | Count | Severity |
|----------|-------|----------|
| Critical Path Mismatch | 1 | HIGH - breaks follow-up functionality |
| Missing API Endpoints | 20+ | MEDIUM - CLI feature gaps |
| Missing CLI Endpoints | 6 | LOW - CLI has unused API methods |
| Schema Differences | 4 | MEDIUM - may cause runtime errors |

---

## Critical: Endpoint Path Mismatches

### 1. Follow-Up Endpoint (CRITICAL BUG)

| Aspect | CLI Implementation | Actual API |
|--------|-------------------|------------|
| Path | `/api/task-attempts/{id}/follow-up` | `/api/sessions/{id}/follow-up` |
| Resource | task-attempts | sessions |
| Implication | **CLI follow-up is broken** | Requires session ID, not workspace ID |

**CLI Code (client.ts:288-293):**
```typescript
followUp(id: string, request: FollowUpRequest): Promise<void> {
  return this.request<void>(`/task-attempts/${id}/follow-up`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
```

**Correct API:**
```
POST /api/sessions/{session_id}/follow-up
Body: { prompt: string, images?: UUID[] }
Response: ExecutionProcess
```

**Fix Required:**
1. Add Sessions API methods to client
2. Get session_id from workspace (via `/api/sessions?workspace_id={workspace_id}`)
3. Call `/api/sessions/{session_id}/follow-up`

---

## API Endpoints: CLI Coverage Analysis

### Projects API

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/projects` | GET | YES | `listProjects()` - missing from API docs but likely exists |
| `/api/projects/:id` | GET | YES | `getProject()` |
| `/api/projects` | POST | YES | `createProject()` |
| `/api/projects/:id` | PUT | YES | `updateProject()` |
| `/api/projects/:id` | DELETE | YES | `deleteProject()` |
| `/api/projects/:id/repositories` | GET | YES | `listProjectRepos()` |
| `/api/projects/:id/repositories` | POST | YES | `addProjectRepo()` |
| `/api/projects/:id/repositories/:repo_id` | DELETE | YES | `removeProjectRepo()` |
| `/api/projects/:id/open-editor` | POST | **NO** | Missing - opens project in editor |
| `/api/projects/:id/search` | GET | **NO** | Missing - file search in project |
| `/api/projects/:id/link` | POST | **NO** | Missing - link to remote project |
| `/api/projects/:id/link/create` | POST | **NO** | Missing - create remote project |
| `/api/projects/:id/link` | DELETE | **NO** | Missing - unlink remote project |

### Tasks API

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/tasks` | GET | YES | `listTasks()` - uses `?project_id=` query |
| `/api/tasks/:id` | GET | YES | `getTask()` |
| `/api/tasks` | POST | YES | `createTask()` |
| `/api/tasks/:id` | PUT | YES | `updateTask()` |
| `/api/tasks/:id` | DELETE | YES | `deleteTask()` |
| `/api/tasks/create-and-start` | POST | **NO** | Missing - atomic create+workspace+run |
| `/api/tasks/:id/share` | POST | **NO** | Missing - share to organization |

### Workspaces (Task-Attempts) API

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/task-attempts` | GET | YES | `listWorkspaces()` - with `?task_id=` |
| `/api/task-attempts/:id` | GET | YES | `getWorkspace()` |
| `/api/task-attempts` | POST | YES | `createWorkspace()` |
| `/api/task-attempts/:id` | PUT | YES | `updateWorkspace()` |
| `/api/task-attempts/:id` | DELETE | YES | `deleteWorkspace()` |
| `/api/task-attempts/:id/stop` | POST | YES | `stopWorkspace()` |
| `/api/task-attempts/:id/repos` | GET | YES | `getWorkspaceRepos()` |
| `/api/task-attempts/:id/branch-status` | GET | YES | `getBranchStatus()` |
| `/api/task-attempts/:id/merge` | POST | YES | `mergeWorkspace()` |
| `/api/task-attempts/:id/push` | POST | YES | `pushWorkspace()` |
| `/api/task-attempts/:id/push/force` | POST | YES | `forcePushWorkspace()` |
| `/api/task-attempts/:id/rebase` | POST | YES | `rebaseWorkspace()` |
| `/api/task-attempts/:id/rename-branch` | POST | YES | `renameBranch()` |
| `/api/task-attempts/:id/conflicts/abort` | POST | YES | `abortConflicts()` |
| `/api/task-attempts/:id/pr` | POST | YES | `createPR()` |
| `/api/task-attempts/:id/pr/comments` | GET | YES | `getPRComments()` - missing `?repo_id=` param |
| `/api/task-attempts/count` | GET | **NO** | Missing - get workspace count |
| `/api/task-attempts/:id/first-message` | GET | **NO** | Missing - get first message |
| `/api/task-attempts/:id/children` | GET | **NO** | Missing - get subtasks |
| `/api/task-attempts/:id/search` | GET | **NO** | Missing - file search in workspace |
| `/api/task-attempts/:id/mark-seen` | PUT | **NO** | Missing - mark as seen |
| `/api/task-attempts/:id/open-editor` | POST | **NO** | Missing - open in editor |
| `/api/task-attempts/:id/run-agent-setup` | POST | **NO** | Missing - run agent setup scripts |
| `/api/task-attempts/:id/run-setup-script` | POST | **NO** | Missing - run project setup |
| `/api/task-attempts/:id/run-cleanup-script` | POST | **NO** | Missing - run cleanup |
| `/api/task-attempts/:id/start-dev-server` | POST | **NO** | Missing - start dev server |
| `/api/task-attempts/:id/gh-cli-setup` | POST | **NO** | Missing - setup GitHub CLI |
| `/api/task-attempts/:id/change-target-branch` | POST | **NO** | Missing - change target without rebase |

### Sessions API (ENTIRELY MISSING FROM CLI)

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/sessions` | GET | **NO** | List sessions for workspace |
| `/api/sessions/:id` | GET | **NO** | Get session details |
| `/api/sessions` | POST | **NO** | Create new session |
| `/api/sessions/:id/follow-up` | POST | **WRONG** | CLI uses task-attempts path! |
| `/api/sessions/:id/review` | POST | **NO** | Start PR review session |
| `/api/sessions/:id/queue` | GET | **NO** | Get message queue status |
| `/api/sessions/:id/queue` | POST | **NO** | Add to message queue |
| `/api/sessions/:id/queue` | DELETE | **NO** | Clear message queue |

### Execution Processes API (ENTIRELY MISSING FROM CLI)

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/execution-processes/:id` | GET | **NO** | Get process details |
| `/api/execution-processes/:id/stop` | POST | **NO** | Stop process |
| `/api/execution-processes/:id/repo-states` | GET | **NO** | Get repo state snapshots |

### Repositories API

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/repos` | GET | YES | `listRepos()` |
| `/api/repos/:id` | GET | YES | `getRepo()` |
| `/api/repos` | POST | YES | `registerRepo()` |
| `/api/repos/init` | POST | YES | `initRepo()` |
| `/api/repos/:id` | PUT | YES | `updateRepo()` |
| `/api/repos/:id/branches` | GET | YES | `getRepoBranches()` |
| `/api/repos/batch` | POST | **NO** | Missing - batch get repos by IDs |
| `/api/repos/:id/search` | GET | **NO** | Missing - file search in repo |
| `/api/repos/:id/open-editor` | POST | **NO** | Missing - open in editor |

### Configuration API (ENTIRELY MISSING FROM CLI)

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/info` | GET | **NO** | Get system info and config |
| `/api/config` | PUT | **NO** | Save configuration |
| `/api/editors/check-availability` | GET | **NO** | Check editor availability |
| `/api/agents/check-availability` | GET | **NO** | Check agent availability |
| `/api/mcp-config` | GET | **NO** | Get MCP config |
| `/api/mcp-config` | POST | **NO** | Save MCP config |
| `/api/profiles` | GET | **NO** | Get profiles |
| `/api/profiles` | PUT | **NO** | Update profiles |

### Tags API (ENTIRELY MISSING FROM CLI)

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/tags` | GET | **NO** | Search/list tags |
| `/api/tags` | POST | **NO** | Create tag |
| `/api/tags/:id` | PUT | **NO** | Update tag |
| `/api/tags/:id` | DELETE | **NO** | Delete tag |

### Images API (ENTIRELY MISSING FROM CLI)

| Endpoint | Method | CLI Has | Notes |
|----------|--------|---------|-------|
| `/api/images/upload` | POST | **NO** | Upload image |
| `/api/images/task/:task_id/upload` | POST | **NO** | Upload for task |
| `/api/task-attempts/:id/images/upload` | POST | **NO** | Upload for workspace |
| `/api/images/:id` | DELETE | **NO** | Delete image |
| `/api/images/:id/file` | GET | **NO** | Get image file |
| `/api/images/task/:task_id` | GET | **NO** | List task images |

### Other APIs (MISSING FROM CLI)

- **Organizations API** - Full org management (list, create, delete, members, invitations)
- **Approvals API** - Respond to approval requests
- **Auth API** - OAuth handoff, status, logout, token management
- **Scratch API** - Draft storage (draft tasks, follow-ups, workspaces)
- **Filesystem API** - Directory listing, git repo discovery

---

## CLI-Only Methods (No Corresponding API or Deprecated)

| CLI Method | Path | Status |
|------------|------|--------|
| `searchWorkspacesByBranch()` | Client-side filter | Works but inefficient |
| `attachPR()` | `/task-attempts/:id/pr/attach` | **NOT in API docs** - verify if exists |

---

## Schema Differences

### 1. PR Comments - Missing Query Parameter

**CLI:**
```typescript
getPRComments(id: string): Promise<UnifiedPRComment[]> {
  return this.request<UnifiedPRComment[]>(`/task-attempts/${id}/pr/comments`);
}
```

**API Expects:**
```
GET /api/task-attempts/:id/pr/comments?repo_id={repo_id}
```

The `repo_id` query parameter is required for multi-repo workspaces.

### 2. CreateFollowUpAttempt Schema

**CLI Uses:**
```typescript
interface FollowUpRequest {
  message: string;
}
```

**API Expects:**
```typescript
interface CreateFollowUpAttempt {
  prompt: string;     // NOT "message"
  images?: UUID[];    // Optional image attachments
}
```

### 3. Branch Status Response Type

**CLI Expects:**
```typescript
interface BranchStatus {
  ahead: number;
  behind: number;
  has_conflicts: boolean;
}
```

**API Returns:**
```typescript
type RepoBranchStatus[] // Array, not single object
```

The API returns an array of branch statuses (one per repo), CLI expects single object.

### 4. Workspace Repos Response Type

**CLI Expects:**
```typescript
interface WorkspaceRepo {
  workspace_id: string;
  repo_id: string;
  worktree_path: string | null;
  branch: string;
  created_at: string;
}
```

**API Returns:**
```typescript
type RepoWithTargetBranch[] // Different type name, may have different fields
```

---

## Priority Fix List

### P0 - Critical (Blocking Functionality)

1. **Fix follow-up endpoint path**
   - Add Sessions API to client
   - Implement session lookup from workspace
   - Change path from `/task-attempts/{id}/follow-up` to `/sessions/{id}/follow-up`
   - Update request schema from `{ message }` to `{ prompt, images? }`

### P1 - High Priority (Common Use Cases)

2. **Add Sessions API**
   - `listSessions(workspaceId)` - GET `/api/sessions?workspace_id={id}`
   - `getSession(id)` - GET `/api/sessions/{id}`
   - `createSession(workspaceId, executor)` - POST `/api/sessions`
   - `followUp(sessionId, prompt, images?)` - POST `/api/sessions/{id}/follow-up`

3. **Fix PR comments query parameter**
   - Add `repo_id` parameter to `getPRComments()`

4. **Fix branch status response handling**
   - Update to handle array response

### P2 - Medium Priority (Useful Features)

5. **Add create-and-start for tasks**
   - `createAndStartTask()` - POST `/api/tasks/create-and-start`

6. **Add Execution Processes API**
   - Monitor running processes
   - Stop specific processes

7. **Add workspace script endpoints**
   - Run setup/cleanup scripts
   - Start dev server
   - GitHub CLI setup

### P3 - Low Priority (Nice to Have)

8. **Add search endpoints**
   - Project file search
   - Workspace file search
   - Repository file search

9. **Add editor integration**
   - Open project/workspace/repo in editor

10. **Add Configuration API**
    - System info
    - Agent availability checks

---

## Type Additions Needed

```typescript
// Sessions
interface Session {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateSession {
  workspace_id: string;
  executor: string;
}

interface CreateFollowUpAttempt {
  prompt: string;
  images?: string[];
}

// Execution Processes
interface ExecutionProcess {
  id: string;
  session_id: string;
  status: ExecutionProcessStatus;
  run_reason: string;
  dropped: boolean;
  created_at: string;
  updated_at: string;
}

type ExecutionProcessStatus = "Running" | "Completed" | "Failed" | "Interrupted";

// Branch Status (corrected)
interface RepoBranchStatus {
  repo_id: string;
  ahead: number;
  behind: number;
  has_conflicts: boolean;
}
```

---

## Migration Path

### Phase 1: Fix Critical Bug
1. Add Session types to types.ts
2. Add Sessions API methods to client.ts
3. Update follow-up command to use sessions
4. Update FollowUpRequest to CreateFollowUpAttempt

### Phase 2: Schema Corrections
1. Fix branch-status to handle array
2. Add repo_id parameter to PR comments
3. Verify/fix workspace repos response type

### Phase 3: Feature Expansion
1. Add Execution Processes API
2. Add create-and-start task method
3. Add workspace script operations

### Phase 4: Nice-to-Haves
1. Add search endpoints
2. Add editor integration
3. Add config/info endpoints

---

*Research completed: 2026-01-30*
