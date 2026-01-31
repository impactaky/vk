# Requirements: vk CLI

**Defined:** 2026-01-30
**Core Value:** Developers can efficiently manage vibe-kanban workflows from the command line

## v1.0 Requirements

Requirements for API alignment milestone. Each maps to roadmap phases.

### Sessions API

- [x] **SESS-01**: Fix `attempt follow-up` to call `/api/sessions/{id}/follow-up` instead of broken endpoint
- [x] **SESS-02**: Add Session type definition to `types.ts`
- [x] **SESS-03**: Add Sessions API methods to client (list, get, create, follow-up)
- [x] **SESS-04**: Auto-resolve session from workspace ID for transparent follow-up UX
- [x] **SESS-05**: Add `vk session list` command to view sessions for a workspace
- [x] **SESS-06**: Add `vk session show` command to view session details
- [x] **SESS-07**: Add `--session` flag to `attempt follow-up` for explicit targeting

### Schema Fixes

- [x] **SCHM-01**: Fix `attempt branch-status` to handle array response (one per repo)
- [x] **SCHM-02**: Fix `attempt pr-comments` to include required `repo_id` parameter
- [x] **SCHM-03**: Add `--repo` flag to multi-repo commands (branch-status, pr-comments, merge, push, rebase)

### Type Alignment

- [x] **TYPE-01**: Add missing types: Session, ExecutionProcess, ExecutionProcessStatus, RepoBranchStatus
- [x] **TYPE-02**: Fix FollowUpRequest schema (`message` -> `prompt`, add required fields)
- [x] **TYPE-03**: Fix WorkspaceRepo field (`branch` -> `target_branch`, remove `worktree_path`)
- [x] **TYPE-04**: Update CreateWorkspace to use `repos[]` array instead of `base_branch`
- [x] **TYPE-05**: Add missing fields to Repo type (`default_working_dir`)
- [x] **TYPE-06**: Add missing fields to GitBranch type (`last_commit_date`)
- [x] **TYPE-07**: Remove deprecated Task field (`shared_task_id`)

### CLI Client Integration Tests

- [x] **TEST-01**: Add integration tests for CLI client methods to verify API schema alignment
- [x] **TEST-02**: Test `createWorkspace` sends correct `repos[]` payload (not `base_branch`)
- [x] **TEST-03**: Test `followUp` sends correct session-based request
- [x] **TEST-04**: Test multi-repo commands (branch-status, pr-comments) handle array responses

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Execution Processes

- **EXEC-01**: Add `vk process list` to view execution processes
- **EXEC-02**: Add `vk process show` to view process details
- **EXEC-03**: Add `vk process stop` to stop running process

### Images

- **IMG-01**: Support image upload for tasks
- **IMG-02**: Support image attachment in follow-ups

### Convenience Commands

- **CONV-01**: Add `vk task run` for atomic create+workspace+execute

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| WebSocket streaming | CLI is request/response focused, would need terminal UI |
| Real-time log tailing | Requires persistent connection, complex terminal handling |
| Image upload | Adds file handling complexity, defer to later |
| Tag management | Not critical for core workflow |
| Configuration endpoints | Can use web UI for config |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SESS-01 | Phase 1 | Complete |
| SESS-02 | Phase 1 | Complete |
| SESS-03 | Phase 1 | Complete |
| SESS-04 | Phase 1 | Complete |
| SESS-05 | Phase 3 | Complete |
| SESS-06 | Phase 3 | Complete |
| SESS-07 | Phase 3 | Complete |
| SCHM-01 | Phase 2 | Complete |
| SCHM-02 | Phase 2 | Complete |
| SCHM-03 | Phase 2 | Complete |
| TYPE-01 | Phase 2 | Complete |
| TYPE-02 | Phase 1 | Complete |
| TYPE-03 | Phase 2 | Complete |
| TYPE-04 | Phase 2 | Complete |
| TYPE-05 | Phase 2 | Complete |
| TYPE-06 | Phase 2 | Complete |
| TYPE-07 | Phase 2 | Complete |
| TEST-01 | Phase 4 | Complete |
| TEST-02 | Phase 4 | Complete |
| TEST-03 | Phase 4 | Complete |
| TEST-04 | Phase 4 | Complete |

**Coverage:**
- v1.0 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after roadmap creation*
