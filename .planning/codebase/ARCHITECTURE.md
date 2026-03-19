# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Thin-command CLI over a typed transport client with resolver and utility helpers.

**Key Characteristics:**
- `src/main.ts` is the single runtime entry point and only composition root for the CLI tree.
- `src/commands/*.ts` modules define user-facing subcommands and orchestrate I/O, but delegate network, config, and auto-detection to lower layers.
- `src/api/client.ts`, `src/api/config.ts`, and `src/utils/*.ts` form a shared service layer reused across commands and tests.

## Layers

**CLI Composition Layer:**
- Purpose: Build the `vk` command, register global flags, and wire subcommands.
- Location: `src/main.ts`
- Contains: `Command` setup, `--ai` handling, verbose bootstrap, subcommand registration.
- Depends on: `src/commands/*.ts`, `src/utils/ai-help.ts`, `src/utils/verbose.ts`
- Used by: End users running `deno run src/main.ts ...` or installed binaries.

**Command Handler Layer:**
- Purpose: Map CLI verbs and options to application operations.
- Location: `src/commands/organization.ts`, `src/commands/repository.ts`, `src/commands/task-attempts.ts`, `src/commands/config.ts`, `src/commands/notify.ts`, `src/commands/wait.ts`
- Contains: Cliffy subcommand definitions, table rendering, JSON/plain-text output, command-local validation like `resolvePrompt()` in `src/commands/task-attempts.ts`.
- Depends on: `src/api/client.ts`, `src/api/config.ts`, `src/api/types.ts`, `src/utils/*.ts`, `nats.deno` for notify/wait.
- Used by: `src/main.ts`

**Transport and Persistence Layer:**
- Purpose: Centralize HTTP calls and local config persistence.
- Location: `src/api/client.ts`, `src/api/config.ts`
- Contains: `ApiClient`, request wrapper logic, workspace endpoint fallback logic, config file load/save, environment overrides.
- Depends on: native `fetch`, Deno filesystem/env APIs, `@std/path`, `src/api/types.ts`, `src/utils/verbose.ts`
- Used by: All command modules, `tests/helpers/test-server.ts`, library consumers through `src/mod.ts`

**Resolver Layer:**
- Purpose: Convert partial CLI context into concrete IDs using repo state, branch state, and API lookups.
- Location: `src/utils/repository-resolver.ts`, `src/utils/attempt-resolver.ts`, `src/utils/organization-resolver.ts`
- Contains: repo auto-detection from current path/git remote, workspace auto-detection from current branch, explicit name/ID resolution.
- Depends on: `src/api/client.ts`, `src/utils/git.ts`, `src/utils/fzf.ts`
- Used by: `src/commands/repository.ts`, `src/commands/task-attempts.ts`, `src/commands/organization.ts`

**Execution Helper Layer:**
- Purpose: Provide reusable CLI-side helpers that are not domain endpoints.
- Location: `src/utils/filter.ts`, `src/utils/error-handler.ts`, `src/utils/fzf.ts`, `src/utils/git.ts`, `src/utils/executor-parser.ts`, `src/utils/ai-help.ts`, `src/utils/verbose.ts`
- Contains: filtering, shared fatal error handling, interactive `fzf` selection, git shell-outs, executor parsing, AI help generation, verbose state.
- Depends on: Deno subprocess APIs, Cliffy metadata APIs, `src/api/types.ts`
- Used by: Commands, resolvers, tests.

**Test Harness Layer:**
- Purpose: Exercise the CLI and helpers as black-box Deno programs or unit-level modules.
- Location: `src/**/*_test.ts`, `tests/**/*.ts`
- Contains: unit tests near utilities, integration tests under `tests/`, shared API readiness helper in `tests/helpers/test-server.ts`
- Depends on: runtime entry point `src/main.ts`, live or configured API server, Deno test runner.
- Used by: `deno task test`, `deno task test:integration`

## Data Flow

**Standard CLI Request Flow:**

1. `src/main.ts` parses global flags, optionally enables verbose logging, and dispatches to a subcommand.
2. A command module in `src/commands/*.ts` validates options and resolves missing identifiers through resolver helpers when needed.
3. The command constructs or loads configuration via `src/api/config.ts` and issues remote operations through `ApiClient` in `src/api/client.ts`.
4. The command formats returned data as JSON, key-value lines, or `@cliffy/table` output and prints to stdout.

**Workspace Auto-Detection Flow:**

