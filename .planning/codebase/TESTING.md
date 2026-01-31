# Testing Patterns

**Analysis Date:** 2026-01-30

## Test Framework

**Run Tests:**
```bash
docker compose run --rm vk
```
This starts the vibe-kanban server with health checks and runs all tests, matching CI.

**Framework:**
- Deno's built-in test runner via `Deno.test()`
- Assertions from `@std/assert` (JSR)

## Test File Organization

**Location:**
- Unit tests: co-located with source files using `{filename}_test.ts` suffix
- Integration tests: separate `tests/` directory at project root
- Test helpers: `tests/helpers/` subdirectory

**Naming:**
- Unit test files: `src/utils/filter_test.ts`, `src/utils/git_test.ts`, `src/utils/markdown-parser_test.ts`
- Integration test files: `tests/api_integration_test.ts`, `tests/filter_integration_test.ts`, `tests/project_resolver_integration_test.ts`
- Test functions: descriptive strings in `Deno.test()` calls

**Structure:**
```
src/
  utils/
    filter.ts
    filter_test.ts          # Unit tests co-located
    git.ts
    git_test.ts             # Unit tests co-located
tests/
  api_client_test.ts        # Unit tests for API client
  api_integration_test.ts
  filter_integration_test.ts
  executor_parser_test.ts
  repository_resolver_integration_test.ts
  project_resolver_integration_test.ts
  helpers/
    test-server.ts          # Shared test utilities
    test-data.ts            # Test fixtures
```

## Test Structure

**Suite Organization:**
```typescript
// src/utils/filter_test.ts - Simple flat structure
Deno.test("applyFilters - no filters returns all items", () => {
  const items = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const result = applyFilters(items, {});
  assertEquals(result, items);
});

Deno.test("applyFilters - string filter matches exactly", () => {
  // ...
});

// tests/api_integration_test.ts - Named tests with object syntax
Deno.test({
  name: "API: Create, get, update, and delete task attempt",
  fn: async () => {
    // ... test implementation
  },
});
```

**Patterns:**
- Test naming: descriptive string that explains what is being tested
- No test suites/grouping; flat test naming with descriptive prefixes (e.g., "API:", "applyFilters -")
- Setup happens at test start; teardown in try-finally blocks
- Shared test utilities in `tests/helpers/` for server configuration and test data

**Example Setup/Teardown Pattern from `tests/api_integration_test.ts`:**

```typescript
Deno.test("API: Create and delete project", async () => {
  // Create project with minimal required fields (SETUP)
  const createResult = await apiCall<{ id: string; name: string }>(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `test-project-${Date.now()}`,
        repositories: [],
      }),
    },
  );

  assertEquals(createResult.success, true);
  assertExists(createResult.data);
  assertExists(createResult.data.id);

  // Delete the project (TEARDOWN)
  const deleteResult = await apiCall(`/projects/${createResult.data.id}`, {
    method: "DELETE",
  });
  assertEquals(deleteResult.success, true);
});

// Try-finally pattern for guaranteed cleanup
try {
  // test code
} finally {
  // Cleanup project and test directory
  await apiCall(`/projects/${projectId}`, { method: "DELETE" });
  try {
    await Deno.remove(testRepoPath, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}
```

## Assertions

**Common Assertions:**
- `assertEquals(actual, expected)` - strict equality check
- `assertThrows(() => fn())` - expect function to throw
- `assertExists(value)` - check value is not null/undefined
- `assertExists(value, message)` - with custom error message

**Example from `tests/executor_parser_test.ts`:**

```typescript
Deno.test("parseExecutorString - valid format with uppercase", () => {
  const result = parseExecutorString("CLAUDE_CODE:DEFAULT");
  assertEquals(result, { executor: "CLAUDE_CODE", variant: "DEFAULT" });
});

Deno.test("parseExecutorString - invalid executor name", () => {
  assertThrows(
    () => parseExecutorString("custom_executor:standard"),
    Error,
    'Invalid executor name: "custom_executor"',
  );
});
```

## Mocking

**Framework:** No external mocking library used; tests use:
- Raw API calls via `fetch()` for integration tests
- Helper wrapper function `apiCall<T>()` for standardized API testing
- Test server configuration via `tests/helpers/test-server.ts`

**Patterns:**

```typescript
// Raw API call helper (from tests/api_integration_test.ts)
async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  rawText?: string;
}> {
  const response = await fetch(`${config.apiUrl}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  try {
    return await JSON.parse(text);
  } catch {
    return {
      success: false,
      error: text,
      status: response.status,
      rawText: text,
    };
  }
}

