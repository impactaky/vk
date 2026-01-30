# API Alignment Research Summary

**Project:** vk CLI - vibe-kanban command-line interface
**Milestone:** v1.0 - Align with vibe-kanban API
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

The vk CLI requires significant updates to align with the current vibe-kanban backend API. The most critical issue is that the **follow-up command is completely broken** due to an architectural change in the backend: vibe-kanban now uses a three-tier hierarchy (Workspace -> Session -> ExecutionProcess), and follow-up messages must target Sessions, not Workspaces. The CLI currently calls a non-existent endpoint (`/api/task-attempts/{id}/follow-up`) when it should call `/api/sessions/{id}/follow-up`.

Beyond the critical follow-up bug, research identified 20+ missing API endpoints that the CLI doesn't expose, several type mismatches that could cause runtime errors, and schema differences in existing commands like `branch-status` and `pr-comments`. The Sessions API is entirely absent from the CLI, which blocks not just follow-up functionality but also prevents users from viewing conversation history or managing multiple agent sessions per workspace.

The recommended approach is a phased implementation: first fix the critical follow-up bug by adding the Sessions API, then address schema mismatches, and finally add quality-of-life features. Total estimated effort is 12-18 hours. The research is high-confidence as it's based on DeepWiki official documentation and direct comparison with the API's TypeScript type definitions.

## Key Findings

### From ENDPOINTS.md - API Coverage

The CLI has good coverage of CRUD operations but significant gaps in newer API features.

**Critical Issues:**
- `follow-up` endpoint path is wrong (`/task-attempts/{id}/follow-up` vs `/sessions/{id}/follow-up`)
- Sessions API entirely missing (7 endpoints)
- Execution Processes API entirely missing (3 endpoints)

**Missing API Categories:**
| Category | Endpoints Missing | Impact |
|----------|------------------|--------|
| Sessions | 7 | Blocks follow-up functionality |
| Execution Processes | 3 | Cannot monitor running agents |
| Images | 6 | Cannot attach images to tasks/follow-ups |
| Tags | 4 | No tag management |
| Configuration | 6 | Cannot check agent availability |
| Workspace Scripts | 6 | Cannot run setup/cleanup from CLI |

### From TYPES.md - Type Definitions

**Critical Type Issues:**

1. **FollowUpRequest is wrong**
   - CLI: `{ message: string }`
   - API: `{ prompt: string, executor_profile_id: string, retry_process_id?: string, force_when_dirty?: boolean, perform_git_reset?: boolean }`

2. **Missing Types (must add):**
   - `Session` - Required for follow-up fix
   - `ExecutionProcess` - Required for process monitoring
   - `ExecutionProcessStatus` - Enum for process states
   - `RepoBranchStatus` - Correct branch status response

3. **Type Field Differences:**
   | Type | CLI Field | API Field | Action |
   |------|-----------|-----------|--------|
   | Task | `shared_task_id` | (missing) | REMOVE |
   | WorkspaceRepo | `branch` | `target_branch` | RENAME |
   | WorkspaceRepo | `worktree_path` | (missing) | REMOVE |
   | CreateWorkspace | `base_branch` | `repos[]` | RESTRUCTURE |
   | Repo | (missing) | `default_working_dir` | ADD |
   | GitBranch | (missing) | `last_commit_date` | ADD |

### From SESSIONS.md - Execution Model

**The fundamental architecture change:**

```
Old model (CLI assumes):
  Workspace --> ExecutionProcess

New model (API uses):
  Workspace --> Session --> ExecutionProcess
```

**Sessions are the conversation layer:**
- Each workspace can have multiple sessions (conversation threads)
- Follow-ups target a specific session
- Each session can spawn multiple execution processes
- The CLI must resolve workspace -> session before sending follow-ups

**Recommended CLI approach:**
1. Keep `vk attempt follow-up` working by auto-resolving session internally
2. Add `vk session list` for visibility into sessions
3. Add optional `--session` flag for power users who need explicit targeting

