# Requirements: vk CLI

**Defined:** 2026-01-30
**Core Value:** Developers can efficiently manage vibe-kanban workflows from the command line

## v1.0 Requirements

Requirements for API alignment milestone. Each maps to roadmap phases.

### Sessions API

- [ ] **SESS-01**: Fix `attempt follow-up` to call `/api/sessions/{id}/follow-up` instead of broken endpoint
- [ ] **SESS-02**: Add Session type definition to `types.ts`
- [ ] **SESS-03**: Add Sessions API methods to client (list, get, create, follow-up)
- [ ] **SESS-04**: Auto-resolve session from workspace ID for transparent follow-up UX
- [ ] **SESS-05**: Add `vk session list` command to view sessions for a workspace
- [ ] **SESS-06**: Add `vk session show` command to view session details
- [ ] **SESS-07**: Add `--session` flag to `attempt follow-up` for explicit targeting

### Schema Fixes

- [ ] **SCHM-01**: Fix `attempt branch-status` to handle array response (one per repo)
- [ ] **SCHM-02**: Fix `attempt pr-comments` to include required `repo_id` parameter
- [ ] **SCHM-03**: Add `--repo` flag to multi-repo commands (branch-status, pr-comments, merge, push, rebase)

### Type Alignment

- [ ] **TYPE-01**: Add missing types: Session, ExecutionProcess, ExecutionProcessStatus, RepoBranchStatus
- [ ] **TYPE-02**: Fix FollowUpRequest schema (`message` -> `prompt`, add required fields)
- [ ] **TYPE-03**: Fix WorkspaceRepo field (`branch` -> `target_branch`, remove `worktree_path`)
- [ ] **TYPE-04**: Update CreateWorkspace to use `repos[]` array instead of `base_branch`
- [ ] **TYPE-05**: Add missing fields to Repo type (`default_working_dir`)
- [ ] **TYPE-06**: Add missing fields to GitBranch type (`last_commit_date`)
- [ ] **TYPE-07**: Remove deprecated Task field (`shared_task_id`)

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
| SESS-01 | Phase 1 | Pending |
| SESS-02 | Phase 1 | Pending |
| SESS-03 | Phase 1 | Pending |
| SESS-04 | Phase 1 | Pending |
| SESS-05 | Phase 4 | Pending |
| SESS-06 | Phase 4 | Pending |
| SESS-07 | Phase 4 | Pending |
| SCHM-01 | Phase 2 | Pending |
| SCHM-02 | Phase 2 | Pending |
| SCHM-03 | Phase 2 | Pending |
| TYPE-01 | Phase 2 | Pending |
| TYPE-02 | Phase 1 | Pending |
| TYPE-03 | Phase 3 | Pending |
| TYPE-04 | Phase 3 | Pending |
| TYPE-05 | Phase 3 | Pending |
| TYPE-06 | Phase 3 | Pending |
| TYPE-07 | Phase 3 | Pending |

**Coverage:**
- v1.0 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after roadmap creation*
