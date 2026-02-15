# CLI Commands Gap Analysis

**Researched:** 2026-01-30 **Confidence:** HIGH **Sources:**

- ENDPOINTS.md research (same directory)
- DeepWiki vibe-kanban documentation
- CLI source code analysis (src/commands/*.ts)
- vibe-kanban releases (https://github.com/BloopAI/vibe-kanban/releases)

---

## Executive Summary

The vk CLI has good coverage of core CRUD operations but has a **critical bug**
in `attempt follow-up` due to API changes. The vibe-kanban API introduced a
Sessions abstraction, and follow-up messages now require session IDs, not
workspace IDs.

| Category      | Commands | Status                                           |
| ------------- | -------- | ------------------------------------------------ |
| Working       | 35+      | Full CRUD for projects, tasks, workspaces, repos |
| Broken        | 1        | `attempt follow-up` (critical)                   |
| Missing       | 8+       | Sessions, execution processes, scripts           |
| Schema Issues | 3        | branch-status, pr-comments, follow-up request    |

---

## CRITICAL: Broken Commands

### `vk attempt follow-up` - BROKEN

**Severity:** P0 - Command fails with current API

**Current Implementation:**

```
CLI: POST /api/task-attempts/{workspace_id}/follow-up
Body: { message: string }
```

**Required Implementation:**

```
API: POST /api/sessions/{session_id}/follow-up
Body: { prompt: string, images?: string[] }
```

**What Changed:**

- vibe-kanban introduced Sessions as a layer between workspaces and execution
- Each workspace can have multiple sessions (conversation threads)
- Follow-ups target a specific session, not the workspace directly
- Request body field changed from `message` to `prompt`
- Added optional `images` field for image attachments

**Fix Approach:**

1. Add `listSessions(workspaceId)` to API client
2. When user runs `attempt follow-up [workspace_id]`:
   - Fetch sessions for workspace
   - Use most recent active session (or prompt user to select)
   - Call `/api/sessions/{session_id}/follow-up`
3. Update request schema to use `prompt` instead of `message`

**CLI Command Changes:**

```bash
# Before (broken)
vk attempt follow-up <workspace_id> --message "Fix the bug"

# After (working)
vk attempt follow-up <workspace_id> --message "Fix the bug"
# Internally: resolves workspace -> session, calls sessions API

# New optional flag for explicit session targeting
vk attempt follow-up --session <session_id> --message "Fix the bug"
```

---

## Commands Needing Schema Fixes

### `vk attempt branch-status` - Schema Mismatch

**Severity:** P1 - May return incorrect data for multi-repo workspaces

**Current:** Expects single object `{ ahead, behind, has_conflicts }` **API
Returns:** Array of `RepoBranchStatus[]` (one per repo)

**Fix:**

- Update response type handling
- Display per-repo status in table format
- Add `--repo <id>` filter option for single repo status

### `vk attempt pr-comments` - Missing Parameter

**Severity:** P1 - May fail for multi-repo workspaces

**Current:** `GET /api/task-attempts/{id}/pr/comments` **API Expects:**
`GET /api/task-attempts/{id}/pr/comments?repo_id={repo_id}`

**Fix:**

- Add `--repo <id>` option (auto-detect for single-repo workspaces)
- Follow same pattern as merge/push/rebase commands

---

## Commands Needing New Parameters

### `vk task create` - Add Image Support

**Current options:**

- `--title`, `--description`, `--from`, `--run`, `--executor`, `--base-branch`

**Missing:**

- `--image <path>` - Attach image to task (can specify multiple times)

**Implementation:**

- Need to upload image first via `/api/images/upload`
- Pass returned `image_ids` in CreateTask request

### `vk attempt create` - Add Repos Parameter

**Current:** Uses `base_branch` to create workspace **API Also Supports:**
`repos` array with per-repo target branches

**Possible addition:**

- `--repo <repo_id>:<target_branch>` - Explicit repo targeting
- Only needed for multi-repo projects with different target branches

---

## New Commands to Add

### P0: Session Commands (Required for follow-up fix)

```bash
# List sessions for a workspace
vk session list --workspace <id>
vk session list  # Auto-detect from current branch

# Show session details
vk session show <session_id>
vk session show  # Auto-detect active session

# Create new session (start new conversation)
vk session create --workspace <id> --executor CLAUDE_CODE:DEFAULT

# Send follow-up (alternative to vk attempt follow-up)
vk session follow-up <session_id> --message "..."
vk session follow-up --message "..."  # Auto-detect session
```

### P1: Execution Process Commands

```bash
# Show running/recent processes
vk process list --session <id>
vk process list  # All processes for current workspace

# Show process details
vk process show <process_id>

# Stop a running process
vk process stop <process_id>
```

### P2: Convenience Commands

```bash
# Atomic create task + workspace + start execution
vk task run --title "..." --executor CLAUDE_CODE:DEFAULT
# Equivalent to: task create + attempt create

# List profiles/agents
vk config agents  # Show available executors and their variants
vk config profiles  # Show configured executor profiles
```

### P3: Script Commands (Nice to Have)

```bash
# Run workspace scripts
vk attempt setup <workspace_id>          # Run setup script
vk attempt cleanup <workspace_id>        # Run cleanup script
vk attempt dev-server <workspace_id>     # Start dev server

# Open in editor
vk attempt open-editor <workspace_id>
vk project open-editor <project_id>
```

---

## Current Command Inventory

### Project Commands (7 total) - WORKING

| Command                    | Status | Notes                |
| -------------------------- | ------ | -------------------- |
| `project list`             | OK     |                      |
| `project show [id]`        | OK     | Auto-detect from git |
| `project create`           | OK     |                      |
| `project update [id]`      | OK     |                      |
| `project delete [id]`      | OK     |                      |
| `project repos [id]`       | OK     | List project repos   |
| `project add-repo [id]`    | OK     |                      |
| `project remove-repo [id]` | OK     |                      |

### Task Commands (6 total) - WORKING

| Command            | Status | Notes                    |
| ------------------ | ------ | ------------------------ |
| `task list`        | OK     | Filters by project       |
| `task show [id]`   | OK     | Auto-detect from branch  |
| `task create`      | OK     | Add `--image` for images |
| `task update [id]` | OK     |                          |
| `task delete [id]` | OK     |                          |
| `task open [id]`   | OK     | Opens in browser         |

### Attempt (Workspace) Commands (17 total)

| Command                        | Status | Priority | Notes                 |
| ------------------------------ | ------ | -------- | --------------------- |
| `attempt list`                 | OK     |          |                       |
| `attempt show [id]`            | OK     |          |                       |
| `attempt create`               | OK     |          |                       |
| `attempt update [id]`          | OK     |          |                       |
| `attempt delete [id]`          | OK     |          |                       |
| `attempt repos [id]`           | OK     |          |                       |
| `attempt merge [id]`           | OK     |          |                       |
| `attempt push [id]`            | OK     |          |                       |
| `attempt force-push [id]`      | OK     |          |                       |
| `attempt rebase [id]`          | OK     |          |                       |
| `attempt stop [id]`            | OK     |          |                       |
| `attempt pr [id]`              | OK     |          |                       |
| `attempt pr-comments [id]`     | FIX    | P1       | Add `--repo` param    |
| `attempt branch-status [id]`   | FIX    | P1       | Handle array response |
| `attempt follow-up [id]`       | BROKEN | P0       | Use sessions API      |
| `attempt abort-conflicts [id]` | OK     |          |                       |
| `attempt attach-pr [id]`       | VERIFY | P2       | Not in API docs       |

### Repository Commands (6 total) - WORKING

| Command                    | Status | Notes                |
| -------------------------- | ------ | -------------------- |
| `repository list`          | OK     |                      |
| `repository show [id]`     | OK     | Auto-detect from git |
| `repository register`      | OK     |                      |
| `repository init`          | OK     |                      |
| `repository update [id]`   | OK     |                      |
| `repository branches [id]` | OK     |                      |

### Config Commands (2 total) - WORKING

| Command                    | Status | Notes                    |
| -------------------------- | ------ | ------------------------ |
| `config show`              | OK     |                          |
| `config set <key> <value>` | OK     | Only `api-url` supported |

---

## Implementation Phases

### Phase 1: Fix Critical Bug (P0)

**Goal:** Make `attempt follow-up` work again

1. **Add Session types** (types.ts)
   ```typescript
   interface Session {
     id: string;
     workspace_id: string;
     executor_profile_id: ExecutorProfileID;
     status: SessionStatus;
     created_at: string;
     updated_at: string;
   }

   type SessionStatus = "Active" | "Completed" | "Failed";

   interface CreateFollowUpAttempt {
     prompt: string;
     images?: string[];
   }
   ```

2. **Add Sessions API methods** (client.ts)
   ```typescript
   listSessions(workspaceId: string): Promise<Session[]>
   getSession(id: string): Promise<Session>
   createSession(workspaceId: string, executorProfileId: ExecutorProfileID): Promise<Session>
   sessionFollowUp(sessionId: string, request: CreateFollowUpAttempt): Promise<ExecutionProcess>
   ```

3. **Update follow-up command** (attempt.ts)
   - Resolve workspace to session
   - Call sessions API
   - Update request schema

**Estimated effort:** 4-6 hours

### Phase 2: Fix Schema Issues (P1)

1. **Fix branch-status response handling**
   - Update type to handle array
   - Show table with repo-by-repo status

2. **Add repo_id to pr-comments**
   - Follow merge/push/rebase pattern
   - Auto-detect for single-repo workspaces

**Estimated effort:** 2-3 hours

### Phase 3: Add Session Commands (P1)

1. **Create session command group** (session.ts)
   - `session list`
   - `session show`
   - `session create`
   - `session follow-up`

2. **Keep `attempt follow-up` as convenience alias**
   - Internally uses session API
   - Backward compatible UX

**Estimated effort:** 3-4 hours

### Phase 4: Nice-to-Haves (P2/P3)

1. Execution process commands
2. Script commands (setup, cleanup, dev-server)
3. Image upload support for tasks
4. `task run` convenience command
5. `config agents` / `config profiles`

**Estimated effort:** 8-12 hours total

---

## Commands NOT Recommended for CLI

These API endpoints exist but are low-value for CLI users:

| Endpoint                             | Reason to Skip                                                        |
| ------------------------------------ | --------------------------------------------------------------------- |
| `/api/projects/:id/open-editor`      | CLI users use their own editor                                        |
| `/api/task-attempts/:id/open-editor` | Same - use `cd $(vk attempt show --json \| jq -r .agent_working_dir)` |
| `/api/projects/:id/search`           | Use native tools (rg, fd, grep)                                       |
| `/api/scratch/*`                     | Draft storage - UI-focused feature                                    |
| `/api/images/*`                      | Complex workflow, better in UI                                        |
| `/api/organizations/*`               | Admin feature, better in UI                                           |
| `/api/auth/*`                        | Currently no auth needed                                              |

---

## Testing Recommendations

### Manual Testing for Fixed Commands

```bash
# Test follow-up (after fix)
vk task create --title "Test follow-up" --run --executor CLAUDE_CODE:DEFAULT
# Wait for workspace creation
vk attempt follow-up --message "Continue working on this"

# Test branch-status with multi-repo
vk attempt branch-status <multi-repo-workspace-id>

# Test pr-comments with repo filter
vk attempt pr-comments <workspace-id> --repo <repo-id>
```

### Integration Test Additions

1. Sessions API CRUD
2. Follow-up through sessions
3. Multi-repo branch status
4. Multi-repo PR comments

---

## Summary: What to Implement

| Priority | Command/Change              | Effort |
| -------- | --------------------------- | ------ |
| P0       | Fix `attempt follow-up`     | 4-6h   |
| P1       | Fix `attempt branch-status` | 1h     |
| P1       | Fix `attempt pr-comments`   | 1h     |
| P1       | Add `session` commands      | 3-4h   |
| P2       | Add `process` commands      | 2-3h   |
| P2       | Verify `attempt attach-pr`  | 0.5h   |
| P3       | Add script commands         | 2-3h   |
| P3       | Add `task run` shortcut     | 1-2h   |

**Total estimated effort for milestone:** 12-18 hours

---

_Research completed: 2026-01-30_ _Cross-references: ENDPOINTS.md for detailed
API coverage_
