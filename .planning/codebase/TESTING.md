# Testing Patterns

**Analysis Date:** 2026-01-30

## Test Framework

**Runner:**
- Deno's built-in test runner (`Deno.test()`)
- Config: `deno.json` - no separate test config file
- Version: Deno 2.0+

**Assertion Library:**
- `@std/assert` from JSR: `import { assertEquals, assertExists } from "@std/assert"`

**Run Commands:**
```bash
deno task test                     # Run all tests (unit + co-located)
deno task test:integration        # Run integration tests only (*_integration_test.ts)
deno fmt                           # Format test files
deno lint                          # Lint test files
```

**Test execution flags:**
```bash
deno test --allow-net --allow-read --allow-write --allow-env
deno test --allow-net --allow-read --allow-write --allow-env --allow-run tests/*_integration_test.ts
```

## Test File Organization

**Location:**
- **Unit/utility tests:** Co-located with source code
  - `src/utils/filter.ts` → `src/utils/filter_test.ts` (same directory)
  - `src/utils/git.ts` → `src/utils/git_test.ts`
  - `src/utils/project-resolver.ts` → `src/utils/project-resolver_test.ts`

- **Integration tests:** Centralized in `tests/` directory
  - `tests/api_integration_test.ts` - API endpoint tests
  - `tests/api_client_test.ts` - ApiClient class tests
  - `tests/executor_parser_test.ts` - Executor parsing tests
  - `tests/filter_integration_test.ts` - Filter integration
  - `tests/repository_resolver_integration_test.ts` - Repository resolver
  - `tests/project_resolver_integration_test.ts` - Project resolver

**Naming:**
- Unit tests: `{module}_test.ts` (co-located with source)
- Integration tests: `{feature}_integration_test.ts` (in `tests/` directory)

**Test helper files:**
- `tests/helpers/test-server.ts` - Server readiness utilities
- `tests/helpers/test-data.ts` - Shared test fixtures

## Test Structure

**Suite Organization:**
```typescript
// No describe blocks; tests use sequential Deno.test() calls
Deno.test("applyFilters - no filters returns all items", () => {
  const items = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const result = applyFilters(items, {});
  assertEquals(result, items);
});
```

**Patterns:**

- **Setup:** Inline in test function or in helper functions
  ```typescript
  async function createTestRepoDir(suffix: string): Promise<string> {
    const testPath = `${SHARED_TEST_DIR}/test-repo-api-${Date.now()}-${suffix}`;
    await Deno.mkdir(`${testPath}/.git`, { recursive: true });
    return testPath;
  }
  ```

- **Teardown:** Using try/finally blocks for cleanup
  ```typescript
  try {
    // Test code
    await apiCall(`/projects/${projectId}`, { method: "POST", ... });
  } finally {
    // Cleanup
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
  ```

- **Assertion:** Simple assertions with descriptive messages
  ```typescript
  assertEquals(result, items);  // Basic equality
  assertExists(createResult.data);  // Check existence
  assertEquals(listData!.length >= 1, true);  // Custom condition
  ```

## Mocking

**Framework:** None explicit; tests use actual implementations where possible

**Patterns:**

- **No mocking for unit tests:** Direct function calls preferred
  ```typescript
  const result = applyFilters(items, { name: "Frontend" });
  assertEquals(result, [{ id: "1", name: "Frontend" }]);
  ```

- **API mocking via test server:** Integration tests expect real server running
  ```typescript
  const config = await loadConfig();  // Loads actual API URL
  const response = await fetch(`${config.apiUrl}/api/projects`);
  ```

- **Private field access for testing:** Using `// @ts-ignore` when necessary
  ```typescript
  const client = new ApiClient("http://localhost:3000/");
  // @ts-ignore - accessing private field for testing
  assertEquals(client.baseUrl, "http://localhost:3000");
  ```

- **No mocking library used:** Tests verify actual behavior and integrations

