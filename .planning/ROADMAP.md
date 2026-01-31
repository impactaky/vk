# Roadmap: vk CLI v1.0 API Alignment

## Overview

This milestone fixes the broken follow-up command and aligns the CLI with the current vibe-kanban backend API. The work progresses from critical bug fixes (follow-up endpoint), through schema corrections (multi-repo support), type alignment (API parity), and finally session command exposure. Each phase builds on the previous, with Phase 1 unblocking the most important interactive workflow.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Critical Fix** - Restore working follow-up command via Sessions API
- [x] **Phase 2: Schema & Type Alignment** - Fix types and commands for multi-repo workspaces
- [ ] **Phase 3: Session Commands** - Expose session management for power users
- [ ] **Phase 4: CLI Client Integration Tests** - Prevent API schema drift with automated tests

## Phase Details

### Phase 1: Critical Fix
**Goal**: Users can send follow-up messages to running workspaces
**Depends on**: Nothing (first phase)
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04, TYPE-02
**Success Criteria** (what must be TRUE):
  1. User can run `vk attempt follow-up` and message reaches the agent
  2. Follow-up automatically resolves the correct session for a workspace
  3. Follow-up request includes required fields (prompt, executor_profile_id)
  4. Session type exists in types.ts with correct fields
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md - Add Session type and API client methods
- [x] 01-02-PLAN.md - Integrate session resolution into follow-up command

### Phase 2: Schema & Type Alignment
**Goal**: All CLI types match current vibe-kanban API schema, multi-repo commands work
**Depends on**: Phase 1
**Requirements**: SCHM-01, SCHM-02, SCHM-03, TYPE-01, TYPE-03, TYPE-04, TYPE-05, TYPE-06, TYPE-07
**Success Criteria** (what must be TRUE):
  1. User can run `vk attempt branch-status` and see status for each repo
  2. User can run `vk attempt pr-comments` with repo_id parameter
  3. User can specify `--repo` flag on multi-repo commands
  4. WorkspaceRepo uses `target_branch` field (not `branch`)
  5. CreateWorkspace uses `repos[]` array (not `base_branch`)
  6. Repo type includes `default_working_dir` field
  7. GitBranch type includes `last_commit_date` field
  8. Task type no longer has deprecated `shared_task_id` field
  9. ExecutionProcess and ExecutionProcessStatus types exist
**Plans**: 1 plan (direct execution)

Plans:
- [x] 02-01: Direct type and command fixes

### Phase 3: Session Commands
**Goal**: Users can view and manage sessions directly
**Depends on**: Phase 2
**Requirements**: SESS-05, SESS-06, SESS-07
**Success Criteria** (what must be TRUE):
  1. User can run `vk session list` to see all sessions for a workspace
  2. User can run `vk session show` to view session details including conversation history
  3. User can specify `--session` flag on `attempt follow-up` to target specific session
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: CLI Client Integration Tests
**Goal**: Automated tests prevent API schema mismatches from shipping
**Depends on**: Phase 2 (tests verify the fixed types)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. Integration tests exist for CLI client methods (createWorkspace, followUp, etc.)
  2. Tests verify `createWorkspace` sends `repos[]` array (not deprecated `base_branch`)
  3. Tests verify `followUp` uses session-based endpoint with correct payload
  4. Tests verify multi-repo commands handle array responses correctly
  5. Tests run against live API (like existing `api_integration_test.ts`)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Fix | 2/2 | ✓ Complete | 2026-01-30 |
| 2. Schema & Type Alignment | 1/1 | ✓ Complete | 2026-01-31 |
| 3. Session Commands | 0/TBD | Ready | - |
| 4. CLI Client Integration Tests | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-30*
*Milestone: v1.0 Align with vibe-kanban API*
