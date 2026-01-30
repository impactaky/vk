# Coding Conventions

**Analysis Date:** 2026-01-30

## Naming Patterns

**Files:**
- Kebab-case for all TypeScript files: `filter.ts`, `project-resolver.ts`, `error-handler.ts`
- Test files use suffix `_test.ts`: `filter_test.ts`, `git_test.ts`, `project-resolver_test.ts`
- Types defined in `types.ts` files in api/utils directories
- Command files in `src/commands/` named by feature: `task.ts`, `project.ts`, `repository.ts`, `attempt.ts`

**Functions:**
- camelCase for all function and method names: `applyFilters()`, `resolveProjectFromGit()`, `withErrorHandling()`
- Private methods: prefix with underscore (TypeScript private modifier preferred): `private baseUrl: string`
- Arrow functions used for callbacks and functional patterns
- Async functions clearly marked: `async function selectProjectWithFzf(...)`

**Variables:**
- camelCase for all local variables and parameters: `projectId`, `taskId`, `currentBasename`, `filterValue`
- Constants in UPPER_SNAKE_CASE when truly constant: `VERSION`, `DEFAULT_TIMEOUT_MS`, `POLL_INTERVAL_MS`, `SHARED_TEST_DIR`
- Type/interface parameters use PascalCase: `<T>`, `<ApiClient>`
- Null/undefined variables checked explicitly: `if (filterValue === undefined || filterValue === null)`

**Types:**
- PascalCase for interfaces and types: `Project`, `Task`, `Workspace`, `ApiResponse<T>`, `ResolvedProject`
- Union types inline: `TaskStatus = "todo" | "inprogress" | "inreview" | "done" | "cancelled"`
- Discriminated unions used: `ExecutorProfileId` with executor/variant fields
- Suffix conventions: `Create*` for creation payloads, `Update*` for update payloads, `*Status` for enums

## Code Style

**Formatting:**
- Deno `fmt` configured in `deno.json`
- Includes: `src/` and `tests/` directories
- 2-space indentation (Deno default)
- JSDoc comments for public exports

**Linting:**
- Deno `lint` configured in `deno.json`
- Includes: `src/` and `tests/` directories
- Explicit ignore for specific lint rules: `// deno-lint-ignore no-explicit-any` when justified
- Strict TypeScript enabled: `"strict": true` in compiler options

## Import Organization

**Order:**
1. Standard library imports: `import { assertEquals } from "@std/assert"`
2. Third-party imports: `import { Command } from "@cliffy/command"`
3. Local imports: `import { ApiClient } from "../api/client.ts"`
4. Type imports separate: `import type { Project } from "../api/types.ts"`

**Path Aliases:**
- Relative imports only, no path aliases configured
- Import from sibling modules using `../`: `import { getApiUrl } from "../api/config.ts"`
- Import from utilities: `import { applyFilters } from "../utils/filter.ts"`

**File extension handling:**
- All imports include `.ts` extension: `from "./git.ts"`, `from "../api/types.ts"`
- No bare imports or implicit index resolution

## Error Handling

**Patterns:**
- Custom error classes extending Error: `ProjectResolverError extends Error` with `this.name = "ProjectResolverError"`
- `FzfCancelledError`, `FzfNotInstalledError`, `MarkdownParseError` - all custom error types in utilities
- Error checking by `instanceof`: `if (error instanceof ProjectResolverError) { ... }`
- Try-catch wraps async operations: `try { return await action(); } catch (error) { ... }`
- Explicit error re-throw when appropriate: `throw error;` for type inference
- `Deno.exit(1)` used to exit CLI with error code
- Error messages prefixed with context: `Error: ${error.message}`

**Handler patterns:**
- `withErrorHandling()` wrapper for async actions with common error handling
- `handleCliError()` checks error type and exits appropriately
- Console.error used for error output: `console.error(\`Error: ${error.message}\`)`

## Logging

**Framework:** `console` (no external logging library)

**Patterns:**
- `console.log()` for normal output
- `console.error()` for errors
- Verbose logging via `verboseLog()` utility when `--verbose` flag enabled
- Verbose checks: `if (isVerbose()) { verboseLog(...) }`
- Structured logging for API requests/responses in verbose mode:
  ```typescript
  verboseLog(`--- API Request ---`);
  verboseLog(`${method} ${url}`);
  verboseLog(`Request Body: ${options.body}`);
  ```

## Comments

**When to Comment:**
- Document public functions with JSDoc: `/** Purpose and params **/`
- Explain non-obvious logic or workarounds
- Note API version compatibility: `// Note: API returns Repo[] (full repository objects)`
- Mark temporary workarounds: `// Clone response to read body for verbose logging`
- Document assumptions about data: `// Use current directory which should be a git repo`

**JSDoc/TSDoc:**
- Used for exported functions and classes
- Include param types and descriptions: `@param client API client instance`
- Include return type: `@returns The resolved project or throws ProjectResolverError`
- Complex logic marked with comments above code blocks

## Function Design

**Size:** Functions typically 10-50 lines; larger functions broken into smaller helpers

**Parameters:**
- Explicit parameters preferred: `function resolveProjectByIdOrName(idOrName: string, client: ApiClient)`
- Object destructuring when multiple related parameters: `{ method = "GET" } = {}`
- Optional parameters with defaults: `apiUrl: string = config.apiUrl`
- Type annotations always present: `path: string`, `filters: Record<string, unknown>`

**Return Values:**
- Explicit return type annotations: `Promise<Project[]>`, `Promise<string>`
- Void returns only when no data: `Promise<void>`
- Union return types rare, prefer single type or throwing on error
- Null/undefined returns for optional lookups: `async function getProjectId(...): Promise<string | null>`

## Module Design

**Exports:**
- Named exports preferred: `export const taskCommand = new Command()`
- Export classes and types: `export class ProjectResolverError extends Error`
- Export interfaces for type contracts: `export interface ResolvedProject`
- Default exports not used in this codebase

**Barrel Files:**
- Not used; imports are direct to implementation files
- `src/commands/` files export their command directly: `export const taskCommand`

## Type Safety

**TypeScript Usage:**
- Strict mode enabled: all types must be explicit
- Generic types used for reusable patterns: `<T>`, `<ApiResponse<T>>`
- Discriminated unions for API response types: `success` boolean discriminates response structure
- Type guards with `instanceof` for error handling
- `// @ts-ignore` used sparingly for test access to private fields: `// @ts-ignore - accessing private field for testing`

## API Client Patterns

**Consistency:**
- All methods return strongly-typed responses: `Promise<Project[]>`, `Promise<void>`
- Request bodies use type-safe request DTOs: `CreateTask`, `UpdateTask`
- Private `request<T>()` generic method handles all HTTP details
- Response parsing validates API contract: checks `result.success` before returning `result.data`
- URL construction: `const url = \`${this.baseUrl}/api${path}\`; `

---

*Convention analysis: 2026-01-30*
