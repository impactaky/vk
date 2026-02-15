# Phase 8: Integration Tests - Research

**Researched:** 2026-02-01 **Domain:** CLI Integration Testing with Deno
**Confidence:** HIGH

## Summary

Integration testing CLI commands in Deno requires running the CLI as a
subprocess using `Deno.Command` with piped stdio, capturing output and exit
codes. The project already has established patterns in `api_integration_test.ts`
that should be followed: using `@std/assert` for assertions, the `apiCall<T>()`
helper for API verification, and try/finally blocks for cleanup.

The key technical challenge is that tests must execute the CLI binary
(`deno run src/main.ts`) as a subprocess, which requires the `--allow-run`
permission. The docker-compose.yml currently lacks this permission in the test
command, which must be updated.

Tests will validate two specific commands: (1) `vk attempt spin-off` creates a
task with correct `parent_workspace_id` field, and (2) `vk config set/get shell`
persists and retrieves the shell configuration value. Both commands have
well-defined interfaces and success criteria from prior phases.

**Primary recommendation:** Follow existing test patterns, use `Deno.Command`
with `.output()` for simple subprocess execution, and add `--allow-run` to
docker-compose test command.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library      | Version  | Purpose              | Why Standard                                    |
| ------------ | -------- | -------------------- | ----------------------------------------------- |
| Deno test    | Built-in | Test runner          | Native Deno testing framework, already in use   |
| @std/assert  | 1.0.9    | Assertions           | Already imported in deno.json, standard library |
| Deno.Command | Built-in | Subprocess execution | Official Deno API for running CLI commands      |

### Supporting

| Library        | Version            | Purpose                  | When to Use                                      |
| -------------- | ------------------ | ------------------------ | ------------------------------------------------ |
| TextDecoder    | Built-in           | Decode subprocess output | When using `.output()` instead of `.text()`      |
| docker compose | Already configured | Test isolation           | Provides clean vibe-kanban instance per test run |

### Alternatives Considered

| Instead of   | Could Use               | Tradeoff                                                                     |
| ------------ | ----------------------- | ---------------------------------------------------------------------------- |
| Deno.Command | Direct function imports | Command execution allows verification of full CLI flow including arg parsing |
| @std/assert  | @std/expect             | assertEquals is already used throughout codebase                             |
| try/finally  | afterEach hooks         | Existing tests use try/finally, consistency preferred                        |

**Installation:** No new dependencies required. All tools already available.

## Architecture Patterns

### Recommended Project Structure

```
tests/
├── api_integration_test.ts          # Existing API tests (pattern source)
├── cli_commands_integration_test.ts # NEW: CLI command tests
└── helpers/
    └── test-server.ts                # Shared config and helpers
```

### Pattern 1: CLI Subprocess Execution

**What:** Execute CLI commands as subprocesses using `Deno.Command` with
`.output()` method **When to use:** Testing CLI commands end-to-end with exit
codes and output **Example:**

```typescript
// Source: https://docs.deno.com/examples/subprocess_tutorial/
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
  stdout: "piped",
  stderr: "piped",
  env: {
    VK_API_URL: "http://vibe-kanban:3000",
    HOME: Deno.env.get("HOME") || "/tmp", // Required for config file path
  },
});

const { code, stdout, stderr } = await command.output();
const stdoutText = new TextDecoder().decode(stdout);
const stderrText = new TextDecoder().decode(stderr);

assertEquals(code, 0, `Command failed: ${stderrText}`);
```

### Pattern 2: API Verification After CLI Operation

**What:** Use existing `apiCall<T>()` helper to verify CLI commands made correct
API calls **When to use:** Validating CLI commands that mutate state (create
tasks, update config) **Example:**

```typescript
// Source: Existing api_integration_test.ts pattern
// After CLI creates task via spin-off
const task = await apiCall<{ id: string; parent_workspace_id?: string }>(
  `/tasks/${taskId}`,
);
assertEquals(task.success, true);
assertEquals(task.data?.parent_workspace_id, workspaceId);
```

### Pattern 3: Test Data Setup with try/finally

**What:** Create prerequisite data in try block, cleanup in finally **When to
use:** All tests that create API resources **Example:**

