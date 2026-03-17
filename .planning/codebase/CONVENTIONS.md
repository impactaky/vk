# Coding Conventions

**Analysis Date:** 2026-03-17

## Naming Patterns

**Files:**
- Use lowercase filenames with hyphens for production modules, for example `src/commands/task-attempts.ts`, `src/utils/error-handler.ts`, and `src/api/config.ts`.
- Use colocated unit test filenames ending in `_test.ts`, for example `src/utils/filter_test.ts` and `src/commands/wait_test.ts`.
- Use top-level integration test filenames ending in `_integration_test.ts` or `_test.ts` under `tests/`, for example `tests/task_attempts_integration_test.ts` and `tests/api_client_test.ts`.

**Functions:**
- Use `camelCase` for functions and methods, for example `resolvePrompt` in `src/commands/task-attempts.ts`, `loadConfig` in `src/api/config.ts`, and `getRepositoryId` in `src/utils/repository-resolver.ts`.
- Use verb-based names for async operations, especially API and resolver helpers, for example `listTaskAttempts`, `saveConfig`, `resolveWorkspaceFromBranch`, and `waitForServer`.

**Variables:**
- Use `camelCase` for local bindings and parameters, for example `targetBranch`, `responseText`, `repoBasenames`, and `testHome`.
- Use `UPPER_SNAKE_CASE` for module constants, for example `VERSION` in `src/main.ts`, `CONFIG_FILE` in `src/api/config.ts`, and `DEFAULT_TIMEOUT_MS` in `tests/helpers/test-server.ts`.

**Types:**
- Use `PascalCase` for interfaces, type aliases, and classes, for example `Config` in `src/api/config.ts`, `Workspace` in `src/api/types.ts`, `PromptSourceOptions` in `src/commands/task-attempts.ts`, and `RepositoryResolverError` in `src/utils/repository-resolver.ts`.
- Suffix custom error classes with `Error`, for example `FzfNotInstalledError` in `src/utils/fzf.ts` and `OrganizationResolverError` in `src/utils/organization-resolver.ts`.
- Keep API-shaped fields in the server’s snake_case form inside types, for example `created_at`, `task_id`, and `parent_workspace_id` in `src/api/types.ts` and `tests/filter_integration_test.ts`.

## Code Style

**Formatting:**
- Use Deno’s built-in formatter via `deno fmt`, configured in `deno.json`.
- `deno.json` limits formatter scope to `src/` and `tests/`.
- Formatting style is the standard Deno/TypeScript style: 2-space indentation, trailing commas in multiline literals, explicit `.ts` import extensions, and semicolons omitted.

**Linting:**
- Use Deno’s built-in linter via `deno lint`, configured in `deno.json`.
- No separate `eslint`, `prettier`, or `biome` config is present in the repository root.
- CI runs `deno fmt --check`, `deno lint`, and `deno check src/main.ts` in `.github/workflows/ci.yml`.

## Import Organization

**Order:**
1. External JSR/npm imports first, for example `@cliffy/command` in `src/main.ts` and `@std/assert` in `src/utils/git_test.ts`.
2. Local value imports second, using relative paths with explicit `.ts` extensions, for example `./commands/organization.ts` in `src/main.ts`.
3. Local type-only imports last or near related local imports, using `import type`, for example `import type { UpdateWorkspace } from "../api/types.ts";` in `src/commands/task-attempts.ts`.

**Path Aliases:**
- No path aliases are used.
- Import paths stay relative throughout `src/` and `tests/`, for example `../src/api/client.ts` in `tests/api_client_test.ts` and `./git.ts` in `src/utils/git_test.ts`.

## Error Handling

