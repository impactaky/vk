---
phase: quick
plan: 004
type: execute
wave: 1
depends_on: []
files_modified:
  - src/mod.ts
  - deno.json
  - src/api/types.ts
  - src/api/client.ts
  - src/api/config.ts
autonomous: true

must_haves:
  truths:
    - "Running `deno doc` against the package shows all public types and the ApiClient class"
    - "Running `deno doc --html` generates documentation covering types, client, and config"
    - "Running `deno doc --lint` on mod.ts passes with zero errors"
    - "The CLI entry point (deno task dev) still works unchanged"
  artifacts:
    - path: "src/mod.ts"
      provides: "Public API barrel file re-exporting types, ApiClient, and config"
      exports: ["ApiClient", "Config", "Project", "Task", "Workspace", "...all public types"]
    - path: "deno.json"
      provides: "Updated exports field with both CLI and library entry points"
      contains: "exports"
  key_links:
    - from: "deno.json"
      to: "src/mod.ts"
      via: "exports field"
      pattern: "./src/mod.ts"
    - from: "src/mod.ts"
      to: "src/api/types.ts"
      via: "re-export"
      pattern: "export.*from.*./api/types.ts"
---

<objective>
Make `deno doc` work for the vibe-kanban CLI project by creating a proper library entry point (mod.ts) with JSDoc documentation on public API surfaces, and updating deno.json exports.

Purpose: Currently `deno doc` shows nothing because the single export (`./src/main.ts`) is a CLI entry point with no exports. Developers and AI agents consuming this as a library need documentation of the types and ApiClient.

Output: A `src/mod.ts` barrel file with JSDoc comments, updated `deno.json` with proper exports map, and JSDoc comments on all types/interfaces in `src/api/types.ts`, `src/api/client.ts`, and `src/api/config.ts`.
</objective>

<execution_context>
@/home/impactaky/shelffiles/config/claude/get-shit-done/workflows/execute-plan.md
@/home/impactaky/shelffiles/config/claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@deno.json
@src/main.ts
@src/api/types.ts
@src/api/client.ts
@src/api/config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add JSDoc comments to public API files</name>
  <files>src/api/types.ts, src/api/client.ts, src/api/config.ts</files>
  <action>
Add JSDoc comments to all exported symbols in these three files so that `deno doc --lint` passes. Focus on:

**src/api/types.ts** - Add a `/** ... */` comment above every exported interface, type, and const. For interfaces, add a brief description of what the type represents. For interface members/fields, add JSDoc ONLY where the field name is not self-documenting (e.g., `container_ref`, `dropped`, `conflict_op`). Do NOT add trivial JSDoc to obvious fields like `id: string`, `name: string`, `created_at: string` -- instead use `/** @ignore */` or simply accept that `deno doc --lint` is advisory and skip member-level JSDoc for self-documenting fields. The goal is useful documentation, not satisfying every lint warning.

Group the JSDoc by domain using `@module` at the top of the file:
```typescript
/**
 * API types for the vibe-kanban CLI.
 *
 * Contains all request/response types used to communicate with the
 * vibe-kanban API server.
 *
 * @module
 */
```

**src/api/client.ts** - Add a `@module` comment at the top. Add JSDoc to the `ApiClient` class and its public methods. Each method should document what API endpoint it calls and what it returns. Skip the private `request` method. Example:
```typescript
/** API client for communicating with the vibe-kanban server. */
export class ApiClient {
  /** Create an ApiClient using the configured API URL. */
  static async create(): Promise<ApiClient> { ... }

  /** List all projects. Calls GET /api/projects. */
  listProjects(): Promise<Project[]> { ... }
```

**src/api/config.ts** - Add a `@module` comment at the top. Add JSDoc to `Config` interface, `loadConfig`, `saveConfig`, and `getApiUrl` functions documenting what they do (config file location, env var override behavior, etc.).

Important: Do NOT change any runtime behavior. Only add JSDoc comments.
  </action>
  <verify>
Run `deno check src/main.ts` to verify no type errors introduced.
Run `deno doc src/api/types.ts 2>&1 | head -20` to verify JSDoc appears in output.
Run `deno doc src/api/client.ts 2>&1 | head -20` to verify JSDoc appears in output.
  </verify>
  <done>All exported interfaces, types, constants, classes, and public methods in src/api/types.ts, src/api/client.ts, and src/api/config.ts have JSDoc comments. The documentation is useful (not just "The X interface" boilerplate). No runtime behavior changed.</done>
