# Codebase Structure

**Analysis Date:** 2026-02-08

## Directory Layout

```
vk/
├── src/                              # Source code
│   ├── main.ts                       # CLI entry point with Cliffy Command setup
│   ├── mod.ts                        # Public library entry point (barrel file for deno doc / JSR)
│   ├── api/                          # API client layer
│   │   ├── client.ts                 # ApiClient class with all API methods
│   │   ├── config.ts                 # Config file management and loading
│   │   └── types.ts                  # TypeScript types for API responses and models
│   ├── commands/                     # CLI command handlers
│   │   ├── project.ts                # Project list/show/create/update/delete/repos commands
│   │   ├── task.ts                   # Task list/show/create/update/delete/open commands
│   │   ├── attempt.ts                # Attempt (workspace) list/show/create/update/delete/merge/push/pr commands
│   │   ├── repository.ts             # Repository list/show/register/init commands
│   │   └── config.ts                 # Config set/show commands
│   └── utils/                        # Utilities and helpers
│       ├── project-resolver.ts       # Resolve project ID from git or interactive selection
│       ├── attempt-resolver.ts       # Resolve attempt/task ID from git branch or user input
│       ├── repository-resolver.ts    # Resolve repository ID from git or user input
│       ├── filter.ts                 # Generic filtering utility for array of objects
│       ├── fzf.ts                    # Interactive selection via fzf subprocess
│       ├── git.ts                    # Git utilities (extract remote URL, repo basename)
│       ├── markdown-parser.ts        # Parse task metadata from markdown files
│       ├── executor-parser.ts        # Parse executor strings (name:variant format)
│       ├── error-handler.ts          # Centralized error handling and exit logic
│       ├── ai-help.ts                # Generate AI-friendly CLI documentation
│       └── verbose.ts                # Verbose logging flag management
├── tests/                            # Test files
│   ├── api_client_test.ts            # ApiClient unit tests
│   ├── executor_parser_test.ts       # Executor parser unit tests
│   ├── api_integration_test.ts       # API integration tests with mock server
│   ├── project_resolver_integration_test.ts
│   ├── repository_resolver_integration_test.ts
│   ├── filter_integration_test.ts    # Filter function integration tests
│   └── helpers/
│       ├── test-server.ts            # Mock vibe-kanban API server for testing
│       └── test-data.ts              # Fixture data for tests
├── deno.json                         # Deno configuration, imports, tasks
├── deno.lock                         # Dependency lock file
├── docker-compose.yml                # Local development setup with vibe-kanban backend
├── README.md                         # User-facing documentation
└── .planning/                        # GSD planning documents
    └── codebase/
        ├── ARCHITECTURE.md           # This analysis
        ├── STRUCTURE.md              # This document
        └── ...                       # Other codebase analyses
```

## Directory Purposes

**src/api/:**

- Purpose: Encapsulate all backend API communication
- Contains: HTTP client, configuration loading, type definitions
- Key files: `client.ts` (ApiClient class), `config.ts` (config file I/O),
  `types.ts` (30+ type definitions)

**src/commands/:**

- Purpose: Map user CLI input to API client calls and output formatting
- Contains: Five command modules, each defining a nested command tree via Cliffy
- Key files: `project.ts` (267 lines), `attempt.ts` (767 lines, largest),
  `task.ts` (335 lines)

**src/utils/:**

- Purpose: Shared business logic for resolving identifiers, filtering,
  interactive selection, parsing
- Contains: 11 utility modules, each handling a specific cross-cutting concern
- Key files: `project-resolver.ts` (163 lines), `fzf.ts` (179 lines), `git.ts`
  (157 lines)

**tests/:**

- Purpose: Unit and integration tests
- Contains: 8 test files including mock server setup
- Strategy: Colocated with fixtures in helpers/ subdirectory, mock server allows
  testing API integration

## Key File Locations

**Entry Points:**

- `src/main.ts`: Cliffy Command initialization, global option parsing, command
  registration
- `src/api/client.ts`: ApiClient factory and all API methods
- `src/commands/project.ts`: First command handler to demonstrate pattern

**Configuration:**

- `src/api/config.ts`: Config file path logic, loadConfig(), saveConfig(),
  getApiUrl()
- `deno.json`: Deno runtime configuration, task definitions, import map

**Core Logic:**

- `src/commands/project.ts`: Project CRUD operations and repository management
  (272 lines)
- `src/commands/task.ts`: Task operations including markdown file parsing (335
  lines)
- `src/commands/attempt.ts`: Workspace (attempt) operations, most complex
  command (767 lines)
- `src/utils/project-resolver.ts`: Git-based project detection (163 lines)
- `src/utils/fzf.ts`: Interactive selection wrapper (179 lines)

**Testing:**

- `tests/api_client_test.ts`: ApiClient unit tests
- `tests/helpers/test-server.ts`: Mock backend server implementation
- `tests/helpers/test-data.ts`: Fixture data and factory functions

## Naming Conventions

