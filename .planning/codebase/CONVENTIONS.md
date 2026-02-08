# Coding Conventions

**Analysis Date:** 2026-02-08

## Naming Patterns

**Files:**
- Source files: lowercase with hyphens (`api-client.ts`, `project-resolver.ts`, `error-handler.ts`)
- Test files: `{filename}_test.ts` suffix for unit tests, `{feature}_integration_test.ts` for integration tests
- Command files: `{command}.ts` in `src/commands/` (e.g., `task.ts`, `project.ts`)
- Utility files: descriptive names in `src/utils/` (e.g., `filter.ts`, `git.ts`, `fzf.ts`)

**Functions:**
- camelCase for all function names
- Async functions use async/await pattern
- Private class methods use `private` keyword
- Static factory methods use `static create()` pattern (see `ApiClient.create()` in `src/api/client.ts`)
- Utility functions are exported and named descriptively (e.g., `extractRepoBasename`, `getProjectId`, `selectProjectWithFzf`)

**Variables:**
- camelCase for all variable names
- Constants use UPPERCASE_SNAKE_CASE only for truly immutable constants
- Interface properties use snake_case to match API response fields (e.g., `created_at`, `updated_at`, `parent_workspace_id`)
- Local variables use camelCase (e.g., `currentBasename`, `projectId`, `selectedId`)

**Types:**
- Interface names use PascalCase (e.g., `Project`, `Task`, `ApiClient`, `ProjectResolverError`)
- Type aliases use PascalCase (e.g., `TaskStatus`, `PRResult`, `BaseCodingAgent`)
- Union types use pipe syntax with uppercase discriminators (e.g., `"todo" | "inprogress" | "inreview" | "done" | "cancelled"`)

## Code Style

**Formatting:**
- Deno's built-in formatter via `deno fmt`
- 2-space indentation
- Trailing commas in multi-line structures
- Line length: no strict limit enforced by formatter

**Linting:**
- Deno's built-in linter via `deno lint`
- Configuration in `deno.json` with `strict: true` compiler option
- Uses `// deno-lint-ignore` comments for specific rule suppressions (see `src/utils/filter.ts` line 7)
- Linted directories: `src/` and `tests/`

**Quick Reference Commands:**
```bash
# Check formatting (fix with: deno fmt)
deno fmt --check

# Run linter
deno lint

# Type check
deno check src/main.ts

# Verify documentation
deno doc src/mod.ts
```

Run these checks before committing to ensure code quality.

## Import Organization

**Order:**
1. Standard library imports from `@std/*` (e.g., `@std/assert`, `@std/path`)
2. Third-party imports from JSR (e.g., `@cliffy/command`, `@opensrc/deno-open`)
3. Relative imports from within the project (e.g., `../api/client.ts`, `./git.ts`)
4. Type imports after value imports (using `import type { ... } from`)

**Path Aliases:**
- No path aliases used; all imports are relative or from JSR
- Consistent use of file extensions (`.ts` required for all imports)

**Examples from codebase:**

```typescript
// src/api/client.ts - order: standard lib, third-party, relative, then types
import { getApiUrl } from "./config.ts";
import { isVerbose, verboseLog } from "../utils/verbose.ts";
import type {
  ApiResponse,
  AttachPRRequest,
  // ... more types
} from "./types.ts";

// src/commands/task.ts - order: third-party, then relative
import { Command } from "@cliffy/command";
import { Confirm, Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { open } from "@opensrc/deno-open";
import { ApiClient } from "../api/client.ts";
import type { CreateTask } from "../api/types.ts";
```

## Error Handling

**Patterns:**
- Custom error classes extend `Error` and set the `name` property (see `ProjectResolverError` in `src/utils/project-resolver.ts`)
- Error messages are descriptive and user-facing
- Errors are caught and handled at command boundaries using `withErrorHandling` wrapper or try-catch in commands
- Check `src/utils/error-handler.ts` for common error handling utilities

**Example:**

```typescript
// src/utils/project-resolver.ts
export class ProjectResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectResolverError";
  }
}

// src/utils/error-handler.ts
export async function withErrorHandling<T>(
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (!handleCliError(error)) {
      throw error;
    }
    throw error; // TypeScript needs this for type inference
  }
}
```

## Logging

**Framework:** Native `console` methods (no external logging library)

**Patterns:**
- Use `console.log()` for normal output and messages
- Use `console.error()` for errors (e.g., `console.error('Error: ${error.message}')`)
- Verbose mode via `isVerbose()` flag controlled by `-v` / `--verbose` global option (see `src/utils/verbose.ts`)
- Verbose logs use helper function `verboseLog()` that prefixes with request/response details

