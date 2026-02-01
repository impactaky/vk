# Requirements: v1.1 Attempt Workflow Enhancements

## Overview

**Milestone:** v1.1
**Goal:** Add convenience commands for working with attempts — open in browser, cd into workdir, and spin-off to new task.
**Total Requirements:** 16

---

## v1.1 Requirements

### OPEN — Browser Integration

- [x] **OPEN-01**: User can run `vk attempt open [id]` to open workspace in browser
- [x] **OPEN-02**: URL format is `<API_URL>/workspaces/<workspace_id>`
- [x] **OPEN-03**: Supports auto-detect from current branch (like other attempt commands)

### CD — Workdir Navigation

- [ ] **CD-01**: User can run `vk attempt cd [id]` to cd into workspace workdir
- [ ] **CD-02**: If API URL is localhost, print cd command (can't change parent shell)
- [ ] **CD-03**: If API URL is remote, execute `ssh <host> -t "cd <agent_working_dir> && <shell>"`
- [ ] **CD-04**: Shell is configurable via `vk config set remote-shell <shell>` (default: `bash`)
- [ ] **CD-05**: Supports auto-detect from current branch

### SPINOFF — Task Creation from Workspace

- [ ] **SPINOFF-01**: User can run `vk attempt spin-off [id]` to create a new task from workspace
- [ ] **SPINOFF-02**: Prompts for task title (required) if not provided via flag
- [ ] **SPINOFF-03**: Accepts `--title` and `--description` flags
- [ ] **SPINOFF-04**: Creates task with `parent_workspace_id` set to current workspace
- [ ] **SPINOFF-05**: Displays created task ID and confirms parent relationship
- [ ] **SPINOFF-06**: Supports auto-detect from current branch

### TEST — Integration Tests

- [ ] **TEST-01**: Integration test for `attempt spin-off` command (API call with parent_workspace_id)
- [ ] **TEST-02**: Integration test for `config set/get remote-shell`

---

## Future Requirements

None — all requirements scoped to this milestone.

---

## Out of Scope

- Automatic workspace creation after spin-off (user can run `vk attempt create` separately)
- Browser selection (uses system default via `open` command)
- SSH key management (assumes SSH is already configured)

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| OPEN-01 | Phase 5 | Complete |
| OPEN-02 | Phase 5 | Complete |
| OPEN-03 | Phase 5 | Complete |
| CD-01 | Phase 6 | Pending |
| CD-02 | Phase 6 | Pending |
| CD-03 | Phase 6 | Pending |
| CD-04 | Phase 6 | Pending |
| CD-05 | Phase 6 | Pending |
| SPINOFF-01 | Phase 7 | Pending |
| SPINOFF-02 | Phase 7 | Pending |
| SPINOFF-03 | Phase 7 | Pending |
| SPINOFF-04 | Phase 7 | Pending |
| SPINOFF-05 | Phase 7 | Pending |
| SPINOFF-06 | Phase 7 | Pending |
| TEST-01 | Phase 8 | Pending |
| TEST-02 | Phase 8 | Pending |

---
*Created: 2026-02-01*
