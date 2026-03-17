# Architecture

**Analysis Date:** 2026-03-17

## Pattern Overview

**Overall:** Layered Deno CLI with command orchestration over an HTTP API client and small resolver/utility modules.

**Key Characteristics:**
- `src/main.ts` is the only executable entry point and wires the full command tree through Cliffy.
- Command modules in `src/commands/*.ts` stay thin: they parse flags, call `ApiClient`, invoke resolver helpers, and format output.
- Shared behavior is centralized in `src/api/*.ts` and `src/utils/*.ts` rather than hidden inside command files.

## Layers

**CLI Composition Layer:**
- Purpose: Build the `vk` command surface, register global flags, and dispatch to subcommands.
- Location: `src/main.ts`
- Contains: Cliffy `Command` setup, `--ai` handling, `--verbose` handling, top-level command registration.
- Depends on: `src/commands/organization.ts`, `src/commands/repository.ts`, `src/commands/task-attempts.ts`, `src/commands/config.ts`, `src/commands/notify.ts`, `src/commands/wait.ts`, `src/utils/ai-help.ts`, `src/utils/verbose.ts`
- Used by: Deno runtime via `deno run ... src/main.ts`

**Command Handler Layer:**
- Purpose: Implement user-facing subcommands and translate CLI input into application operations.
- Location: `src/commands/`
- Contains: Resource-oriented handlers in `src/commands/organization.ts`, `src/commands/repository.ts`, `src/commands/task-attempts.ts`, plus local/system commands in `src/commands/config.ts`, `src/commands/notify.ts`, `src/commands/wait.ts`
- Depends on: `src/api/client.ts`, `src/api/config.ts`, `src/api/types.ts`, and resolver/error helpers from `src/utils/`
- Used by: `src/main.ts`

**API Access Layer:**
- Purpose: Encapsulate all HTTP calls to the vibe-kanban server behind typed methods.
- Location: `src/api/client.ts`
- Contains: `ApiClient`, generic `request<T>()`, endpoint-specific methods for organizations, repositories, workspaces, PR operations, and branch operations.
- Depends on: `src/api/config.ts`, `src/api/types.ts`, `src/utils/verbose.ts`
- Used by: All API-backed command modules and unit/integration tests such as `tests/api_client_test.ts`

**Configuration Layer:**
- Purpose: Resolve runtime configuration from disk and environment.
- Location: `src/api/config.ts`
- Contains: `Config` shape, config path resolution, load/save functions, API URL lookup.
- Depends on: `@std/path`, Deno filesystem/env APIs
- Used by: `src/api/client.ts`, `src/commands/config.ts`, `src/commands/task-attempts.ts`, `src/commands/notify.ts`, `src/commands/wait.ts`, `tests/helpers/test-server.ts`

**Domain Types Layer:**
- Purpose: Define shared data contracts for API responses and CLI logic.
- Location: `src/api/types.ts`
- Contains: resource interfaces (`Organization`, `Repo`, `Workspace`), request payload types, executor types, and constants such as `VALID_EXECUTORS`
- Depends on: no internal modules
- Used by: `src/api/client.ts`, command modules, utility modules, and tests

**Resolution and Shell Utility Layer:**
- Purpose: Handle context-sensitive lookup, shell integration, and reusable CLI support code.
- Location: `src/utils/`
- Contains: repository/workspace resolution in `src/utils/repository-resolver.ts` and `src/utils/attempt-resolver.ts`, interactive selection in `src/utils/fzf.ts`, git introspection in `src/utils/git.ts`, output helpers in `src/utils/error-handler.ts` and `src/utils/verbose.ts`, and data helpers in `src/utils/filter.ts`, `src/utils/executor-parser.ts`, `src/utils/ai-help.ts`
- Depends on: `src/api/types.ts`, selected `src/api/client.ts` types, Deno subprocess APIs, external binaries `git` and `fzf`
- Used by: command modules and focused unit tests in `src/utils/*_test.ts`

**Library Export Layer:**
- Purpose: Expose the CLI package as an importable module in addition to the executable.
- Location: `src/mod.ts`
- Contains: re-exports for `ApiClient`, config helpers, API types, and executor constants.
- Depends on: `src/api/client.ts`, `src/api/config.ts`, `src/api/types.ts`
- Used by: package consumers through the `deno.json` export map

**Specification and Workflow Layer:**
- Purpose: Define expected behavior and change history outside runtime code.
- Location: `specs/cli.md`, `openspec/specs/**/spec.md`, `openspec/changes/archive/**`
- Contains: human-readable CLI contract, current OpenSpec requirements, and archived proposals/designs/tasks.
- Depends on: repository workflow conventions rather than runtime code
- Used by: planning, implementation, and verification work

## Data Flow

**Standard API-backed Command Flow:**