```typescript
// Source: Existing api_integration_test.ts pattern
Deno.test("CLI: vk attempt spin-off creates task", async () => {
  const testRepoPath = await createTestRepoDir("spin-off");
  const projectId = /* create project */;

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
});
```

### Pattern 4: Config File Testing

**What:** Test config persistence by setting value, reading file, and using get
command **When to use:** Testing `vk config set/get` commands **Example:**

```typescript
// Set config value via CLI
const setCmd = new Deno.Command("deno", {
  args: [
    "run",
    "--allow-net",
    "--allow-read",
    "--allow-write",
    "--allow-env",
    "src/main.ts",
    "config",
    "set",
    "shell",
    "zsh",
  ],
  // ...
});
await setCmd.output();

// Verify file was updated
const configPath = join(
  Deno.env.get("HOME") || "/tmp",
  ".config",
  "vibe-kanban",
  "vk-config.json",
);
const configContent = await Deno.readTextFile(configPath);
const config = JSON.parse(configContent);
assertEquals(config.shell, "zsh");

// Verify get command retrieves value
const getCmd = new Deno.Command("deno", {
  args: [
    "run",
    "--allow-net",
    "--allow-read",
    "--allow-write",
    "--allow-env",
    "src/main.ts",
    "config",
    "get",
    "shell",
  ],
  // ...
});
const { stdout } = await getCmd.output();
const output = new TextDecoder().decode(stdout);
assert(output.includes("zsh"));
```

### Anti-Patterns to Avoid

- **Using `spawn()` for simple tests:** Use `.output()` unless you need
  real-time streaming. Spawn requires manual stream handling and status waiting.
- **Not setting HOME env var:** Config commands use
  `$HOME/.config/vibe-kanban/vk-config.json`. Tests must set HOME to avoid
  polluting user config.
- **Forgetting VK_API_URL env var:** CLI commands use this to connect to API.
  Must be set to `http://vibe-kanban:3000` in test environment.
- **Not piping stdio:** If stdout/stderr aren't piped, accessing them throws
  TypeError. Always set `stdout: "piped"` and `stderr: "piped"`.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                    | Don't Build               | Use Instead                                            | Why                                              |
| -------------------------- | ------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Decoding subprocess output | Manual byte manipulation  | `new TextDecoder().decode(output)` or `.text()` method | Handles UTF-8 encoding, newlines, special chars  |
| Test cleanup               | Manual delete calls       | try/finally pattern from existing tests                | Ensures cleanup happens even on test failure     |
| API verification           | Manual fetch calls        | Existing `apiCall<T>()` helper                         | Consistent error handling, typed responses       |
| Git repo setup             | Ad-hoc directory creation | Existing `createTestRepoDir()` helper                  | Creates .git folder, unique paths, cleanup-ready |

**Key insight:** The project already has battle-tested patterns for API
integration tests. CLI tests should follow the same structure and use the same
helpers where applicable.

## Common Pitfalls

### Pitfall 1: Missing --allow-run Permission

**What goes wrong:** `Deno.Command` throws permission error when trying to spawn
subprocess **Why it happens:** Test command in docker-compose.yml lacks
`--allow-run` flag **How to avoid:** Update docker-compose.yml command to
include `--allow-run` **Warning signs:** Error message "Requires run access"
when test attempts subprocess

### Pitfall 2: Environment Variable Pollution

**What goes wrong:** Tests modify user's real config file instead of
test-specific location **Why it happens:** HOME env var points to user's home
directory, config saves to `$HOME/.config/vibe-kanban/` **How to avoid:** Set
HOME to test-specific directory in subprocess env (e.g.,
`/tmp/test-home-${Date.now()}`) **Warning signs:** Actual user config file being
modified during test runs

### Pitfall 3: Async Races in Subprocess Execution

**What goes wrong:** Reading stdout/stderr before process completes, getting
partial output **Why it happens:** Not awaiting both stream reads and status
**How to avoid:** Use `.output()` which handles this automatically, or await
both `process.status` and stream reads **Warning signs:** Intermittent test
failures, empty output when command succeeds

### Pitfall 4: Forgetting to Decode Output

**What goes wrong:** Comparing Uint8Array to string fails silently **Why it
happens:** `.output()` returns `stdout` and `stderr` as Uint8Array, not strings
**How to avoid:** Always decode: `new TextDecoder().decode(stdout)` or use
`.text()` method on spawned process streams **Warning signs:** Assertion
failures when output looks correct in debugger

