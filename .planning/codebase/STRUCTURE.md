# Codebase Structure

**Analysis Date:** 2026-03-17

## Directory Layout

```text
vk/
├── src/                 # Runtime CLI code, library exports, and colocated unit tests
├── tests/               # Integration tests and shared integration helpers
├── openspec/            # OpenSpec source-of-truth specs and archived change artifacts
├── specs/               # Human-readable product/CLI behavior notes
├── .planning/codebase/  # Generated codebase reference documents
├── deno.json            # Deno tasks, imports, exports, fmt, and lint config
└── README.md            # User-facing installation and usage guide
```

## Directory Purposes

**`src/`:**
- Purpose: All executable and importable TypeScript source for the CLI package.
- Contains: top-level entry points, API client/config/types, command handlers, shared utilities, and some colocated unit tests.
- Key files: `src/main.ts`, `src/mod.ts`, `src/api/client.ts`, `src/commands/task-attempts.ts`

**`src/api/`:**
- Purpose: API-facing infrastructure and shared domain contracts.
- Contains: `ApiClient` in `src/api/client.ts`, config persistence in `src/api/config.ts`, and broad type definitions in `src/api/types.ts`.
- Key files: `src/api/client.ts`, `src/api/config.ts`, `src/api/types.ts`

**`src/commands/`:**
- Purpose: Cliffy command definitions for each top-level command family.
- Contains: resource commands (`src/commands/organization.ts`, `src/commands/repository.ts`, `src/commands/task-attempts.ts`) and local/messaging commands (`src/commands/config.ts`, `src/commands/notify.ts`, `src/commands/wait.ts`).
- Key files: `src/commands/task-attempts.ts`, `src/commands/repository.ts`, `src/commands/config.ts`

**`src/utils/`:**
- Purpose: Shared helper modules used across command handlers.
- Contains: resolvers, git/fzf helpers, parsing helpers, filtering, AI help generation, verbose logging, and error handling.
- Key files: `src/utils/repository-resolver.ts`, `src/utils/attempt-resolver.ts`, `src/utils/git.ts`, `src/utils/fzf.ts`

**`tests/`:**
- Purpose: Cross-module and end-to-end style integration coverage against a running vibe-kanban instance.
- Contains: integration tests by feature area plus shared helper bootstrapping.
- Key files: `tests/task_attempts_integration_test.ts`, `tests/cli_commands_integration_test.ts`, `tests/helpers/test-server.ts`

**`openspec/`:**
- Purpose: Specification workflow artifacts for feature planning and archival.
- Contains: active source specs under `openspec/specs/`, configuration in `openspec/config.yaml`, and archived change folders under `openspec/changes/archive/`.
- Key files: `openspec/specs/task-attempts-subcommands/spec.md`, `openspec/specs/task-attempts-id-autodetect/spec.md`, `openspec/config.yaml`

**`specs/`:**
- Purpose: Lightweight prose spec outside the OpenSpec tree.
- Contains: `specs/cli.md`
- Key files: `specs/cli.md`

**Tooling and agent directories:**
- Purpose: Store agent/skill definitions for Codex, Claude, Cursor, Gemini, and Opencode workflows.
- Contains: `.codex/skills/**`, `.claude/skills/**`, `.cursor/skills/**`, `.gemini/skills/**`, `.opencode/skills/**`
- Key files: `.codex/skills/lint/SKILL.md`, `.codex/skills/test/SKILL.md`

## Key File Locations

**Entry Points:**
- `src/main.ts`: CLI executable entry point and command registration root.
- `src/mod.ts`: Package/library export surface referenced by `deno.json`.

**Configuration:**
- `deno.json`: Runtime tasks, dependency imports, package export map, and lint/fmt scopes.
- `src/api/config.ts`: Runtime config file loading and environment overrides.
- `openspec/config.yaml`: OpenSpec workflow configuration.

**Core Logic:**
- `src/api/client.ts`: Typed HTTP client for all server operations.
- `src/commands/task-attempts.ts`: Largest command surface; workspace lifecycle and PR subcommands.
- `src/utils/repository-resolver.ts`: Repository autodetection and fallback selection.
- `src/utils/attempt-resolver.ts`: Workspace autodetection and fallback selection.