**Files:**

- Kebab-case for module names: `project-resolver.ts`, `error-handler.ts`,
  `markdown-parser.ts`
- Test files: `{module}_test.ts` for unit tests, `{module}_integration_test.ts`
  for integration tests
- Commands: Direct resource name: `project.ts`, `task.ts`, `attempt.ts`

**Directories:**

- Plural for collections: `src/commands/`, `src/utils/`, `tests/`
- Flat structure under src (no nested command directories)

**Functions:**

- camelCase for functions: `getProjectId()`, `resolveProjectFromGit()`,
  `applyFilters()`
- PascalCase for classes: `ApiClient`, `ProjectResolverError`,
  `FzfNotInstalledError`
- Descriptive names with verbs: `selectProject()`, `formatTask()`,
  `extractRepoBasename()`

**Types:**

- PascalCase for interfaces: `Project`, `Task`, `Workspace`, `CreateTask`,
  `UpdateProject`
- Suffix pattern for variants: `Create{Resource}` (CreateProject),
  `Update{Resource}` (UpdateTask)
- Union types for enums:
  `type TaskStatus = "todo" | "inprogress" | "inreview" | "done" | "cancelled"`

## Where to Add New Code

**New Command:**

1. Create `src/commands/newresource.ts` exporting a Cliffy Command
2. Import in `src/main.ts` and register via
   `.command("newresource", newResourceCommand)`
3. Implement subcommands (list, show, create, update, delete) following existing
   command pattern
4. Use ApiClient for all API calls, utilities for ID resolution/filtering
5. Use `handleCliError()` for consistent error handling
6. Add tests in `tests/newresource_test.ts` and
   `tests/newresource_integration_test.ts`
7. Add JSDoc comments to all exported functions and types
8. Run pre-commit checks:
   `deno fmt --check && deno lint && deno check src/main.ts`

**New Utility:**

1. Create `src/utils/new-utility.ts` exporting functions or classes
2. If custom error handling needed, extend Error class with custom name (e.g.,
   `NewUtilityError`)
3. Add to centralized error handler `src/utils/error-handler.ts` if user-facing
4. Add unit tests in `src/utils/{new-utility}_test.ts` (if not
   integration-dependent)
5. Add integration tests in `tests/new_utility_integration_test.ts`
6. Add JSDoc comments to all exported functions and classes
7. If the utility is part of the public API, re-export from `src/mod.ts`
8. Run pre-commit checks:
   `deno fmt --check && deno lint && deno check src/main.ts`

**New API Method:**

1. Add method to ApiClient class in `src/api/client.ts`
2. Add types to `src/api/types.ts` (request/response types)
3. Follow existing pattern: private `request<T>()` method, verbose logging
   support
4. Test via `tests/api_client_test.ts` mock server
5. Add JSDoc comment to the new method with `@param` and `@returns` tags
6. If adding new types to `src/api/types.ts`, add JSDoc to each exported type
7. Run pre-commit checks:
   `deno fmt --check && deno lint && deno check src/main.ts`

**New Configuration:**

1. Add field to Config interface in `src/api/config.ts`
2. Add to loadConfig() default values and saveConfig() serialization
3. Add environment variable override in loadConfig()
4. Create `config` subcommand in `src/commands/config.ts` to expose
   getter/setter
5. Add JSDoc to new Config fields and any new exported functions
6. Run pre-commit checks:
   `deno fmt --check && deno lint && deno check src/main.ts`

## Special Directories

**`.planning/codebase/`:**

- Purpose: GSD (Generation-Spawn-Decide) codebase analysis documents
- Generated: Automatically by gsd-map-codebase orchestrator
- Committed: Yes, provides architectural reference for future development

**`openspec/changes/`:**

- Purpose: Change proposals and specifications (OpenSpec format)
- Generated: Manually via pull requests
- Committed: Yes, historical record of changes

**`.claude/`, `.cursor/`, `.gemini/`:**

- Purpose: AI editor-specific configuration and preferences
- Generated: Via editor settings
- Committed: Yes, for team consistency

## Import Organization

**Pattern:**

1. Cliffy and external libraries: `import { Command } from "@cliffy/command"`
2. Deno standard library: `import { join } from "@std/path"`
3. Project internal (api): `import { ApiClient } from "../api/client.ts"`
4. Project internal (utils):
   `import { getProjectId } from "../utils/project-resolver.ts"`
5. Type-only imports: `import type { Project } from "../api/types.ts"`

**Example from src/commands/task.ts:**

```typescript
import { Command } from "@cliffy/command"; // External CLI library
import { open } from "@opensrc/deno-open"; // External deno package
import { ApiClient } from "../api/client.ts"; // API layer
import { getProjectId } from "../utils/project-resolver.ts"; // Utils
import type { CreateTask } from "../api/types.ts"; // Types only
```

**Path Aliases:**

- No aliases defined. Relative imports only (../api, ../utils)

---

_Structure analysis: 2026-01-30_
