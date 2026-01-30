# Architecture

**Analysis Date:** 2026-01-30

## Pattern Overview

**Overall:** Three-tier CLI architecture with API client abstraction and command-driven separation of concerns.

**Key Characteristics:**
- CLI-first with decorator-based command routing via Cliffy
- API client layer abstracts remote vibe-kanban backend
- Utility modules handle cross-cutting concerns (project resolution, filtering, interactive selection)
- Event-driven model: user actions → commands → utilities → API client → backend
- Thin command layer focused on CLI interface, not business logic

## Layers

**Command Layer:**
- Purpose: Parse CLI arguments, coordinate utilities, and format output for terminal display
- Location: `src/commands/`
- Contains: Five command handlers (project, task, attempt, repository, config) and a shared main CLI entrypoint
- Depends on: API client, utilities (project resolver, filters, error handler, markdown parser), Cliffy
- Used by: Main entrypoint (`src/main.ts`)

**API Client Layer:**
- Purpose: Encapsulate all HTTP communication with the vibe-kanban backend API
- Location: `src/api/client.ts`, `src/api/config.ts`, `src/api/types.ts`
- Contains: Single ApiClient class with 30+ methods for CRUD operations on projects, tasks, workspaces (attempts), and repositories
- Depends on: Fetch API, configuration loader
- Used by: All command handlers, resolver utilities

**Utility/Helper Layer:**
- Purpose: Provide reusable business logic for resolving IDs, filtering, interactive selection, and error handling
- Location: `src/utils/`
- Contains: Project resolver, attempt resolver, repository resolver, filtering, fzf integration, git integration, markdown parsing, error handling
- Depends on: API client, Deno APIs (subprocess for git/fzf), Cliffy
- Used by: Command handlers

**Configuration Layer:**
- Purpose: Manage user configuration and environment settings
- Location: `src/api/config.ts`
- Contains: Config file loading/saving, API URL retrieval with environment variable override
- Depends on: Deno file system APIs
- Used by: API client

## Data Flow

**Project Listing Flow:**

1. User: `vk project list --name Frontend`
2. Main: Parses CLI args, routes to projectCommand
3. Command Handler: Calls `client.listProjects()`
4. API Client: Fetches `/api/projects` via HTTP
5. API Client: Parses JSON response, validates success flag
6. Command Handler: Calls `applyFilters()` to filter by name
7. Output: Renders table or JSON to stdout

**Task Creation with Interactive Selection:**

1. User: `vk task show` (no task ID provided)
2. Command Handler: Calls `getTaskIdWithAutoDetect()`
3. Auto-Detect Utility: Parses git branch for embedded task ID
4. If not found, calls `selectTask()` (fzf)
5. FZF Utility: Checks if fzf is installed, spawns process
6. User interacts with fzf, selects task
7. Command Handler: Gets task details via `client.getTask()`
8. Output: Displays task information

**Project Auto-Detection Flow:**

1. User: `vk task list` (no --project specified)
2. Command Handler: Calls `getProjectId(undefined, client)`
3. Project Resolver: Calls `resolveProjectFromGit(client)`
4. Git Utility: Extracts current repository basename from origin URL
5. Project Resolver: Fetches all projects and their repositories
6. Project Resolver: Matches current basename against project repositories
7. If no match: Falls back to fzf-based selection (if available)
8. Returns project ID to command handler

**State Management:**
- No client-side state management. State flows from backend API only.
- Configuration state persists in `~/.config/vibe-kanban/vk-config.json`
- Request/response logging available via `--verbose` flag for debugging

## Key Abstractions

**ApiClient:**
- Purpose: Encapsulates HTTP protocol details and API URL management
- Examples: `src/api/client.ts`
- Pattern: Single class with static factory method (`create()`) and 30+ instance methods grouped by resource type (projects, tasks, workspaces, repos)
- Notable: Methods handle response parsing, error checking, and optional verbose logging

**ProjectResolver:**
- Purpose: Resolve project ID from explicit parameter, git context, or interactive selection
- Examples: `src/utils/project-resolver.ts`
- Pattern: Three-strategy fallback (explicit ID/name → git auto-detection → fzf selection)
- Errors: Custom `ProjectResolverError` for consistent error handling

**Filters:**
- Purpose: Apply key-value filters to object arrays
- Examples: `src/utils/filter.ts`
- Pattern: Generic `applyFilters<T>()` function that handles primitives, arrays, and undefined values
- Usage: Commands apply filters after fetching data to reduce API calls

**FZF Integration:**
- Purpose: Provide optional interactive CLI selection when fzf is installed
- Examples: `src/utils/fzf.ts`
- Pattern: Check installation, spawn process with piped input/output, parse result
- Errors: `FzfNotInstalledError`, `FzfCancelledError` for graceful fallback

## Entry Points

**CLI Entry Point:**
- Location: `src/main.ts`
- Triggers: Direct invocation: `deno run src/main.ts` or `vk` command when installed
- Responsibilities: Create Cliffy Command, register all subcommands (project, task, attempt, repository, config), handle global flags (`--ai`, `--verbose`), parse and execute

**Command Handlers:**
- Location: `src/commands/{project|task|attempt|repository|config}.ts`
- Triggers: User invokes `vk <command> <subcommand> [args]`
- Responsibilities: Parse command-specific options, call utilities or API client, handle output formatting (tables, JSON, text), delegate error handling

## Error Handling

**Strategy:** Three-tier error handling with custom error types and centralized exit management

**Patterns:**
- **Custom Errors:** Domain-specific error classes (`ProjectResolverError`, `FzfNotInstalledError`, `FzfCancelledError`, `MarkdownParseError`) extend Error with custom names
- **Catch-and-Rethrow:** Commands wrap async operations in try-catch, call `handleCliError()`, then rethrow for type safety
- **Centralized Handler:** `src/utils/error-handler.ts` recognizes known error types, logs message, exits with code 1
- **API Errors:** ApiClient catches non-200 responses, includes HTTP status and response body in error message

**Exception Flow:**
1. Utility throws custom error (e.g., `ProjectResolverError`)
2. Command catches, calls `handleCliError(error)`
3. Handler recognizes error type, prints "Error: {message}" to stderr
4. Handler calls `Deno.exit(1)`

## Cross-Cutting Concerns

**Logging:**
- Default: None (silent operation)
- Verbose mode: Enabled via `--verbose` or `-v` global flag
- Implementation: `src/utils/verbose.ts` maintains boolean state, API client checks state before logging
- Output: Request method/URL, request body, response status, response body printed to console

**Validation:**
- Input validation: Handled at command option level by Cliffy (required options, type coercion)
- API contract validation: ApiClient checks `response.success` flag before returning data
- Markdown validation: `MarkdownParseError` thrown on malformed frontmatter in markdown files

**Authentication:**
- Not implemented. API client sends raw HTTP requests without auth headers.
- Future: Environment variable for API token expected but not currently used

**Configuration:**
- Single config file: `~/.config/vibe-kanban/vk-config.json` contains only `apiUrl`
- Environment override: `VK_API_URL` env var takes precedence over config file
- Default: Falls back to `http://localhost:3000` if config missing

---

*Architecture analysis: 2026-01-30*
