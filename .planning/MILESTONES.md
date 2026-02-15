# Milestones

## Completed

### v1.0 Align with vibe-kanban API

**Shipped:** 2026-01-31 **Duration:** 2 days (2026-01-30 to 2026-01-31)

**Delivered:**

- Fixed `attempt follow-up` to use sessions API (`/api/sessions/{id}/follow-up`)
- Fixed `task create --run` to use `repos[]` array (not deprecated
  `base_branch`)
- Added session management commands (`vk session list`, `vk session show`)
- Aligned all CLI types with current vibe-kanban API schema
- Added CLI client integration tests to prevent future schema drift

**Stats:**

- Phases: 4
- Plans: 5
- Requirements: 21 (all complete)
- Commits: 6
- Files changed: 11
- Lines: +760/-98

**Archives:**

- [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)
- [v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)

## Current

(None — ready for next milestone)

---

_Last updated: 2026-01-31_
