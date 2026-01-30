# Codebase Structure

**Analysis Date:** 2026-01-30

## Directory Layout

```
vk/
├── src/                      # Source code
│   ├── main.ts               # CLI entry point
│   ├── api/                  # API client and types
│   │   ├── client.ts         # ApiClient class
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── config.ts         # Configuration management
│   ├── commands/             # CLI command handlers
│   │   ├── project.ts        # Project command
│   │   ├── task.ts           # Task command
│   │   ├── attempt.ts        # Workspace/attempt command
│   │   ├── repository.ts     # Repository command
│   │   └── config.ts         # Config command
│   └── utils/                # Utility helpers
│       ├── project-resolver.ts          # Auto-detect project from git
│       ├── attempt-resolver.ts          # Auto-detect workspace from branch
│       ├── repository-resolver.ts       # Repository selection utilities
│       ├── filter.ts                    # Generic filtering for lists
│       ├── fzf.ts                       # Interactive selection via fzf
│       ├── git.ts                       # Git command wrappers
│       ├── executor-parser.ts           # Parse executor:variant strings
│       ├── markdown-parser.ts           # Extract title/desc from markdown
│       ├── error-handler.ts             # Centralized error handling
│       ├── ai-help.ts                   # AI-friendly documentation generation
│       ├── verbose.ts                   # Global verbose logging
│       └── [name]_test.ts               # Co-located unit tests
├── tests/                    # Integration tests
│       ├── *_integration_test.ts
│       └── helpers/          # Test utilities
│           ├── test-data.ts
│           └── test-server.ts
├── deno.json                 # Deno configuration and task definitions
├── deno.lock                 # Dependency lock file
├── .planning/
│   └── codebase/             # GSD documentation (this location)
└── openspec/                 # Change proposals and specs

```

## Directory Purposes

**src/:**
- Purpose: All production source code for the CLI
- Contains: Entry point, API client, command handlers, utilities
- Key files: `main.ts` (entry), `api/client.ts` (HTTP wrapper), `commands/*.ts` (user-facing)

**src/api/:**
- Purpose: Backend API communication and type contracts
- Contains: HTTP client, type definitions, configuration
- Key files:
  - `client.ts`: ApiClient class with ~30 methods for all endpoints (projects, tasks, workspaces, repos)
  - `types.ts`: 20+ interfaces matching vibe-kanban API (Project, Task, Workspace, Repo, etc.)
  - `config.ts`: Load/save config from home directory

**src/commands/:**
- Purpose: Define and implement all CLI commands
- Contains: 5 command modules (project, task, attempt, repository, config)
- Key files:
  - `project.ts`: list, show, create, update, delete, add-repo, remove-repo
  - `task.ts`: list, show, create, update, delete, open
  - `attempt.ts`: list, show, create, update, delete, merge, push, rebase, stop, pr, branch-status
  - `repository.ts`: registry, init operations
  - `config.ts`: set, show configuration

**src/utils/:**
- Purpose: Reusable helpers for resolving IDs, formatting output, git integration
- Contains: 16 utility modules (resolvers, formatters, validators, git helpers)
- Key modules:
  - `project-resolver.ts`: Auto-detect project from git repo, with fzf fallback
  - `attempt-resolver.ts`: Auto-detect workspace from current branch
  - `repository-resolver.ts`: Repository selection and validation
  - `filter.ts`: Generic filtering function for list filtering
  - `fzf.ts`: Wrapper around fzf executable for interactive selection
  - `git.ts`: Git command runners (branch, remote, url parsing)
  - `executor-parser.ts`: Validate and parse "AGENT:VARIANT" strings
  - `markdown-parser.ts`: Extract task title/description from markdown files
  - `error-handler.ts`: Catch and convert errors to CLI messages
  - `verbose.ts`: Global state for --verbose flag
  - `ai-help.ts`: Generate JSON documentation for AI systems

**tests/:**
- Purpose: Integration tests for API client and resolvers
- Contains: 8 test files covering api-client, project-resolver, repository-resolver, executor-parser
- Pattern: Files named `*_integration_test.ts` (run with `deno test`)
- Helpers: test-data.ts (mock data), test-server.ts (mock HTTP server)

## Key File Locations

**Entry Points:**
- `src/main.ts`: Root CLI executable, registers all subcommands, parses global options

**Configuration:**
- `src/api/config.ts`: Loads config from `~/.config/vibe-kanban/vk-config.json`
- `deno.json`: Task definitions (dev, test, lint, fmt, check) and import map

**Core Logic:**
- `src/api/client.ts`: ApiClient with methods for all API endpoints
- `src/commands/*.ts`: Command implementations that orchestrate resolvers + client
- `src/utils/project-resolver.ts`: Auto-detects project from git (core feature)
- `src/utils/attempt-resolver.ts`: Auto-detects workspace from branch