### Pitfall 5: Not Checking Exit Codes

**What goes wrong:** Test passes even when CLI command fails **Why it happens:**
Only checking stdout, not verifying `code === 0` **How to avoid:** Always assert
on exit code: `assertEquals(code, 0,`Command failed: ${stderrText}`)` **Warning
signs:** False positive tests that claim success despite errors in stderr

### Pitfall 6: Config Get Command Output Parsing

**What goes wrong:** Trying to parse human-readable output as structured data
**Why it happens:** `vk config show` prints "Shell: zsh" not just "zsh" **How to
avoid:** Use string matching (`assert(output.includes("zsh"))`) or parse the
specific line format **Warning signs:** Tests fail because output includes
labels/formatting

## Code Examples

Verified patterns from official sources and existing codebase:

### Basic CLI Subprocess Execution

```typescript
// Source: https://docs.deno.com/examples/subprocess_tutorial/
const command = new Deno.Command("deno", {
  args: [
    "run",
    "--allow-net",
    "--allow-read",
    "--allow-write",
    "--allow-env",
    "src/main.ts",
    "config",
    "set",
    "shell",
    "zsh",
  ],
  stdout: "piped",
  stderr: "piped",
  env: {
    VK_API_URL: "http://vibe-kanban:3000",
    HOME: "/tmp/test-home",
  },
});

const { code, stdout, stderr } = await command.output();
const stdoutText = new TextDecoder().decode(stdout);
const stderrText = new TextDecoder().decode(stderr);

assertEquals(code, 0, `Command failed with code ${code}: ${stderrText}`);
```

### Test with API Verification (spin-off pattern)

```typescript
// Source: Existing api_integration_test.ts and phase context
Deno.test("CLI: vk attempt spin-off creates task with parent_workspace_id", async () => {
  const testRepoPath = await createTestRepoDir("spin-off");

  // Create project with repo
  const projectResult = await apiCall<{ id: string }>("/projects", {
    method: "POST",
    body: JSON.stringify({
      name: `test-project-${Date.now()}`,
      repositories: [],
    }),
  });
  assertEquals(projectResult.success, true);
  const projectId = projectResult.data!.id;

  try {
    // Add repo, create task, create workspace (attempt)
    // ... setup code ...

    // Execute CLI spin-off command
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
        workspaceId,
        "--title",
        "Spun off task",
        "--message",
        "Test spin-off",
      ],
      stdout: "piped",
      stderr: "piped",
      env: { VK_API_URL: "http://vibe-kanban:3000", HOME: "/tmp/test-home" },
    });

    const { code, stdout, stderr } = await command.output();
    const stdoutText = new TextDecoder().decode(stdout);

    assertEquals(
      code,
      0,
      `Spin-off failed: ${new TextDecoder().decode(stderr)}`,
    );

    // Parse task ID from output (format: "{id} {title}")
    const taskId = stdoutText.trim().split(" ")[0];

    // Verify task was created with correct parent_workspace_id
    const taskResult = await apiCall<
      { id: string; parent_workspace_id?: string }
    >(
      `/tasks/${taskId}`,
    );
    assertEquals(taskResult.success, true);
    assertEquals(taskResult.data?.parent_workspace_id, workspaceId);
  } finally {
    await apiCall(`/projects/${projectId}`, { method: "DELETE" });
    try {
      await Deno.remove(testRepoPath, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});
```

### Config Persistence Test

```typescript
// Source: Phase context and Deno config.ts patterns
Deno.test("CLI: vk config set/get shell persists value", async () => {
  const testHome = `/tmp/test-home-${Date.now()}`;
  const configPath = join(testHome, ".config", "vibe-kanban", "vk-config.json");

  try {
    // Set shell config
    const setCmd = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "config",
        "set",
        "shell",
        "zsh",
      ],
      stdout: "piped",
      stderr: "piped",
      env: { VK_API_URL: "http://vibe-kanban:3000", HOME: testHome },
    });

    const setResult = await setCmd.output();
    assertEquals(setResult.code, 0, "Config set failed");

    // Verify file persisted
    const configContent = await Deno.readTextFile(configPath);
    const config = JSON.parse(configContent);
    assertEquals(config.shell, "zsh");

    // Verify get retrieves value
    const getCmd = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "config",
        "show",
      ],
      stdout: "piped",
      stderr: "piped",
      env: { VK_API_URL: "http://vibe-kanban:3000", HOME: testHome },
    });

    const getResult = await getCmd.output();
    const output = new TextDecoder().decode(getResult.stdout);

    assertEquals(getResult.code, 0, "Config show failed");
    assert(output.includes("zsh"), `Expected shell 'zsh' in output: ${output}`);
  } finally {
    // Cleanup test home directory
    try {
      await Deno.remove(testHome, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});
```

