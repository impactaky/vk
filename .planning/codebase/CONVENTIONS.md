# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- Use lowercase kebab-case filenames for implementation modules in `src/`, such as `src/utils/error-handler.ts`, `src/utils/attempt-resolver.ts`, and `src/commands/task-attempts.ts`.
- Use Deno-style test suffixes: co-located unit tests use `*_test.ts` next to source files such as `src/commands/wait_test.ts` and `src/utils/git_test.ts`; broader integration tests live under `tests/` with names like `tests/cli_commands_integration_test.ts`.

**Functions:**
- Use camelCase for functions and methods, such as `loadConfig` in `src/api/config.ts`, `resolveWorkspaceFromBranch` in `src/utils/attempt-resolver.ts`, and `waitForBranchNotification` in `src/commands/wait.ts`.
- Use verb-first names for exported behavior, especially for command helpers and utilities: `getAttemptIdWithAutoDetect` in `src/utils/attempt-resolver.ts`, `handleCliError` in `src/utils/error-handler.ts`, and `selectWorkspace` in `src/utils/fzf.ts`.

**Variables:**
- Use camelCase for local bindings and parameters, such as `timeoutSeconds`, `waitPromise`, and `timeoutPromise` in `src/commands/wait.ts`.
- Use `UPPER_SNAKE_CASE` for module constants, such as `DEFAULT_TIMEOUT_SECONDS` in `src/commands/wait.ts`, `CONFIG_FILE` in `src/api/config.ts`, and `VERSION` in `src/main.ts`.

**Types:**
- Use PascalCase for interfaces, classes, and type exports, such as `Config` in `src/api/config.ts`, `AttemptResolverDeps` in `src/utils/attempt-resolver.ts`, `FzfCancelledError` in `src/utils/fzf.ts`, and re-exported API types in `src/mod.ts`.
- Prefix dependency-injection shapes with a domain-specific noun and `Deps`, such as `AttemptResolverDeps` and `BranchResolverDeps` in `src/utils/attempt-resolver.ts`.

## Code Style

**Formatting:**
- Use `deno fmt` via the `fmt` task in `deno.json`.
- Formatting scope is limited to `src/` and `tests/` by `deno.json`.
- Follow Deno formatter output: trailing commas in multiline literals, 2-space indentation, double-quoted strings, and wrapped chained calls as seen in `src/main.ts` and `src/commands/wait.ts`.

**Linting:**
- Use `deno lint` via the `lint` task in `deno.json`.
- Lint scope is limited to `src/` and `tests/` by `deno.json`.
- Keep code type-safe under `compilerOptions.strict: true` in `deno.json`; narrow types explicitly or return `null` rather than relying on loose inference.

## Import Organization

**Order:**
1. External JSR/npm imports first, such as `@cliffy/command`, `@std/assert`, and `nats.deno`.
2. Type-only imports before value imports when both are needed, as in `src/utils/attempt-resolver.ts` and `src/utils/fzf.ts`.
3. Relative local imports after external imports, grouped by feature area, as in `src/main.ts` and `tests/helpers/test-server.ts`.

**Path Aliases:**
- No path aliases are configured in `deno.json`.
- Use explicit relative `.ts` import paths, such as `../api/config.ts` in `src/commands/wait.ts` and `../../src/api/config.ts` in `tests/helpers/test-server.ts`.

## Error Handling

**Patterns:**
- Treat operational failures as `Error` instances with user-facing messages, then centralize CLI exit behavior through `handleCliError` in `src/utils/error-handler.ts`.
- For CLI commands, wrap action bodies in `try/catch`, call `handleCliError(error)`, and rethrow when needed, as in `src/commands/wait.ts`.
- For optional environment or shell interactions, prefer safe fallbacks over surfacing low-level failures. `resolveWorkspaceFromBranch` in `src/utils/attempt-resolver.ts` and git helpers in `src/utils/git.ts` return `null` on lookup failure.
- Throw explicit errors when user action is required, such as `"Not in a workspace branch. Provide workspace ID."` in `src/utils/attempt-resolver.ts` and `"No workspaces available."` in `src/utils/fzf.ts`.

## Logging

**Framework:** `console`

**Patterns:**
- Use `console.log` for successful CLI output, as in `src/commands/wait.ts` and the `--ai` path in `src/main.ts`.
- Use `console.error` only in centralized error handling paths, primarily `src/utils/error-handler.ts`.
- Keep logs concise and user-facing; verbose request/response behavior is toggled through `setVerbose(true)` in `src/main.ts` and implemented in `src/utils/verbose.ts`.

## Comments

**When to Comment:**
- Use short file headers for modules with a clear responsibility, as in `src/api/config.ts`, `src/utils/git.ts`, and `tests/helpers/test-server.ts`.
- Add inline comments only where the reason is not obvious from the code, such as `// Environment variable overrides config file` in `src/api/config.ts` or cleanup notes in `tests/cli_commands_integration_test.ts`.

**JSDoc/TSDoc:**
- Use JSDoc on exported interfaces, functions, and modules when behavior, precedence rules, or return values need clarification. Examples appear in `src/api/config.ts`, `src/utils/attempt-resolver.ts`, and `src/mod.ts`.
- Keep docs practical and behavior-focused; most small helpers and tests do not use formal docblocks.

## Function Design

**Size:**
- Keep functions narrowly scoped. Parsing, selection, and config helpers are usually compact single-purpose functions in `src/utils/git.ts`, `src/utils/fzf.ts`, and `src/api/config.ts`.
- Put branching command orchestration in `.action(...)` handlers, but move reusable logic into exported helpers such as `waitForBranchNotification` in `src/commands/wait.ts`.

**Parameters:**
- Pass dependencies explicitly for testability. Utility functions accept a `deps` object with `Partial<...Deps>` overrides, as in `getAttemptIdWithAutoDetect` and `resolveWorkspaceFromBranch` in `src/utils/attempt-resolver.ts`.
- Use typed primitives for CLI option values and domain objects for API behavior; avoid untyped bags beyond controlled dependency injection.

**Return Values:**
- Use `Promise<T>` consistently for async boundaries.
- Return `null` for recoverable lookup misses, such as `getCurrentBranch(): Promise<string | null>` in `src/utils/git.ts`.
- Throw `Error` for unrecoverable or user-actionable states, such as `waitForBranchNotification` in `src/commands/wait.ts`.

## Module Design

**Exports:**
- Export small, focused units from source modules and keep command construction local to each command file, such as `waitCommand` in `src/commands/wait.ts`.
- Re-export public library surface from the barrel file `src/mod.ts`. Add new externally supported API types and helpers there rather than requiring consumers to import from internal paths.

**Barrel Files:**
- Use `src/mod.ts` as the only observed barrel file.
- Prefer direct relative imports inside `src/`; reserve `src/mod.ts` for package consumers and top-level public API organization.

---

*Convention analysis: 2026-03-19*