**What to Mock:**
- Nothing for unit tests; verify actual implementations
- Time-based operations: use `Date.now()` for unique IDs in tests

**What NOT to Mock:**
- HTTP requests (use real test server in integration tests)
- File system (use real `Deno.mkdir`, `Deno.remove`)
- Business logic functions

## Fixtures and Factories

**Test Data:**
```typescript
// In tests/api_integration_test.ts
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
```

**Dynamic test data:**
```typescript
// Unique test identifiers with timestamps
const projectName = `test-project-${Date.now()}`;
const testRepoPath = `${SHARED_TEST_DIR}/test-repo-api-${Date.now()}-${suffix}`;
```

**Location:**
- Helpers: `tests/helpers/` directory
- Test data factories: Inline in test files using timestamp-based generation
- Shared config: `tests/helpers/test-server.ts` exports `config` object

## Coverage

**Requirements:** Not enforced; no coverage targets configured

**View Coverage:**
- No built-in coverage command in `deno.json`
- Can run with: `deno test --coverage=./coverage`

## Test Types

**Unit Tests:**
- Scope: Individual utility functions in isolation
- Approach: Direct function calls with input/output assertions
- Examples: `filter_test.ts`, `git_test.ts` testing pure functions
- Run with: `deno task test`

**Integration Tests:**
- Scope: API client interactions with a real vibe-kanban server
- Approach: Full CRUD operations via HTTP, verification of side effects
- Naming: `*_integration_test.ts`
- Examples: `api_integration_test.ts` (1330+ lines) testing complete project/task/workspace lifecycle
- Environment: Requires running vibe-kanban server at `VK_API_URL` (default: `http://localhost:3000`)
- Run with: `deno task test:integration`

**E2E Tests:**
- Not used in this codebase
- Integration tests serve as E2E verification

## Common Patterns

**Async Testing:**
```typescript
Deno.test("getGitRemoteUrlFromPath - valid git repo returns URL", async () => {
  const url = await getGitRemoteUrlFromPath(Deno.cwd());
  if (url !== null) {
    assertEquals(typeof url, "string");
    assertEquals(url.length > 0, true);
  }
});
```

**Error Testing:**
```typescript
// Error types verified with instanceof
Deno.test("API: Create and delete project", async () => {
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
});
```

**Generic typed assertions:**
```typescript
// Using generics for type safety in api calls
const result = await apiCall<{ id: string; name: string }>("/projects", {
  method: "POST",
  body: JSON.stringify({...})
});
assertEquals(result.success, true);
assertEquals(result.data?.id, projectId);
```

**Fallback assertions for optional fields:**
```typescript
// When field may not exist or may be null
if (url !== null) {
  assertEquals(typeof url, "string");
  assertEquals(url.length > 0, true);
}
```

**Conditional test skipping:**
```typescript
// Skip tests based on environment
if (projectsResult.data && projectsResult.data.length > 0) {
  const tasksResult = await apiCall<unknown[]>(
    `/tasks?project_id=${projectsResult.data[0].id}`,
  );
  assertEquals(tasksResult.success, true);
}
```

## Server Setup for Integration Tests

**Configuration:**
- Server URL loaded from config: `const config = await loadConfig();`
- Default: `http://localhost:3000`
- Override with `VK_API_URL` environment variable
- Helper: `waitForServer()` polls `/api/projects` until server responds

**Test prerequisites:**
- Docker Compose: `docker-compose.yml` defines vibe-kanban server
- Shared volume: `/shared` directory for test artifacts
- Integration tests create temporary repo directories in `/shared` for testing

**Cleanup:**
- Each test cleans up its own resources (projects, tasks, repos)
- Directories removed with `await Deno.remove(testRepoPath, { recursive: true })`
- Errors in cleanup ignored: `catch { // Ignore cleanup errors }`

---

*Testing analysis: 2026-01-30*
