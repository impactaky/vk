# Roadmap: vk CLI v1.0 API Alignment

## Overview

This milestone fixes the broken follow-up command and aligns the CLI with the current vibe-kanban backend API. The work progresses from critical bug fixes (follow-up endpoint), through schema corrections (multi-repo support), type alignment (API parity), and finally session command exposure. Each phase builds on the previous, with Phase 1 unblocking the most important interactive workflow.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Critical Fix** - Restore working follow-up command via Sessions API
- [ ] **Phase 2: Schema Corrections** - Fix branch-status and pr-comments for multi-repo workspaces
- [ ] **Phase 3: Type Alignment** - Update remaining types to match current API
- [ ] **Phase 4: Session Commands** - Expose session management for power users

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
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: Schema Corrections
**Goal**: Multi-repo workspace commands work correctly
**Depends on**: Phase 1
**Requirements**: SCHM-01, SCHM-02, SCHM-03, TYPE-01
**Success Criteria** (what must be TRUE):
  1. User can run `vk attempt branch-status` and see status for each repo
  2. User can run `vk attempt pr-comments` with repo_id parameter
  3. User can specify `--repo` flag on multi-repo commands (branch-status, pr-comments, merge, push, rebase)
  4. RepoBranchStatus type exists for proper response typing
**Plans**: 1 plan

Plans:
- [ ] 02-01-PLAN.md - Add RepoBranchStatus type and fix multi-repo commands

### Phase 3: Type Alignment
**Goal**: All CLI types match current vibe-kanban API schema
**Depends on**: Phase 2
**Requirements**: TYPE-03, TYPE-04, TYPE-05, TYPE-06, TYPE-07
**Success Criteria** (what must be TRUE):
  1. WorkspaceRepo uses `target_branch` field (not `branch`)
  2. CreateWorkspace uses `repos[]` array (not `base_branch`)
  3. Repo type includes `default_working_dir` field
  4. GitBranch type includes `last_commit_date` field
  5. Task type no longer has deprecated `shared_task_id` field
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Session Commands
**Goal**: Users can view and manage sessions directly
**Depends on**: Phase 3
**Requirements**: SESS-05, SESS-06, SESS-07
**Success Criteria** (what must be TRUE):
  1. User can run `vk session list` to see all sessions for a workspace
  2. User can run `vk session show` to view session details including conversation history
  3. User can specify `--session` flag on `attempt follow-up` to target specific session
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Fix | 0/TBD | Not started | - |
| 2. Schema Corrections | 0/1 | Ready | - |
| 3. Type Alignment | 0/TBD | Not started | - |
| 4. Session Commands | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-30*
*Milestone: v1.0 Align with vibe-kanban API*