**Testing:**
- `tests/helpers/test-server.ts`: Shared API-availability helper for integration tests.
- `tests/api_client_test.ts`: API client coverage.
- `tests/task_attempts_integration_test.ts`: Workspace command integration coverage.
- `src/utils/*_test.ts`: Small unit tests colocated with helpers.

## Naming Conventions

**Files:**
- Use lowercase kebab-case or simple lowercase names with `.ts`, matching feature responsibility: `src/commands/task-attempts.ts`, `src/utils/error-handler.ts`, `tests/task_attempts_integration_test.ts`.
- Use `_test.ts` for tests inside `src/` and `_integration_test.ts` for tests in `tests/`.
- Use `spec.md`, `proposal.md`, `design.md`, and `tasks.md` inside `openspec/` change/spec folders.

**Directories:**
- Keep top-level runtime code grouped by concern: `src/api`, `src/commands`, `src/utils`.
- Keep integration helpers under `tests/helpers/`.
- Keep OpenSpec source specs under `openspec/specs/<capability>/` and archived work under `openspec/changes/archive/<date-change-name>/`.

## Where to Add New Code

**New CLI Feature:**
- Primary command wiring: add the top-level or nested command in `src/main.ts` or the relevant existing command file in `src/commands/`.
- Shared API call: add the typed method to `src/api/client.ts` and any payload/response interfaces to `src/api/types.ts`.
- Tests: put integration coverage in `tests/` when the feature depends on the real API, and colocated helper tests in `src/**/_test.ts` for pure utility logic.

**New Command Under an Existing Domain:**
- Organization behavior: extend `src/commands/organization.ts`.
- Repository behavior: extend `src/commands/repository.ts`.
- Workspace/task-attempt behavior: extend `src/commands/task-attempts.ts`.
- Avoid creating a new top-level command file unless the command family is conceptually separate and also needs registration in `src/main.ts`.

**New Resolver or Shell Helper:**
- Implementation: place reusable context-detection or subprocess code in `src/utils/`.
- Tests: colocate pure helper tests beside the module, following the existing `src/utils/*_test.ts` pattern.

**New Public Library Export:**
- Implementation: add the runtime module under `src/`.
- Exposure: re-export it from `src/mod.ts` only if it is intended for package consumers.

**Specification Updates:**
- Source-of-truth delta or capability specs: update `openspec/specs/**/spec.md`.
- User-readable behavior summary: update `specs/cli.md` when command behavior changes materially.

## Special Directories

**`.planning/codebase/`:**
- Purpose: Generated analysis docs consumed by planning and execution workflows.
- Generated: Yes
- Committed: Yes

**`openspec/changes/archive/`:**
- Purpose: Historical record of completed OpenSpec changes with proposal/design/tasks/spec deltas.
- Generated: No
- Committed: Yes

**`tests/helpers/`:**
- Purpose: Shared integration-test support code.
- Generated: No
- Committed: Yes

**Agent metadata directories (`.codex/`, `.claude/`, `.cursor/`, `.gemini/`, `.opencode/`):**
- Purpose: Local automation commands and skill definitions.
- Generated: No
- Committed: Yes

## Placement Rules

- Put CLI argument parsing and output formatting in `src/commands/*.ts`; do not embed fetch or config persistence details there when a shared helper already exists.
- Put all new HTTP endpoint wrappers in `src/api/client.ts` and define the corresponding request/response types in `src/api/types.ts`.
- Put filesystem, git, subprocess, and interactive selection support in `src/utils/`.
- Keep unit tests near utilities when they do not need external services, matching `src/utils/filter_test.ts` and `src/commands/wait_test.ts`.
- Keep integration tests in `tests/` when they spawn the CLI or talk to the configured API server, matching `tests/cli_commands_integration_test.ts` and `tests/task_attempts_integration_test.ts`.

---

*Structure analysis: 2026-03-17*
