# Testing Patterns

**Analysis Date:** 2026-03-17

## Test Framework

**Runner:**
- Deno built-in test runner from Deno 2.x, driven by `deno test`.
- Config: `deno.json`

**Assertion Library:**
- `@std/assert`, imported directly in test files such as `src/utils/filter_test.ts`, `src/commands/wait_test.ts`, and `tests/repository_resolver_integration_test.ts`.

**Run Commands:**
```bash
deno test --allow-net --allow-read --allow-write --allow-env
deno test --allow-net --allow-read --allow-write --allow-env --allow-run tests/*_integration_test.ts
# No watch-mode task is configured in `deno.json`
# No coverage command is configured in `deno.json` or `.github/workflows/ci.yml`
```

## Test File Organization

**Location:**
- Put focused unit tests next to the code under `src/`, using files such as `src/utils/git_test.ts`, `src/utils/attempt-resolver_test.ts`, and `src/commands/wait_test.ts`.
- Put integration-style tests under top-level `tests/`, using files such as `tests/cli_commands_integration_test.ts`, `tests/organization_integration_test.ts`, and `tests/task_attempts_integration_test.ts`.
- Put shared integration helpers under `tests/helpers/`, currently `tests/helpers/test-server.ts`.

**Naming:**
- Use `_test.ts` for unit-style files.
- Use `_integration_test.ts` for server- or CLI-level integration files.
- A small number of broader but still simple tests also use `_test.ts` under `tests/`, for example `tests/api_client_test.ts` and `tests/executor_parser_test.ts`.

**Structure:**
```text
src/**/<module>_test.ts
tests/*_test.ts
tests/*_integration_test.ts
tests/helpers/*.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { assertEquals, assertRejects } from "@std/assert";
import {
  getAttemptIdWithAutoDetect,
  resolveWorkspaceFromBranch,
} from "./attempt-resolver.ts";

Deno.test("resolveWorkspaceFromBranch: returns first workspace for current branch", async () => {
  // setup
  // execute
  // assert
});
```

**Patterns:**
- Use flat `Deno.test(...)` cases instead of nested `describe` blocks, as seen across `src/utils/filter_test.ts` and `tests/organization_integration_test.ts`.
- Encode scenario details directly in the test name using `feature: expected behavior`, for example `getAttemptIdWithAutoDetect: falls back to interactive workspace selection` in `src/utils/attempt-resolver_test.ts`.
- Build data inline inside each test unless multiple cases need reuse; reusable helpers are small local functions such as `createWorkspace` in `src/utils/attempt-resolver_test.ts`.
- Use `try/finally` cleanup for filesystem or server state, as in `tests/cli_commands_integration_test.ts` and `tests/repository_resolver_integration_test.ts`.

## Mocking

**Framework:** None

**Patterns:**
```typescript
const id = await getAttemptIdWithAutoDetect(
  {} as ApiClient,
  undefined,
  {
    resolveWorkspaceFromBranch: () => Promise.resolve(null),
    listWorkspaces: () => Promise.resolve([
      createWorkspace("ws-1", "feature/a"),
      createWorkspace("ws-2", "feature/b"),
    ]),
    selectWorkspace: (workspaces: Workspace[]) =>
      Promise.resolve(workspaces[1].id),
  },
);
```

**What to Mock:**
- Mock dependency edges by passing inline function overrides through `deps` parameters, as in `src/utils/attempt-resolver_test.ts`.
- Use plain object casts such as `{} as ApiClient` when only the type shape is needed.
- Simulate async streams with inline async generators, as in `src/commands/wait_test.ts`.
- Stub external processes indirectly by asserting behavior of pure formatting helpers rather than trying to fake `Deno.Command`, as in `src/utils/fzf_test.ts`.

**What NOT to Mock:**
- Do not mock simple pure helpers like `extractRepoBasename` in `src/utils/git_test.ts` or `applyFilters` in `src/utils/filter_test.ts`; test them with real inputs and exact outputs.
- Integration tests prefer real `fetch`, real CLI invocations through `new Deno.Command("deno", ...)`, real temp directories, and a running server instead of HTTP mocking, as in `tests/task_attempts_integration_test.ts` and `tests/cli_commands_integration_test.ts`.

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
- Keep one-off factories inside the test file that uses them, for example `createWorkspace` in `src/utils/attempt-resolver_test.ts` and `createTestRepo` in `tests/repository_resolver_integration_test.ts`.
- Keep cross-file infrastructure helpers in `tests/helpers/test-server.ts`.
- Most fixtures are plain object literals created inline per test rather than central fixture modules.

## Coverage

**Requirements:** None enforced. No minimum coverage threshold or reporting configuration is present in `deno.json`, `package` metadata, or `.github/workflows/ci.yml`.

**View Coverage:**
```bash
# Not configured in the repository
```

## Test Types

**Unit Tests:**
- Cover pure parsing, filtering, formatting, and small resolver branches in `src/utils/filter_test.ts`, `src/utils/git_test.ts`, `src/utils/fzf_test.ts`, `src/utils/organization-resolver_test.ts`, and `src/commands/wait_test.ts`.
- These tests generally avoid network and external processes, except where the production helper itself checks local environment behavior, such as `getGitRemoteUrlFromPath` in `src/utils/git_test.ts`.

**Integration Tests:**
- Exercise CLI entrypoints via `deno run ... src/main.ts ...` and validate end-to-end output, exit codes, persisted files, and API behavior in `tests/cli_commands_integration_test.ts`, `tests/organization_integration_test.ts`, and `tests/task_attempts_integration_test.ts`.
- Exercise server integration with real HTTP calls to `${config.apiUrl}/api...`, usually through a local `apiCall` helper.
- Some integration tests are resilient to auth or environment differences by accepting `401` or early-returning when endpoints are inaccessible, as in `tests/organization_integration_test.ts` and `tests/task_attempts_integration_test.ts`.

**E2E Tests:**
- No separate browser/UI E2E framework is used.
- Docker-backed integration coverage is triggered through the `integration-test` job in `.github/workflows/ci.yml`, which runs `docker compose run --rm vk`.

## Common Patterns

**Async Testing:**
```typescript
Deno.test("CLI: vk config set/get shell persists value", async () => {
  const setCommand = new Deno.Command("deno", { /* ... */ });
  const setResult = await setCommand.output();
  assertEquals(setResult.code, 0);
});
```
- Use `async` tests directly with awaited `Deno.Command`, `fetch`, file I/O, or resolver calls.

**Error Testing:**
```typescript
await assertRejects(
  () =>
    getAttemptIdWithAutoDetect(
      {} as ApiClient,
      undefined,
      {
        resolveWorkspaceFromBranch: () => Promise.resolve(null),
        listWorkspaces: () => Promise.resolve([]),
        selectWorkspace: () => Promise.reject(new Error("should not be called")),
      },
    ),
  Error,
  "Not in a workspace branch. Provide workspace ID.",
);
```
- Prefer `assertRejects` for async failures and `assertThrows` for sync validation, as seen in `src/commands/wait_test.ts` and `tests/executor_parser_test.ts`.

## CI-Aligned Expectations

- The canonical unit-test command in CI is `deno test --allow-read --allow-write --allow-env src/` from `.github/workflows/ci.yml`.
- Integration coverage is separated into its own job and depends on Docker Compose rather than the unit-test job.
- New unit tests should be safe to run within `src/` without network access unless the production code truly requires otherwise.
- New integration tests should live under `tests/` and assume explicit environment setup through `VK_API_URL`, temp `HOME` directories, and helper loading from `tests/helpers/test-server.ts`.

---

*Testing analysis: 2026-03-17*
