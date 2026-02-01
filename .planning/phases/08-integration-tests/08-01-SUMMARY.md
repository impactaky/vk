---
phase: 08
plan: 01
subsystem: testing
tags: [integration-tests, cli, deno, subprocess]
requires: [07-01]
provides:
  - CLI command integration tests
  - Spin-off command validation
  - Config persistence validation
affects: []
tech-stack:
  added: []
  patterns:
    - "Deno.Command subprocess execution for CLI testing"
    - "Isolated HOME directory for config tests"
key-files:
  created:
    - tests/cli_commands_integration_test.ts
  modified:
    - docker-compose.yml
decisions:
  - id: TEST-01
    decision: "Test spin-off via subprocess, verify parent_workspace_id via API"
    rationale: "End-to-end validation ensures CLI command works correctly with API"
    date: 2026-02-01
  - id: TEST-02
    decision: "Use isolated HOME directory for config tests"
    rationale: "Prevents test pollution of user's actual config file"
    date: 2026-02-01
metrics:
  duration: 117s
  tasks-completed: 2
  tests-added: 2
  lines-added: 285
completed: 2026-02-01
---

# Phase 08 Plan 01: CLI Commands Integration Tests Summary

**One-liner:** Added integration tests for `vk attempt spin-off` and `vk config set/get shell` using Deno.Command subprocess execution.

## Objective

Add integration tests for CLI commands `vk attempt spin-off` and `vk config set/get shell` to validate v1.1 features work correctly end-to-end with the API, completing TEST-01 and TEST-02 requirements.

## What Was Built

### Test Infrastructure
- **Updated docker-compose.yml:** Added `--allow-run` permission to enable `Deno.Command` subprocess execution in test environment
- **New test file:** Created `tests/cli_commands_integration_test.ts` with two comprehensive CLI integration tests

### Test Coverage

#### Test 1: Spin-off Command (TEST-01)
Validates that `vk attempt spin-off` creates a child task with correct `parent_workspace_id`:
1. Creates test project with repository
2. Creates parent task and workspace (attempt)
3. Executes CLI command: `vk attempt spin-off {workspaceId} --title "..." --message "..."`
4. Parses task ID from output (format: `{id} {title}`)
5. Verifies via API that created task has `parent_workspace_id === workspaceId`
6. Cleans up all test resources

**Pattern:** Uses `Deno.Command` with `.output()` method, piped stdio, and environment variables (`VK_API_URL`, `HOME`)

#### Test 2: Config Command (TEST-02)
Validates that `vk config set/get shell` persists and retrieves configuration:
1. Uses isolated HOME directory (`/tmp/test-home-{timestamp}`) to avoid user config pollution
2. Executes CLI: `vk config set shell zsh`
3. Verifies file: Reads `$HOME/.config/vibe-kanban/vk-config.json` and checks `shell === "zsh"`
4. Executes CLI: `vk config show`
5. Verifies output contains "zsh"
6. Cleans up test HOME directory

**Pattern:** Uses isolated test environment with custom HOME env var to prevent test pollution

### Implementation Patterns

**Subprocess Execution:**
```typescript
const command = new Deno.Command("deno", {
  args: ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-env",
         "src/main.ts", "attempt", "spin-off", workspaceId,
         "--title", "Child task", "--message", "Test message"],
  stdout: "piped",
  stderr: "piped",
  env: {
    VK_API_URL: config.apiUrl,
    HOME: testHome,
  },
});

const { code, stdout, stderr } = await command.output();
const stdoutText = new TextDecoder().decode(stdout);
assertEquals(code, 0, `Command failed: ${new TextDecoder().decode(stderr)}`);
```

**API Verification:**
```typescript
// After CLI creates task via spin-off
const taskResult = await apiCall<{ id: string; parent_workspace_id?: string }>(
  `/tasks/${taskId}`,
);
assertEquals(taskResult.success, true);
assertEquals(taskResult.data?.parent_workspace_id, workspaceId);
```

**Test Cleanup:**
```typescript
try {
  // Test operations
} finally {
  // Cleanup: delete project, remove test directory
  await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  try {
    await Deno.remove(testRepoPath, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

| Decision | Context | Outcome |
|----------|---------|---------|
| Use Deno.Command .output() | Need simple synchronous subprocess execution | Clean pattern with piped stdio and exit code verification |
| Isolated HOME directory | Config tests must not pollute user config | Each test uses unique `/tmp/test-home-{timestamp}` directory |
| Parse output by space index | Spin-off output format is `{id} {title}` | Extract ID as substring before first space |
| Follow existing test patterns | Consistency with api_integration_test.ts | Used same helpers (apiCall, createTestRepoDir), same structure |

## Testing Results

**All tests pass:**
```
running 2 tests from ./tests/cli_commands_integration_test.ts
CLI: vk attempt spin-off creates task with parent_workspace_id ... ok (2s)
CLI: vk config set/get shell persists value ... ok (259ms)
```

**Full suite:** 110 tests passed (including 2 new CLI tests)

## Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `docker-compose.yml` | +1/-1 | Added `--allow-run` permission to vk service test command |
| `tests/cli_commands_integration_test.ts` | +284 | New CLI integration test file with spin-off and config tests |

## Commits

| Hash | Message |
|------|---------|
| 0fb28d1 | chore(08-01): add --allow-run permission for CLI subprocess tests |
| 681134a | test(08-01): add CLI commands integration tests |

## Dependencies Met

**Requires:**
- Phase 07-01 (Attempt spin-off command implementation)

**Provides:**
- CLI integration test infrastructure
- Validation that v1.1 CLI features work end-to-end

## Next Phase Readiness

**Ready for:** Phase 8 completion (all v1.1 features tested)

**No blockers.** Integration tests successfully validate:
- ✓ Spin-off command creates tasks with parent_workspace_id
- ✓ Config command persists and retrieves shell preference
- ✓ CLI subprocess execution pattern established
- ✓ Test infrastructure supports future CLI testing

## Performance

- **Execution time:** 117 seconds (~2 minutes)
- **Tasks completed:** 2/2
- **Tests added:** 2 integration tests
- **Test suite size:** 110 total tests (all passing)

## Lessons Learned

1. **Deno.Command .output() is ideal for CLI testing:** Synchronous, simple, captures stdio and exit codes cleanly
2. **Environment isolation is critical:** Using isolated HOME prevents config test pollution
3. **Subprocess tests are slower:** CLI tests took 2s and 259ms vs <100ms for API-only tests
4. **Following existing patterns accelerates development:** Reusing apiCall and createTestRepoDir helpers made implementation straightforward