1. `src/main.ts` registers a subcommand and Cliffy parses CLI arguments.
2. A handler in `src/commands/*.ts` validates flags and optional arguments.
3. The command resolves context through helpers such as `src/utils/repository-resolver.ts` or `src/utils/attempt-resolver.ts`.
4. The command constructs or loads configuration from `src/api/config.ts`.
5. `src/api/client.ts` sends the HTTP request to `${baseUrl}/api/...` and validates the envelope response.
6. The command renders human-readable output or JSON, with failures routed through `src/utils/error-handler.ts`.

**Workspace ID Auto-detect Flow:**

1. A workspace command in `src/commands/task-attempts.ts` calls `getAttemptIdWithAutoDetect()` from `src/utils/attempt-resolver.ts`.
2. The resolver prefers an explicit ID argument.
3. If no ID is provided, `src/utils/git.ts` reads the current branch and `ApiClient.searchWorkspacesByBranch()` filters API results client-side.
4. If branch matching fails, `src/utils/fzf.ts` offers interactive selection.
5. If no target can be resolved, the command exits with an actionable error.

**Repository Auto-detect Flow:**

1. Commands such as `vk workspace create` call `getRepositoryId()` in `src/utils/repository-resolver.ts`.
2. The resolver prefers explicit ID or name.
3. Without a value, it compares the current repo git remote basename from `src/utils/git.ts` against registered repositories returned by `ApiClient.listRepos()`.
4. It falls back to path matching, then interactive `fzf` selection.

**State Management:**
- Runtime state is mostly stateless per command invocation.
- Persistent local state lives only in `~/.config/vibe-kanban/vk-config.json` via `src/api/config.ts`.
- Remote authoritative state lives in the vibe-kanban API server accessed through `src/api/client.ts`.

## Key Abstractions

**`ApiClient`:**
- Purpose: Single abstraction for all HTTP communication and response-envelope handling.
- Examples: `src/api/client.ts`, `tests/api_client_test.ts`
- Pattern: Typed service object with one public method per API route family.

**Resolvers:**
- Purpose: Turn optional CLI identifiers into concrete resource IDs using local context plus API lookups.
- Examples: `src/utils/repository-resolver.ts`, `src/utils/attempt-resolver.ts`, `src/utils/organization-resolver.ts`
- Pattern: Explicit resolution order with context probing and clear user-facing errors.

**Cliffy Command Trees:**
- Purpose: Model each top-level command and nested subcommand hierarchy.
- Examples: `src/main.ts`, `src/commands/task-attempts.ts`
- Pattern: Declarative command composition with `.command()`, `.option()`, `.arguments()`, and async `.action()`.

**Config-backed Messaging Commands:**
- Purpose: Integrate local git context with NATS notifications.
- Examples: `src/commands/notify.ts`, `src/commands/wait.ts`
- Pattern: Commands read config defaults, connect to NATS, and publish/subscribe around a branch string payload.

## Entry Points

**CLI Binary:**
- Location: `src/main.ts`
- Triggers: `deno run ... src/main.ts`, installed binary invocation, and test processes that spawn the CLI
- Responsibilities: Build the command graph, handle global flags, and parse arguments

**Library Export Surface:**
- Location: `src/mod.ts`
- Triggers: External imports through the package export declared in `deno.json`
- Responsibilities: Re-export stable programmatic APIs and type definitions

**Integration Test Harness:**
- Location: `tests/helpers/test-server.ts`
- Triggers: Integration tests in `tests/*_integration_test.ts`
- Responsibilities: Load CLI config and verify the external API server is reachable before command-level tests proceed

## Error Handling

**Strategy:** Fail fast in command handlers, centralize user-facing formatting, and let commands terminate the process on handled failures.

**Patterns:**
- Commands wrap their action bodies in `try/catch`, call `handleCliError()` from `src/utils/error-handler.ts`, then rethrow to satisfy type flow.
- `ApiClient.request()` in `src/api/client.ts` raises on non-2xx responses and on envelope-level `success: false`.
- Resolver modules raise domain-specific errors such as `RepositoryResolverError` and `OrganizationResolverError`.
- Interactive cancellation and missing `fzf` are normalized through `FzfCancelledError` and `FzfNotInstalledError` from `src/utils/fzf.ts`.

## Cross-Cutting Concerns

**Logging:** Verbose HTTP request/response logging is toggled globally in `src/main.ts` and implemented in `src/utils/verbose.ts`, with `src/api/client.ts` as the primary emitter.

**Validation:** Command-level input validation happens inline close to flags, for example prompt-source validation in `src/commands/task-attempts.ts` and executor validation in `src/utils/executor-parser.ts`.

**Authentication:** No explicit auth module is present in the CLI. Server access is based on configured API URLs in `src/api/config.ts`; auth is assumed to be handled by the target service or environment outside this repository.

**External Process Integration:** Git and fzf resolution rely on `Deno.Command` calls in `src/utils/git.ts` and `src/utils/fzf.ts`. New shell-dependent behavior belongs in `src/utils/` rather than command modules.

---

*Architecture analysis: 2026-03-17*