**Patterns:**
- Throw plain `Error` or a small custom error subclass from utilities when a caller needs context, for example `RepositoryResolverError` in `src/utils/repository-resolver.ts`.
- CLI command handlers wrap actions in `try/catch`, call `handleCliError`, and then rethrow to satisfy control flow, as in `src/commands/task-attempts.ts`.
- Utility helpers often return `null` instead of throwing for environment-dependent failures, for example `getGitRemoteUrl`, `getCurrentBranch`, and `resolveWorkspaceFromBranch`.
- Validation failures usually produce direct user-facing error messages and exit with `Deno.exit(1)`, as in `src/commands/config.ts` and `src/utils/error-handler.ts`.

## Logging

**Framework:** console

**Patterns:**
- Normal command output uses `console.log`, for example table-free status output in `src/commands/config.ts` and JSON output in `src/commands/task-attempts.ts`.
- User-visible failures use `console.error`, centralized in `src/utils/error-handler.ts`.
- Verbose request/response logging is opt-in through `--verbose`, implemented in `src/main.ts` and `src/api/client.ts`.
- There is no dedicated logging library or structured logger.

## Comments

**When to Comment:**
- Use short file header comments for modules with non-trivial responsibilities, common in `src/api/client.ts`, `src/api/config.ts`, and `tests/helpers/test-server.ts`.
- Add inline comments only where behavior is non-obvious or environment-specific, for example the path matching notes in `src/utils/repository-resolver.ts` and cleanup notes in `tests/repository_resolver_integration_test.ts`.
- Avoid comment-heavy code in simple command handlers and pure helpers.

**JSDoc/TSDoc:**
- Public utilities and API types frequently use JSDoc-style block comments, especially in `src/api/client.ts`, `src/api/types.ts`, `src/utils/git.ts`, and `src/utils/attempt-resolver.ts`.
- Tests generally do not use JSDoc, apart from brief file headers describing integration scope.

## Function Design

**Size:** Keep helpers small to medium-sized. Most utilities in `src/utils/*.ts` stay focused on one concern, while command files such as `src/commands/task-attempts.ts` accumulate multiple chained subcommands in a single exported module.

**Parameters:**
- Prefer strongly typed parameter objects when options grow, for example `PromptSourceOptions` in `src/commands/task-attempts.ts`.
- Pass dependency overrides through optional `deps` objects for testability instead of using a mocking framework, as in `src/utils/attempt-resolver.ts`.
- Preserve API payload shapes directly in request methods, for example `createWorkspace(workspace: CreateAndStartWorkspaceRequest)` in `src/api/client.ts`.

**Return Values:**
- Async I/O helpers usually return `Promise<T>` or `Promise<T | null>`, for example `getApiUrl` in `src/api/config.ts` and `getCurrentRepoBasename` in `src/utils/git.ts`.
- Resolver helpers return IDs or typed objects, then let CLI layers decide presentation, for example `getAttemptIdWithAutoDetect` and `resolveRepositoryFromPath`.
- Commands print results directly rather than returning domain objects.

## Module Design

**Exports:**
- Use named exports throughout the codebase. Examples include `export const configCommand` in `src/commands/config.ts`, `export class ApiClient` in `src/api/client.ts`, and `export function applyFilters` in `src/utils/filter.ts`.
- No default exports are present in the inspected `src/` and `tests/` files.

**Barrel Files:** Minimal usage. `src/mod.ts` is the only barrel-like entry point exposed through `deno.json`, while most modules are imported directly by path.

## Representative Patterns

**Command module pattern:**
```typescript
export const configCommand = new Command()
  .description("Manage CLI configuration")
  .action(function () {
    this.showHelp();
  });
```
- Use this style for new CLI groups under `src/commands/`.

**Dependency injection for testability:**
```typescript
export async function getAttemptIdWithAutoDetect(
  client: ApiClient,
  providedId: string | undefined,
  deps: Partial<AttemptResolverDeps> = {},
): Promise<string> {
```
- Follow this approach in `src/utils/attempt-resolver.ts` when logic needs isolated unit tests.

**Type-only imports:**
```typescript
import type { UpdateWorkspace } from "../api/types.ts";
```
- Keep type imports explicit instead of mixing them into value imports.

---

*Convention analysis: 2026-03-17*
