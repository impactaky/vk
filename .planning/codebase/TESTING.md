# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework

**Runner:**
- Deno built-in test runner
- Config: `deno.json`

**Assertion Library:**
- `@std/assert`, imported directly in test files such as `src/utils/attempt-resolver_test.ts`, `src/commands/wait_test.ts`, `tests/api_client_test.ts`, and `tests/config_test.ts`

**Run Commands:**
```bash
deno task test              # Run the full test suite with read/write/env/net permissions
deno task test:integration  # Run only files matching tests/*_integration_test.ts with --allow-run enabled
deno task check             # Type-check src/main.ts before or alongside tests
```

## Test File Organization

**Location:**
- Use co-located unit tests beside implementation for isolated helpers and command logic, such as `src/commands/wait_test.ts`, `src/utils/filter_test.ts`, and `src/utils/git_test.ts`.
- Use the top-level `tests/` directory for integration tests and shared helpers, such as `tests/cli_commands_integration_test.ts`, `tests/repository_resolver_integration_test.ts`, and `tests/helpers/test-server.ts`.

**Naming:**
- Name all tests with the Deno `*_test.ts` suffix.
- Add `_integration_` to filenames in `tests/` when they depend on broader flows, process execution, or a live API/server, such as `tests/task_attempts_integration_test.ts`.

**Structure:**
```text
src/
  commands/
    wait.ts
    wait_test.ts
  utils/
    attempt-resolver.ts
    attempt-resolver_test.ts
tests/
  helpers/
    test-server.ts
  api_client_test.ts
  cli_commands_integration_test.ts
  filter_integration_test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { assertEquals, assertRejects } from "@std/assert";
import { getAttemptIdWithAutoDetect } from "./attempt-resolver.ts";

Deno.test("getAttemptIdWithAutoDetect: prefers explicit ID", async () => {
  const id = await getAttemptIdWithAutoDetect({} as ApiClient, "explicit-id", {
    resolveWorkspaceFromBranch: () => Promise.resolve(createWorkspace("ws-1", "feature/x")),
    listWorkspaces: () => Promise.resolve([]),
    selectWorkspace: () => Promise.resolve("unused"),
  });

  assertEquals(id, "explicit-id");
});
```

**Patterns:**
- Use one `Deno.test(...)` per behavior branch, with descriptive names in the format `"functionOrArea: expected behavior"` as seen in `src/utils/attempt-resolver_test.ts`, `src/commands/wait_test.ts`, and `tests/config_test.ts`.
- Keep setup local to each test unless a helper is reused across files. `createWorkspace` in `src/utils/attempt-resolver_test.ts` is a representative local fixture helper.
- Clean up temporary state in `finally` blocks, as in `tests/cli_commands_integration_test.ts` and `tests/config_test.ts`.
- Prefer direct assertions on returned domain objects and error messages rather than snapshot-style testing.

## Mocking

**Framework:** No dedicated mocking library detected

**Patterns:**
```typescript
const id = await getAttemptIdWithAutoDetect({} as ApiClient, undefined, {
  resolveWorkspaceFromBranch: () => Promise.resolve(null),
  listWorkspaces: () => Promise.resolve([
    createWorkspace("ws-1", "feature/a"),
    createWorkspace("ws-2", "feature/b"),
  ]),
  selectWorkspace: (workspaces) => Promise.resolve(workspaces[1].id),
});
```

**What to Mock:**
- Mock external dependencies by passing inline dependency overrides, especially for git, API lookup, and interactive selection. This is the standard pattern in `src/utils/attempt-resolver.ts` and its tests.
- Replace remote APIs with lightweight in-process servers where protocol behavior matters. `tests/api_client_test.ts` uses `Deno.serve(...)` to exercise HTTP fallback behavior.
- Use environment-variable wrappers like `withEnv` in `tests/config_test.ts` to isolate config precedence logic.

**What NOT to Mock:**
- Do not mock pure data transformations such as filtering; `tests/filter_integration_test.ts` passes concrete arrays into `applyFilters`.
- Do not introduce a general-purpose mocking framework unless existing injection seams are insufficient; the current codebase relies on plain functions, temporary files, and local servers instead.

## Fixtures and Factories

**Test Data:**
```typescript
function createWorkspace(id: string, branch: string): Workspace {
  return {
    id,
    task_id: "task-1",
    container_ref: null,
    branch,
    agent_working_dir: null,
    setup_completed_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    archived: false,
    pinned: false,
    name: null,
  };
}
```

**Location:**
- Keep small factories in the test file that uses them, such as `createWorkspace` in `src/utils/attempt-resolver_test.ts`.
- Keep cross-file infrastructure helpers under `tests/helpers/`, currently `tests/helpers/test-server.ts`.
- Use temporary directories and files instead of checked-in fixtures for config tests, as in `tests/config_test.ts` and `tests/cli_commands_integration_test.ts`.

## Coverage

**Requirements:** No enforced coverage threshold detected in `deno.json`

**View Coverage:**
```bash
deno test --coverage=coverage --allow-net --allow-read --allow-write --allow-env
deno coverage coverage
```

## Test Types

**Unit Tests:**
- Cover pure helpers and isolated async logic with injected dependencies. Examples include `src/commands/wait_test.ts`, `src/utils/git_test.ts`, `src/utils/fzf_test.ts`, and `src/utils/attempt-resolver_test.ts`.

**Integration Tests:**
- Exercise cross-module behavior, HTTP interactions, config file persistence, and CLI process execution in `tests/api_client_test.ts`, `tests/cli_commands_integration_test.ts`, `tests/organization_integration_test.ts`, and `tests/task_attempts_integration_test.ts`.
- Integration tests may require `--allow-run` and a reachable backend. `tests/helpers/test-server.ts` polls the configured API health endpoint before running some flows.

**E2E Tests:**
- Not detected as a separate framework. The nearest equivalent is process-level CLI testing in `tests/cli_commands_integration_test.ts` using `new Deno.Command("deno", ...)`.

## Common Patterns

**Async Testing:**
```typescript
Deno.test("waitForBranchNotification resolves when target branch is seen", async () => {
  const branches = (async function* () {
    yield "feature/one";
    yield "feature/two";
    yield "feature/target";
  })();

  await waitForBranchNotification(branches, "feature/target");
});
```

**Error Testing:**
```typescript
await assertRejects(
  () =>
    getAttemptIdWithAutoDetect({} as ApiClient, undefined, {
      resolveWorkspaceFromBranch: () => Promise.resolve(null),
      listWorkspaces: () => Promise.resolve([]),
      selectWorkspace: () => Promise.reject(new Error("should not be called")),
    }),
  Error,
  "Not in a workspace branch. Provide workspace ID.",
);
```

---

*Testing analysis: 2026-03-19*
