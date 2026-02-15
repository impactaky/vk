---
phase: 06-attempt-cd
plan: 01
subsystem: cli
tags: [deno, shell, ssh, localhost-detection, config]

# Dependency graph
requires:
  - phase: 05-attempt-open
    provides: resolveWorkspaceFromBranch utility and browser-based workspace navigation pattern
provides:
  - Shell-based workspace navigation via `vk attempt cd`
  - localhost detection utility for API URL analysis
  - Shell configuration in global vk config
affects: [cli-navigation, workspace-workflows]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Localhost detection pattern for API URL analysis (local vs remote workflows)"
    - "Shell spawn pattern for local workspace navigation"
    - "SSH session pattern for remote workspace navigation"

key-files:
  created:
    - src/utils/localhost.ts
  modified:
    - src/api/config.ts
    - src/commands/config.ts
    - src/commands/attempt.ts

key-decisions:
  - "Use shell field in Config interface for user-configurable shell preference"
  - "Default to bash when shell not configured or SHELL env var not set"
  - "Spawn local subshell for localhost API, SSH session for remote API"
  - "Use exec in SSH command for clean shell exit"

patterns-established:
  - "isLocalhost pattern: URL parsing with hostname checks (localhost, ::1, 127.*, 0.0.0.0)"
  - "Shell spawn pattern: Deno.Command with cwd for interactive subshells"
  - "SSH pattern: ssh -t with cd + exec for remote interactive shells"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 6 Plan 1: Attempt CD Summary

**CLI command for navigating into workspace directories via local subshell or
remote SSH session with configurable shell preference**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-02-01T07:52:34Z
- **Completed:** 2026-02-01T07:54:36Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `vk attempt cd [id]` command for workspace navigation
- Implemented localhost detection utility for API URL analysis
- Added shell configuration to global vk config (set/show)
- Local API spawns subshell in workspace directory
- Remote API opens SSH session with cd to workspace directory

## Task Commits

Each task was committed atomically:

1. **Task 1: Add shell config and isLocalhost utility** - `8cf595c` (feat)
2. **Task 2: Add cd subcommand to attempt command** - `2d23f3a` (feat)

## Files Created/Modified

- `src/utils/localhost.ts` - isLocalhost function for detecting local API URLs
- `src/api/config.ts` - Added shell field to Config interface
- `src/commands/config.ts` - Added shell key to set/show commands
- `src/commands/attempt.ts` - Added cd subcommand with local/remote workflow

## Decisions Made

- Use `shell` field in Config interface for user preference (follows existing
  pattern)
- Default to `$SHELL` env var if config.shell not set, fallback to "bash"
- Detect localhost via URL hostname parsing (localhost, ::1, 127.*, 0.0.0.0)
- Local workflow: spawn subshell with `Deno.Command(shell, { cwd })`
- Remote workflow: SSH with `-t` flag and `exec ${shell}` for clean exit
- Quote workspace path in SSH command for spaces handling

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly following plan specification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Workspace navigation via CLI complete
- Ready for future workspace automation commands
- Pattern established for local vs remote workflow detection
- Shell configuration available for future commands requiring shell interaction

---

_Phase: 06-attempt-cd_ _Completed: 2026-02-01_