// Test accessing private fields with ts-ignore
Deno.test("ApiClient - constructor strips trailing slash", () => {
  const client = new ApiClient("http://localhost:3000/");
  // @ts-ignore - accessing private field for testing
  assertEquals(client.baseUrl, "http://localhost:3000");
});
```

**What to Mock:**
- Do not mock; integration tests use real HTTP calls against test server
- Private fields accessed via `@ts-ignore` comments when needed for testing

**What NOT to Mock:**
- Do not mock external services; tests require real server running
- Do not mock file system operations; use actual `Deno.mkdir()` and `Deno.remove()`

## Fixtures and Factories

**Test Data:**
- Simple inline objects for unit tests (see `src/utils/filter_test.ts`)
- Timestamped unique values for integration tests to avoid conflicts:

```typescript
// From tests/api_integration_test.ts
const createResult = await apiCall<{ id: string; name: string }>(
  "/projects",
  {
    method: "POST",
    body: JSON.stringify({
      name: `test-project-${Date.now()}`,  // Unique by timestamp
      repositories: [],
    }),
  },
);
```

**Location:**
- `tests/helpers/test-data.ts` - Placeholder for shared fixtures (currently minimal usage)
- `tests/helpers/test-server.ts` - Server configuration and waitForServer utility
- Inline in test files for simple test data

**Test Server Helper (`tests/helpers/test-server.ts`):**

```typescript
/**
 * Test configuration loaded from vk config.
 */
export const config = await loadConfig();

/**
 * Wait for the vibe-kanban server to be ready by polling the projects endpoint.
 */
export async function waitForServer(
  apiUrl: string = config.apiUrl,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  // Polls /api/projects until server responds with 200
  // Timeout: 30 seconds by default
}
```

## Coverage

**Requirements:** Not enforced; no coverage configuration in `deno.json`

**View Coverage:**
```bash
deno test --coverage=./coverage/ --allow-net --allow-read --allow-write --allow-env
```

## Test Types

**Unit Tests:**
- Scope: Single utility function or module behavior
- Approach: Direct function invocation with prepared inputs
- Location: Co-located with source files (`*_test.ts`)
- Examples: `src/utils/filter_test.ts`, `src/utils/git_test.ts`
- No setup/teardown; no async operations needed

**Integration Tests:**
- Scope: Full API workflows; project/task/workspace CRUD; git operations
- Approach: HTTP requests to running vibe-kanban server; filesystem operations
- Location: `tests/` directory
- Setup: May create projects, tasks, repositories; cleanup in finally blocks
- Async/await required; network operations needed

**E2E Tests:** Not present in current codebase

## Async Testing

**Pattern:**

```typescript
Deno.test("getRepoBasenameFromPath - valid git repo returns basename", async () => {
  // Use current directory which should be a git repo
  const basename = await getRepoBasenameFromPath(Deno.cwd());
  assertEquals(typeof basename, "string");
});

// Integration test with async setup/teardown
Deno.test({
  name: "API: Create, get, update, and delete task attempt",
  fn: async () => {
    // Create resources
    const testRepoPath = await createTestRepoDir("attempt-repo");
    const projectId = (await apiCall("/projects", { method: "POST", ... })).data.id;

    try {
      // Run test assertions
      assertEquals(createResult.success, true);
    } finally {
      // Cleanup: guaranteed to run
      await apiCall(`/projects/${projectId}`, { method: "DELETE" });
      await Deno.remove(testRepoPath, { recursive: true });
    }
  },
});
```

## Error Testing

**Pattern:**

```typescript
// From tests/executor_parser_test.ts
Deno.test("parseExecutorString - invalid executor name", () => {
  assertThrows(
    () => parseExecutorString("custom_executor:standard"),
    Error,
    'Invalid executor name: "custom_executor"',
  );
});

// Catching errors in integration tests
Deno.test("API: Create, get, and delete task", async () => {
  try {
    // ...operations...
  } finally {
    // Cleanup: delete is expected to succeed
    const deleteResult = await apiCall(`/tasks/${taskId}`, {
      method: "DELETE",
    });
    assertEquals(deleteResult.success, true);

    // Verify task is deleted
    const getDeletedResult = await apiCall(`/tasks/${taskId}`);
    assertEquals(getDeletedResult.success, false);  // Now should fail
  }
});
```

## Permissions

**Test Permissions in `deno.json`:**
- `--allow-net` - Required for API integration tests
- `--allow-read` - Required for file operations and git commands
- `--allow-write` - Required for creating test directories
- `--allow-env` - Required for config loading (VK_API_URL, etc.)
- `--allow-run` - Required only for integration tests (used by git operations)

**Example:**
```bash
deno test --allow-net --allow-read --allow-write --allow-env
deno test --allow-net --allow-read --allow-write --allow-env --allow-run tests/*_integration_test.ts
```

---

*Testing analysis: 2026-01-30*