### From COMMANDS.md - Command Status

**Command Status Summary:**

| Status | Count | Commands |
|--------|-------|----------|
| Working | 35+ | All CRUD operations for projects, tasks, workspaces, repos |
| Broken | 1 | `attempt follow-up` (P0 critical) |
| Schema Fix | 3 | `branch-status`, `pr-comments`, `follow-up` request body |
| Missing | 8+ | session, process, script commands |

**Priority Fixes:**
- P0: `attempt follow-up` - broken, must fix
- P1: `attempt branch-status` - returns array, CLI expects object
- P1: `attempt pr-comments` - missing required `repo_id` parameter
- P2: `attempt attach-pr` - not in API docs, needs verification

## Prioritized Issue List

### P0 - Critical (Blocking Functionality)

1. **Fix follow-up endpoint and schema**
   - Change path from `/task-attempts/{id}/follow-up` to `/sessions/{id}/follow-up`
   - Add Sessions API to client
   - Implement session lookup from workspace
   - Update request schema from `{ message }` to `{ prompt, ... }`

### P1 - High Priority (Broken Behavior)

2. **Add Session types and API methods**
   - `listSessions(workspaceId)` - GET `/api/sessions?workspace_id={id}`
   - `getSession(id)` - GET `/api/sessions/{id}`
   - `createSession(workspaceId, executor)` - POST `/api/sessions`
   - `sessionFollowUp(sessionId, prompt, images?)` - POST `/api/sessions/{id}/follow-up`

3. **Fix branch-status array response**
   - API returns `RepoBranchStatus[]`, CLI expects single object
   - Need to handle per-repo status display

4. **Fix pr-comments missing parameter**
   - Add required `repo_id` query parameter
   - Auto-detect for single-repo workspaces

### P2 - Medium Priority (Missing Features)

5. **Add Execution Processes API**
   - Monitor running processes
   - Stop specific processes
   - View execution history

6. **Update CreateWorkspace schema**
   - Remove deprecated `base_branch`
   - Add `repos[]` array for multi-repo support

7. **Add missing type fields**
   - `Repo.default_working_dir`
   - `GitBranch.last_commit_date`
   - `CreateTask.status`, `CreateTask.parent_workspace_id`
   - `CreatePRRequest.target_branch`, `draft`, `repo_id`

### P3 - Low Priority (Nice to Have)

8. **Add session commands**
   - `vk session list` - List sessions for workspace
   - `vk session show` - Show session details

9. **Remove deprecated type fields**
   - `Task.shared_task_id`
   - `WorkspaceRepo.worktree_path`

10. **Add convenience commands**
    - `vk task run` - Atomic create+workspace+run
    - `vk process list` - View execution processes

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Critical Bug Fix

**Rationale:** The follow-up command is the most important interactive feature and it's completely broken. This must be fixed first.

**Delivers:** Working `vk attempt follow-up` command

**Changes Required:**
1. Add Session types to `types.ts`
2. Add Sessions API methods to `client.ts`
3. Update `attempt follow-up` command to:
   - Fetch sessions for workspace
   - Select most recent session
   - Call `/api/sessions/{session_id}/follow-up`
4. Update FollowUpRequest to CreateFollowUpAttempt schema

**Estimated Effort:** 4-6 hours

**Avoids Pitfall:** "Using deprecated endpoints that will be removed"

### Phase 2: Schema Corrections

**Rationale:** These issues cause subtle bugs or failures in multi-repo scenarios. Should be fixed before adding new features.

**Delivers:** Reliable existing commands

**Changes Required:**
1. Fix `branch-status` to handle array response
2. Add `repo_id` parameter to `pr-comments`
3. Update affected type definitions

**Estimated Effort:** 2-3 hours

**Implements:** Correct response handling for multi-repo workspaces

### Phase 3: Type Alignment

**Rationale:** Align all types with current API to prevent runtime mismatches.

**Delivers:** Type-safe API interactions