**Testing:**
- `tests/api_client_test.ts`: Unit tests for ApiClient
- `tests/project_resolver_integration_test.ts`: Integration test with mock server
- `tests/executor_parser_test.ts`: Validation tests

## Naming Conventions

**Files:**
- Command files: `lowercase-dash-case.ts` (e.g., `project-resolver.ts`, `error-handler.ts`)
- Test files: `*_test.ts` for unit tests co-located with source, `*_integration_test.ts` in tests/ dir
- Config files: `deno.json`, `.config/vibe-kanban/vk-config.json`

**Directories:**
- Lowercase: `src/`, `tests/`, `api/`, `utils/`, `commands/`
- Descriptive: `helpers/` for test utilities

**Functions:**
- camelCase: `getProjectId()`, `resolveProjectFromGit()`, `applyFilters()`
- Action verbs: resolve*, get*, apply*, select*, format*, parse*

**Types:**
- PascalCase: `ApiClient`, `Project`, `Task`, `Workspace`, `ProjectResolverError`
- Descriptive suffixes: `...Request`, `...Response`, `...Error`, `...Status`

**Classes:**
- PascalCase: `ApiClient`, error classes
- Single class per file (ApiClient is only class in client.ts)

**Variables:**
- camelCase: `projectId`, `apiUrl`, `workspaces`
- Descriptive names: avoid abbreviations except `id`, `url`

## Where to Add New Code

**New CLI Command:**
1. Create file in `src/commands/new-thing.ts`
2. Export a `Command` instance (e.g., `export const thingCommand = new Command()`)
3. Define subcommands with `.command("subcommand")` and `.action(async (options) => {})`
4. Import and register in `src/main.ts`: `.command("thing", thingCommand)`
5. Add corresponding types to `src/api/types.ts` if new data types needed
6. Add API methods to `ApiClient` in `src/api/client.ts` if new endpoints

**New Utility Function:**
- Create in `src/utils/new-utility.ts` if general purpose
- Or add to existing file if it's a variant of existing utility (e.g., fzf-related → `src/utils/fzf.ts`)
- Export functions and any custom error classes
- Add unit tests as `src/utils/new-utility_test.ts`

**New API Endpoint:**
1. Add TypeScript interfaces to `src/api/types.ts` (e.g., `CreateNewThing`, `NewThing`)
2. Add method to `ApiClient` class in `src/api/client.ts`:
   ```typescript
   createNewThing(thing: CreateNewThing): Promise<NewThing> {
     return this.request<NewThing>("/endpoint", {
       method: "POST",
       body: JSON.stringify(thing),
     });
   }
   ```
3. Call from appropriate command handler in `src/commands/`

**New Test:**
- Unit tests: `src/utils/my-util_test.ts` (co-located, single Deno.test per concern)
- Integration tests: `tests/my_integration_test.ts` (uses test-server.ts for mock HTTP)

## Special Directories

**src/api/:**
- Purpose: Backend API abstraction layer
- Generated: No (hand-written)
- Committed: Yes

**.planning/codebase/:**
- Purpose: GSD (Guided Specification & Development) documentation
- Generated: Yes (created by GSD tools)
- Committed: Yes

**openspec/:**
- Purpose: Change proposals and architectural specifications
- Generated: No (created manually via openspec CLI)
- Committed: Yes (in `/openspec/specs` and `/openspec/changes`)

**tests/helpers/:**
- Purpose: Shared test utilities (mock server, test data fixtures)
- Generated: No
- Committed: Yes

## Import Paths

**Relative imports within src/:**
```typescript
// From src/commands/task.ts to sibling module
import { ApiClient } from "../api/client.ts";

// From src/commands/task.ts to utils
import { getProjectId } from "../utils/project-resolver.ts";

// From src/utils to api
import type { ApiClient } from "../api/client.ts";
```

**Import map from deno.json:**
```
@cliffy/command → jsr:@cliffy/command@1.0.0-rc.7
@cliffy/prompt → jsr:@cliffy/prompt@1.0.0-rc.7
@cliffy/table → jsr:@cliffy/table@1.0.0-rc.7
@opensrc/deno-open → jsr:@opensrc/deno-open@^1.0.0
@std/path → jsr:@std/path@1.0.8
@std/assert → jsr:@std/assert@1.0.9
```

## Default Locations for New Features

**Parser utilities:** `src/utils/` (e.g., executor-parser.ts, markdown-parser.ts)

**Resolver utilities:** `src/utils/` (e.g., project-resolver.ts, attempt-resolver.ts)

**Error types:** `src/utils/error-handler.ts` or file where used (ProjectResolverError in project-resolver.ts)

**Type definitions:** `src/api/types.ts` (all API-related types) or command-specific enums in command files

**Configuration:** `src/api/config.ts` for application-wide config

**Tests:** Same directory as source (`_test.ts` suffix) for units, `tests/` for integration

---

*Structure analysis: 2026-01-30*
