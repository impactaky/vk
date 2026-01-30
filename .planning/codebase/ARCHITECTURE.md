# Architecture

**Analysis Date:** 2026-01-30

## Pattern Overview

**Overall:** Command-driven REST client with layered separation between CLI commands, API communication, and utility helpers.

**Key Characteristics:**
- CLI-first design using Cliffy framework for command structure
- Thin HTTP wrapper around vibe-kanban REST API
- Auto-detection and resolution of context (project, task, workspace) from git repository
- Optional interactive selection via fzf for missing IDs
- Global state management for verbose logging

## Layers

**CLI Command Layer:**
- Purpose: Define and handle user commands, parse arguments, display results
- Location: `src/commands/`
- Contains: Command definitions for project, task, attempt, repository, config
- Depends on: ApiClient, utility resolvers and formatters
- Used by: main.ts entry point

**API Client Layer:**
- Purpose: Abstract HTTP communication with vibe-kanban API backend
- Location: `src/api/client.ts`
- Contains: ApiClient class with typed methods for all API endpoints
- Depends on: Type definitions, config module for API URL, verbose logger
- Used by: All command handlers

**Type Definition Layer:**
- Purpose: Provide TypeScript interfaces matching API contract
- Location: `src/api/types.ts`
- Contains: Request/response interfaces, enums for statuses and agents
- Depends on: None (pure type definitions)
- Used by: API client, all command handlers

**Configuration Layer:**
- Purpose: Manage application settings and secrets
- Location: `src/api/config.ts`
- Contains: Config loading/saving from `~/.config/vibe-kanban/vk-config.json`
- Depends on: Standard library path utilities
- Used by: ApiClient.create()

**Utility Layer:**
- Purpose: Provide cross-cutting helpers for common operations
- Location: `src/utils/`
- Contains: Git integration, fzf interactive selection, filtering, parsing, error handling, verbose logging
- Depends on: ApiClient, type definitions
- Used by: Command handlers

## Data Flow

**Typical User Command Flow:**

1. User invokes CLI command (e.g., `vk task show`)
2. main.ts parses global options (--verbose, --ai) and routes to command handler
3. Command handler in `src/commands/*.ts` receives options and arguments
4. Handler calls resolver utility if IDs are missing (e.g., `getProjectId`)
5. Resolver attempts auto-detection from git repository context
6. If auto-detection fails and fzf installed, show interactive selection
7. Handler calls ApiClient methods to fetch/modify data
8. ApiClient makes HTTP request to vibe-kanban backend
9. ApiClient logs verbose details if --verbose flag set
10. Handler formats output (table, JSON, or text) and prints

**Resolver Logic Priority:**

1. Use explicitly provided ID if given
2. Auto-detect from git context (current branch, current repository)
3. Fall back to fzf interactive selection if available
4. Fail with helpful error message if none available

**State Management:**

- Verbose mode: Global boolean in `src/utils/verbose.ts`, set via --verbose flag
- Config: Loaded per command from `~/.config/vibe-kanban/vk-config.json`
- Context: Determined from git working directory, not stored in state
- API Client: Instantiated fresh per command via `ApiClient.create()`

## Key Abstractions

**ApiClient:**
- Purpose: Encapsulate all HTTP communication with backend
- Examples: `src/api/client.ts` (single class)
- Pattern: Factory method `static create()` for initialization, private request method for all calls

**Command Groups:**
- Purpose: Organize related operations into command trees
- Examples: `projectCommand`, `taskCommand`, `attemptCommand`, `repositoryCommand` in `src/commands/`
- Pattern: Each exports a Command instance from Cliffy with subcommands defined via `.command()` method

**Resolver Utilities:**
- Purpose: Resolve IDs with smart detection and fallback
- Examples: `getProjectId()`, `getTaskIdWithAutoDetect()`, `getAttemptIdWithAutoDetect()` from `src/utils/`
- Pattern: Try explicit argument → auto-detect from git → fzf selection → error

**Formatter Functions:**
- Purpose: Format rich types for fzf display with tabular output
- Examples: `formatProject()`, `formatTask()`, `formatWorkspace()`, `formatRepository()` in `src/utils/fzf.ts`
- Pattern: Return tab-separated string with ID first column for extraction

## Entry Points

**main.ts:**
- Location: `src/main.ts`
- Triggers: User invokes `vk` command or `deno run ... src/main.ts`
- Responsibilities: Create CLI root, register all subcommands, handle --ai and --verbose global flags, parse arguments

**Command Handlers:**
- Locations: `src/commands/project.ts`, `src/commands/task.ts`, `src/commands/attempt.ts`, `src/commands/repository.ts`, `src/commands/config.ts`
- Triggers: User selects specific command (e.g., `vk task list`)
- Responsibilities: Parse command-specific options, resolve IDs, call API, format output, handle errors

## Error Handling

**Strategy:** Centralized error conversion to CLI-friendly messages with appropriate exit codes.

**Patterns:**
- Custom Error classes for specific error types: `ProjectResolverError`, `FzfNotInstalledError`, `FzfCancelledError`, `MarkdownParseError`
- Global error handler in `src/utils/error-handler.ts`: `handleCliError()` catches known errors and exits with code 1
- All async command handlers wrapped in try-catch that calls `handleCliError()`
- Verbose logging in `src/api/client.ts` request method shows full HTTP details when enabled

**Common Error Scenarios:**
- No project found matching current git repo → ProjectResolverError with hint about `vk project list`
- fzf not installed for interactive selection → FzfNotInstalledError with installation link
- User cancels fzf selection → FzfCancelledError
- API returns non-200 status → Error from response body in ApiClient.request()
- Invalid executor string format → Error from parseExecutorString()

## Cross-Cutting Concerns

**Logging:**
- Command output to stdout (tables, JSON, success messages)
- Errors to stderr via console.error()
- Verbose API details to stderr when --verbose set (via `verboseLog()` in `src/utils/verbose.ts`)

**Validation:**
- Executor format validation in `parseExecutorString()` checks against `VALID_EXECUTORS`
- Filter validation in `applyFilters()` handles array/scalar comparisons
- Git URL parsing in `extractRepoBasename()` handles multiple URL formats

**Configuration:**
- API URL from `~/.config/vibe-kanban/vk-config.json` or `VK_API_URL` env var (env overrides file)
- Deno runtime config from `deno.json` with compiler options (`strict: true`)
- Git commands run via Deno.Command with proper stdio handling

---

*Architecture analysis: 2026-01-30*