### Error Case Testing

```typescript
// Source: Phase context - error case requirement
Deno.test("CLI: vk attempt spin-off with no active attempt shows error", async () => {
  // Execute spin-off without workspace ID (should fail)
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
    stdout: "piped",
    stderr: "piped",
    env: { VK_API_URL: "http://vibe-kanban:3000", HOME: "/tmp/test-home" },
    cwd: "/tmp", // Not in a git repo, no branch to detect
  });

  const { code, stderr } = await command.output();
  const stderrText = new TextDecoder().decode(stderr);

  // Should exit with non-zero code
  assertNotEquals(code, 0, "Expected command to fail");

  // Should have helpful error message
  assert(
    stderrText.includes("workspace") || stderrText.includes("branch"),
    `Expected error about workspace/branch, got: ${stderrText}`,
  );
});
```

## State of the Art

| Old Approach          | Current Approach             | When Changed | Impact                                                                 |
| --------------------- | ---------------------------- | ------------ | ---------------------------------------------------------------------- |
| Deno.run (deprecated) | Deno.Command                 | Deno 1.21+   | Command API is more ergonomic, uses `.output()` and `.spawn()` methods |
| Manual stream reading | .text() and .bytes() methods | Deno 1.21+   | Convenience methods simplify common patterns                           |
| @std/testing/asserts  | @std/assert                  | 2024         | Package renamed, same functionality                                    |

**Deprecated/outdated:**

- `Deno.run()`: Removed in favor of `Deno.Command` API
- Importing from `https://deno.land/std@0.x`: Use JSR imports `jsr:@std/assert`
  or import map entries

## Open Questions

Things that couldn't be fully resolved:

1. **Config "get" vs "show" command**
   - What we know: Current code has `config show` command that displays all
     config
   - What's unclear: Phase context mentions "get" but implementation has "show"
   - Recommendation: Use `config show` in tests, or verify if a separate
     `get <key>` subcommand exists

2. **Error message format for invalid config keys**
   - What we know: `config set` validates key names and exits with code 1
   - What's unclear: Exact error message text for assertions
   - Recommendation: Run command to capture actual error text, or use partial
     match (e.g., `includes("Unknown")`)

3. **Spin-off output format parsing**
   - What we know: Output is "{id} {title}" format per CONTEXT.md decision
   - What's unclear: Whether title might contain spaces (affects simple split)
   - Recommendation: Parse ID as first token up to first space, rest is title

## Sources

### Primary (HIGH confidence)

- [Deno subprocess tutorial](https://docs.deno.com/examples/subprocess_tutorial/) -
  Command API patterns
- [Deno testing fundamentals](https://docs.deno.com/runtime/fundamentals/testing/) -
  Test lifecycle, best practices
- [Deno.Command API docs](https://docs.deno.com/api/deno/~/Deno.Command) -
  Subprocess execution methods
- [@std/assert documentation](https://docs.deno.com/runtime/reference/std/assert/) -
  Assertion functions
- Existing `api_integration_test.ts` - Project-specific patterns
- Phase 8 CONTEXT.md - Test requirements and decisions

### Secondary (MEDIUM confidence)

- [Deno CI documentation](https://docs.deno.com/runtime/reference/continuous_integration/) -
  Permission best practices for tests
- [Deno manual subprocess examples](https://deno.land/manual/examples/subprocess) -
  Historical context for Command API

### Tertiary (LOW confidence)

- None - all findings verified with authoritative sources

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All tools already in use, official Deno APIs
- Architecture: HIGH - Patterns established in existing test suite
- Pitfalls: HIGH - Documented in official sources and evident from API design

**Research date:** 2026-02-01 **Valid until:** 2026-03-01 (30 days - Deno is
stable, test patterns unlikely to change)