</task>

<task type="auto">
  <name>Task 2: Create mod.ts barrel file and update deno.json exports</name>
  <files>src/mod.ts, deno.json</files>
  <action>
**Create `src/mod.ts`** as the public library entry point. This file re-exports the public API:

```typescript
/**
 * @vibe-kanban/cli - CLI and library for managing vibe-kanban workflows.
 *
 * This module exports the API client, configuration utilities, and all
 * TypeScript types used by the vibe-kanban CLI.
 *
 * @example
 * ```ts
 * import { ApiClient } from "@vibe-kanban/cli";
 *
 * const client = await ApiClient.create();
 * const projects = await client.listProjects();
 * ```
 *
 * @module
 */

// API Client
export { ApiClient } from "./api/client.ts";

// Configuration
export { loadConfig, saveConfig, getApiUrl } from "./api/config.ts";
export type { Config } from "./api/config.ts";

// Types - re-export everything from types.ts
export type {
  ApiResponse,
  AttachPRRequest,
  BranchStatus,
  ConflictOp,
  CreatePRRequest,
  CreateProject,
  CreateProjectRepo,
  CreateTask,
  CreateWorkspace,
  ExecutionProcess,
  ExecutionProcessRunReason,
  ExecutionProcessStatus,
  ExecutorProfileID,
  FollowUpRequest,
  GitBranch,
  InitRepoRequest,
  Merge,
  MergeResult,
  MergeWorkspaceRequest,
  PRComment,
  PRResult,
  Project,
  ProjectRepo,
  PushWorkspaceRequest,
  RebaseWorkspaceRequest,
  RegisterRepoRequest,
  RenameBranchRequest,
  Repo,
  RepoBranchStatus,
  Session,
  Task,
  TaskStatus,
  TaskWithAttemptStatus,
  UnifiedPRComment,
  UpdateProject,
  UpdateRepo,
  UpdateTask,
  UpdateWorkspace,
  Workspace,
  WorkspaceRepo,
  WorkspaceRepoInput,
  WorkspaceStatus,
} from "./api/types.ts";

// Constants
export { VALID_EXECUTORS } from "./api/types.ts";
export type { BaseCodingAgent } from "./api/types.ts";
```

**Update `deno.json`** to use an exports map instead of a single string:

Change:
```json
"exports": "./src/main.ts",
```

To:
```json
"exports": {
  ".": "./src/mod.ts"
},
```

This makes `deno doc` work against the package's default export. The CLI entry point (`src/main.ts`) is still used via `deno task dev` and is NOT the library export.

Do NOT add a `"doc"` task to deno.json -- keep it simple; users can run `deno doc src/mod.ts` directly.
  </action>
  <verify>
Run `deno doc src/mod.ts 2>&1 | head -40` and verify it shows ApiClient, Config, Project, Task, Workspace and other exported types.
Run `deno doc --html --name="@vibe-kanban/cli" --output=/tmp/vk-doc-verify src/mod.ts 2>&1` and verify it generates HTML docs without errors.
Run `deno check src/main.ts` to verify CLI entry point still type-checks.
Run `deno check src/mod.ts` to verify library entry point type-checks.
Run `deno task test` to verify all existing tests still pass.
  </verify>
  <done>
- `src/mod.ts` exists and re-exports all public types, ApiClient, and config utilities
- `deno.json` exports field points to `src/mod.ts` as the default export
- `deno doc src/mod.ts` shows all public API documentation
- `deno doc --html` generates complete HTML documentation
- All existing tests pass
- CLI still works via `deno task dev`
  </done>
</task>

</tasks>

<verification>
1. `deno doc src/mod.ts` outputs documentation for ApiClient, Config, and all public types
2. `deno doc --html --name="@vibe-kanban/cli" --output=/tmp/vk-doc-check src/mod.ts` generates HTML docs without errors
3. `deno check src/mod.ts` passes (library entry point)
4. `deno check src/main.ts` passes (CLI entry point)
5. `deno task test` passes (no regressions)
</verification>

<success_criteria>
- `deno doc src/mod.ts` shows documented public API (types, client, config)
- `deno doc --html` generates browsable documentation
- All public interfaces/types/classes have meaningful JSDoc comments
- No existing tests broken
- CLI functionality unchanged
</success_criteria>

<output>
After completion, create `.planning/quick/004-support-deno-doc/004-SUMMARY.md`
</output>