**Example from `src/api/client.ts`:**

```typescript
if (isVerbose()) {
  verboseLog(`--- API Request ---`);
  verboseLog(`${method} ${url}`);
  if (options.body) {
    verboseLog(`Request Body: ${options.body}`);
  }
}
```

## Comments

**When to Comment:**
- File-level JSDoc comments describe module purpose (see all files in `src/utils/`)
- Function-level JSDoc comments explain parameters, return values, and behavior (see `src/api/client.ts` and utility functions)
- Complex logic with comments inline
- Business logic reasoning for non-obvious decisions

**JSDoc/TSDoc:**
- **REQUIRED** on all exported symbols (interfaces, types, classes, functions, constants)
- Use `@module` tag at top of files that form the public API surface (e.g., `src/api/types.ts`, `src/api/client.ts`, `src/api/config.ts`)
- Document non-obvious fields and parameters; self-documenting fields (e.g., `id: string`, `name: string`) can use brief or no per-field JSDoc
- Parameter documentation includes `@param` tag with type and description
- Return value documentation includes `@returns` tag
- All JSDoc must be compatible with `deno doc` output
- Verify documentation: `deno doc src/mod.ts` (text output) or `deno doc --html --output=docs src/mod.ts` (HTML generation)

**Example:**

```typescript
// src/api/types.ts
/**
 * @module types
 * Type definitions for vibe-kanban API
 */

/**
 * Represents a task in the system
 */
export interface Task {
  id: string;
  name: string;
  /**
   * Optional reference to container (e.g., docker://container-id or ssh://user@host)
   */
  container_ref?: string;
}

// src/api/client.ts
/**
 * Create a new task
 * @param projectId - ID of the project to create task in
 * @param taskData - Task creation data
 * @returns Created task object
 */
async createTask(projectId: string, taskData: CreateTask): Promise<Task> {
  // ...
}
```

## Function Design

**Size:**
- Small, focused functions; most utilities are 10-30 lines
- Larger functions (50+ lines) only when necessary (e.g., API client request method spans ~40 lines including logging)

**Parameters:**
- Use object parameters for functions with multiple arguments related to a single concept
- Always include type annotations; rely on TypeScript strict mode
- Generic parameters used for reusable utilities (e.g., `applyFilters<T extends Record<string, any>>`)

**Return Values:**
- Always specify return type explicitly
- Use `Promise<T>` for async operations
- Use union types for multiple return possibilities
- `void` return for side-effect-only functions

**Example from `src/utils/filter.ts`:**

```typescript
export function applyFilters<T extends Record<string, any>>(
  items: T[],
  filters: Record<string, unknown>,
): T[] {
  // ... implementation
}
```

## Module Design

**Exports:**
- All public functions and classes are `export`
- Interfaces and types exported as needed (e.g., `export interface Project`)
- Private functionality is not exported; helper functions kept internal when only used within module
- `src/mod.ts` is the public library entry point (barrel file) re-exporting the full public API
- Internal imports between source files use direct relative paths (barrel file is for external consumers only)
- When adding new public exports, they MUST be re-exported from `src/mod.ts`

**Example structure:**
- `src/api/client.ts` exports `ApiClient` class
- `src/api/types.ts` exports all type interfaces
- `src/api/config.ts` exports `loadConfig()`, `saveConfig()`, `getApiUrl()`, `Config` interface
- `src/utils/error-handler.ts` exports utility functions and error classes
- `src/mod.ts` re-exports all public API for library consumers
- `src/main.ts` is the CLI entry point (separate from library entry point)

## Class Design

**API Client Pattern:**
- Single class `ApiClient` in `src/api/client.ts`
- Private `request<T>()` method handles all HTTP logic
- Public methods delegate to `request<T>()` with specific types and endpoints
- Factory method `static create()` for initialization with async configuration

**Error Classes:**
- Extend `Error` with custom `name` property
- Examples: `ProjectResolverError`, `FzfNotInstalledError`, `FzfCancelledError`, `MarkdownParseError`

## Type Safety

**TypeScript Strict Mode:**
- Enabled in `deno.json` with `"strict": true`
- All parameters and return types explicitly annotated
- No implicit `any` types; use `deno-lint-ignore` only when necessary (see `filter.ts`)
- Generic types used for polymorphic functions

---

*Convention analysis: 2026-01-30*