1. `src/commands/task-attempts.ts` calls `getAttemptIdWithAutoDetect()` from `src/utils/attempt-resolver.ts` when `[id]` is omitted.
2. `src/utils/attempt-resolver.ts` checks the current git branch via `src/utils/git.ts`.
3. `ApiClient.searchWorkspacesByBranch()` in `src/api/client.ts` fetches all workspaces and filters client-side.
4. If no branch match exists, `src/utils/fzf.ts` presents an interactive fallback selection.

**Repository Auto-Resolution Flow:**

1. `src/commands/repository.ts` or `src/commands/task-attempts.ts` calls `getRepositoryId()` from `src/utils/repository-resolver.ts`.
2. `src/utils/repository-resolver.ts` compares the current repo basename from `src/utils/git.ts` against registered repos returned by `ApiClient.listRepos()`.
3. If git-based matching is ambiguous, it prefers a path match; if no match exists, it falls back to `fzf`.

**State Management:**
- Runtime state is intentionally minimal and process-local.
- Persistent user state lives only in `~/.config/vibe-kanban/vk-config.json` through `src/api/config.ts`.
- Verbose logging state is a module-global boolean in `src/utils/verbose.ts`.
- Remote source of truth remains the vibe-kanban API and, for notify/wait, the configured NATS subject.

## Key Abstractions

**`ApiClient`:**
- Purpose: Typed façade over all HTTP endpoints used by the CLI.
- Examples: `src/api/client.ts`, re-exported by `src/mod.ts`
- Pattern: Single class with one `request<T>()` primitive and many endpoint-specific methods.

**`Workspace`:**
- Purpose: Core remote entity for CLI workflows; commands still expose it as a “workspace” even when backend paths use `task-attempts`.
- Examples: `src/api/types.ts`, `src/commands/task-attempts.ts`, `src/utils/attempt-resolver.ts`
- Pattern: Shared DTO interface reused across commands, resolvers, and tests.

**Resolver Helpers:**
- Purpose: Keep commands from duplicating ID lookup and auto-detection logic.
- Examples: `src/utils/repository-resolver.ts`, `src/utils/attempt-resolver.ts`, `src/utils/organization-resolver.ts`
- Pattern: Async functions with small dependency-injection seams for testing.

**Command Modules:**
- Purpose: Group all subcommands for a domain under one exported Cliffy `Command`.
- Examples: `src/commands/repository.ts`, `src/commands/task-attempts.ts`
- Pattern: Builder-style command registration plus inline async actions.

## Entry Points

**CLI Binary:**
- Location: `src/main.ts`
- Triggers: `deno run src/main.ts ...`, `deno install ... src/main.ts`, packaged binary execution.
- Responsibilities: Build the CLI tree, register top-level commands, intercept `--ai`, enable verbose mode.

**Library Surface:**
- Location: `src/mod.ts`
- Triggers: External import of `@vibe-kanban/cli`
- Responsibilities: Re-export `ApiClient`, config helpers, and public API types without pulling in CLI wiring.

**Integration Test Runner:**
- Location: `tests/*.ts`
- Triggers: `deno task test`, `deno task test:integration`
- Responsibilities: Execute end-to-end CLI commands against a configured server and validate endpoint contracts.

## Error Handling

**Strategy:** Commands own the top-level `try/catch` boundary and terminate the process on handled user-facing failures.

**Patterns:**
- Most command actions wrap logic in `try/catch`, call `handleCliError()` from `src/utils/error-handler.ts`, then rethrow for type flow even though `Deno.exit(1)` already terminates.
- Validation failures are thrown as plain `Error` instances close to the source, for example prompt validation in `src/commands/task-attempts.ts` and executor validation in `src/utils/executor-parser.ts`.
- Transport failures surface as `Error` from `ApiClient.request()` with raw status/body context.
- `ApiClient.requestWorkspaceResource()` in `src/api/client.ts` contains a compatibility fallback between `/api/task-attempts/*` and `/api/workspaces/*`.

## Cross-Cutting Concerns

**Logging:** `src/utils/verbose.ts` gates request/response diagnostics used only by `src/api/client.ts`; non-verbose user errors go through `console.error`.

**Validation:** Commands validate required option combinations locally; shared parsing and resolution rules live in `src/utils/executor-parser.ts`, `src/utils/repository-resolver.ts`, and `src/utils/attempt-resolver.ts`.

**Authentication:** Not implemented in the CLI layer. `src/api/client.ts` sends plain JSON requests to the configured base URL and relies on the server/environment for any auth model.

---

*Architecture analysis: 2026-03-19*
