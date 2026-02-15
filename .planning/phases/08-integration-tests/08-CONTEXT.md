# Phase 8: Integration Tests — Context

## Decision Summary

| Area       | Decision                                                               |
| ---------- | ---------------------------------------------------------------------- |
| Coverage   | Maximum coverage with static, deterministic scenarios                  |
| Execution  | `docker compose run --rm vk` (already used in CI)                      |
| Test Style | Match existing patterns: Deno test, `@std/assert`, try/finally cleanup |
| Isolation  | Each `docker compose run --rm` provides clean vibe-kanban instance     |
| Test Data  | Tests create their own prerequisite data as needed                     |
| Teardown   | Rely on `--rm` for cleanup — no explicit teardown required             |

## Test Scope

### `vk attempt spin-off` Tests

- **Happy path**: Create task → start attempt → spin-off → verify new task has
  correct `parent_workspace_id`
- **Verify created task**: Check name, status, and fields are correctly derived
  from parent
- **Error case**: Spin-off with no active attempt → verify error output/exit
  code

### `vk config set/get shell` Tests

- **Happy path**: Set shell value → get shell value → verify persistence
- **Error case**: Get key that was never set → verify behavior (error or
  default)
- **Invalid key**: Set/get unknown config key → verify error handling

## Technical Decisions

### CLI Execution via Subprocess

Tests must run CLI commands as subprocesses using `Deno.Command`:

```typescript
const command = new Deno.Command("deno", {
  args: [
    "run",
    "--allow-net",
    "--allow-read",
    "--allow-write",
    "--allow-env",
    "src/main.ts",
    "attempt",
    "spin-off",
  ],
  // ...
});
```

### Docker Compose Update Required

Current `docker-compose.yml` command lacks `--allow-run` for subprocess
execution:

```yaml
# Current
command: deno test --allow-net --allow-read --allow-write --allow-env

# Required for CLI tests
command: deno test --allow-net --allow-read --allow-write --allow-env --allow-run
```

### Test File Location

Create new file: `tests/cli_commands_integration_test.ts`

### Environment

- `VK_API_URL=http://vibe-kanban:3000` already set in compose
- `/shared` volume available for test git repos (required for attempt commands)

## Patterns to Follow

From existing `api_integration_test.ts`:

- Use `apiCall<T>()` helper for direct API verification
- Use `createTestRepoDir()` for git repo setup in `/shared`
- Use try/finally for any manual cleanup needed
- Test naming:
  `Deno.test("CLI: vk attempt spin-off creates task with parent_workspace_id", ...)`

## Out of Scope

- Mocking API failures (static scenarios only)
- Network error simulation
- Performance testing
- Unit tests for individual functions

## Deferred Ideas

(None captured during discussion)