**Changes Required:**
1. Add missing types (ExecutionProcess, WorkspaceWithStatus, RepoBranchStatus)
2. Update existing types with missing fields
3. Remove deprecated fields
4. Update CreateWorkspace to use `repos[]` instead of `base_branch`

**Estimated Effort:** 3-4 hours

**Uses:** TYPES.md as specification

### Phase 4: Session Commands (Optional)

**Rationale:** Exposes session management for power users. Not strictly required but improves visibility.

**Delivers:** `vk session list`, `vk session show`

**Changes Required:**
1. Create `src/commands/session.ts`
2. Implement list and show commands
3. Add to CLI registration

**Estimated Effort:** 2-3 hours

**Research Flag:** Standard CRUD patterns, no additional research needed

### Phase Ordering Rationale

- **Phase 1 first** because follow-up is a core workflow and completely broken
- **Phase 2 before 3** because schema fixes affect existing users immediately
- **Phase 3 before 4** because type alignment is needed for any new commands
- **Phase 4 optional** because follow-up works via auto-resolution after Phase 1

### Research Flags

**Phases with well-documented patterns (skip research-phase):**
- Phase 1: Sessions API is well-documented in DeepWiki
- Phase 2: Schema changes are clear from API comparison
- Phase 3: Type definitions are authoritative from `shared/types.ts`
- Phase 4: Standard CRUD command patterns

**No additional research needed** - all information is available from this research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Endpoints | HIGH | Verified against DeepWiki API documentation |
| Types | HIGH | Compared against official `shared/types.ts` |
| Sessions | HIGH | Architecture documented in DeepWiki |
| Commands | HIGH | Direct CLI source code analysis |

**Overall Confidence:** HIGH

All research is based on official DeepWiki documentation and the vibe-kanban repository's type definitions. The API structure is well-documented and the type system is auto-generated from Rust via ts-rs, making it authoritative.

### Gaps to Address

1. **Session "active" determination:** Research found sessions can be listed by workspace, but unclear if there's a concept of "active" session. Recommendation: Use most recently created/updated session.

2. **`attach-pr` endpoint:** CLI has this method but it's not in API documentation. Needs verification during implementation - may be deprecated.

3. **Exact Session fields:** Session type is documented but may have additional fields not in DeepWiki. Will be discovered during implementation via actual API responses.

## Cross-Cutting Concerns

### Multi-Repo Support

Multiple commands assume single-repo workspaces but API supports multiple repos per workspace:
- `branch-status` returns array per repo
- `pr-comments` requires `repo_id` parameter
- `merge`, `push`, `rebase` need repo context

**Recommendation:** Add `--repo` flag to affected commands with auto-detect for single-repo workspaces.

### Executor Profile Changes

The API expects `executor_profile_id` in several places where CLI may not collect it:
- `CreateFollowUpAttempt` requires it
- Session creation requires it

**Recommendation:** Use CLI's existing `--executor` flag pattern, default to user's configured profile.

### Image Support

Images can be attached to tasks and follow-ups but CLI has no image handling:
- No upload capability
- No `image_ids` in requests

**Recommendation:** Defer to Phase 4+ as non-critical for v1.0.

## Sources

### Primary (HIGH confidence)
- [DeepWiki BloopAI/vibe-kanban](https://deepwiki.com/BloopAI/vibe-kanban) - API endpoints, data models, architecture
  - /9.1-rest-api-endpoints - Complete endpoint listing
  - /9-api-reference - API structure and conventions
  - /2-architecture-overview - Entity hierarchy (Workspace -> Session -> ExecutionProcess)
  - /4-execution-engine - Session lifecycle

### Secondary (HIGH confidence)
- [GitHub shared/types.ts](https://github.com/BloopAI/vibe-kanban/blob/main/shared/types.ts) - Authoritative TypeScript type definitions
- CLI Source Code - Direct analysis of `src/api/client.ts`, `src/api/types.ts`, `src/commands/*.ts`

---
*Research completed: 2026-01-30*
*Ready for roadmap: yes*
