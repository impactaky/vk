# Roadmap: vk CLI

## Milestones

- [x] **v1.0 MVP** - Phases 1-4 (shipped 2026-01-31)
- [ ] **v1.1 Attempt Workflow Enhancements** - Phases 5-8 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-01-31</summary>

See archived planning documents for v1.0 details.
- Phase 1: Foundation
- Phase 2: Core Features
- Phase 3: API Alignment
- Phase 4: Sessions & Testing

</details>

### v1.1 Attempt Workflow Enhancements (In Progress)

**Milestone Goal:** Add convenience commands for working with attempts — open in browser, cd into workdir, and spin-off to new task.

- [ ] **Phase 5: Attempt Open** - Open workspace in browser
- [ ] **Phase 6: Attempt CD** - Navigate to workspace workdir (local or SSH)
- [ ] **Phase 7: Attempt Spin-Off** - Create child task from workspace
- [ ] **Phase 8: Integration Tests** - Validate spin-off and config commands

## Phase Details

### Phase 5: Attempt Open
**Goal**: User can open any workspace in their browser with a single command
**Depends on**: Phase 4 (v1.0 completion)
**Requirements**: OPEN-01, OPEN-02, OPEN-03
**Success Criteria** (what must be TRUE):
  1. User can run `vk attempt open <id>` and browser opens to workspace URL
  2. User can run `vk attempt open` from a workspace branch and browser opens automatically
  3. URL correctly points to `<API_URL>/workspaces/<workspace_id>`
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Attempt CD
**Goal**: User can navigate directly into a workspace's working directory
**Depends on**: Phase 5
**Requirements**: CD-01, CD-02, CD-03, CD-04, CD-05
**Success Criteria** (what must be TRUE):
  1. User can run `vk attempt cd <id>` to navigate to workspace workdir
  2. For localhost API, command prints `cd <path>` for user to execute
  3. For remote API, command opens SSH session with cd to agent_working_dir
  4. User can configure shell via `vk config set remote-shell <shell>`
  5. User can run `vk attempt cd` from workspace branch for auto-detection
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Attempt Spin-Off
**Goal**: User can create a new task that inherits context from current workspace
**Depends on**: Phase 6
**Requirements**: SPINOFF-01, SPINOFF-02, SPINOFF-03, SPINOFF-04, SPINOFF-05, SPINOFF-06
**Success Criteria** (what must be TRUE):
  1. User can run `vk attempt spin-off <id>` to create a child task
  2. Without --title flag, user is prompted for task title
  3. Created task has parent_workspace_id linking to source workspace
  4. Command displays created task ID and confirms parent relationship
  5. User can run `vk attempt spin-off` from workspace branch for auto-detection
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Integration Tests
**Goal**: Validate spin-off command and config commands work correctly with API
**Depends on**: Phase 7
**Requirements**: TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
  1. Integration test validates `vk attempt spin-off` creates task with correct parent_workspace_id
  2. Integration test validates `vk config set/get remote-shell` persists and retrieves value
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 5 -> 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4 | v1.0 | - | Complete | 2026-01-31 |
| 5. Attempt Open | v1.1 | 0/? | Not started | - |
| 6. Attempt CD | v1.1 | 0/? | Not started | - |
| 7. Attempt Spin-Off | v1.1 | 0/? | Not started | - |
| 8. Integration Tests | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-01*
*Last updated: 2026-02-01*
