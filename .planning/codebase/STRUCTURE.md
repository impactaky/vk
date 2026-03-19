# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```text
[project-root]/
├── src/                # CLI implementation: entry point, commands, API client, shared utilities
├── tests/              # Integration-style Deno tests and shared test helpers
├── specs/              # Human-readable product/CLI behavior notes
├── openspec/           # OpenSpec source-of-truth specs, schemas, and archived changes
├── .planning/codebase/ # Generated codebase reference docs for future planning
├── .github/workflows/  # CI workflow definitions
├── deno.json           # Deno tasks, imports, formatter, and linter config
└── README.md           # User-facing install and usage documentation
```

## Directory Purposes

**`src/`:**
- Purpose: All shipped runtime and library code.
- Contains: `src/main.ts`, `src/mod.ts`, domain command modules under `src/commands/`, API transport/config under `src/api/`, and helper modules under `src/utils/`.
- Key files: `src/main.ts`, `src/mod.ts`, `src/api/client.ts`, `src/commands/task-attempts.ts`

**`src/commands/`:**
- Purpose: One file per top-level command domain.
- Contains: Cliffy `Command` definitions for `organization`, `repository`, `workspace`, `config`, `notify`, and `wait`.
- Key files: `src/commands/organization.ts`, `src/commands/repository.ts`, `src/commands/task-attempts.ts`, `src/commands/config.ts`, `src/commands/notify.ts`, `src/commands/wait.ts`

**`src/api/`:**
- Purpose: Remote transport, config persistence, and shared DTOs.
- Contains: `ApiClient`, config file helpers, and API-facing TypeScript interfaces.
- Key files: `src/api/client.ts`, `src/api/config.ts`, `src/api/types.ts`

**`src/utils/`:**
- Purpose: Reusable helpers consumed by commands and tests.
- Contains: resolvers, git helpers, `fzf` integration, filter logic, error handling, executor parsing, verbose logging, and AI help generation.
- Key files: `src/utils/repository-resolver.ts`, `src/utils/attempt-resolver.ts`, `src/utils/git.ts`, `src/utils/fzf.ts`

**`tests/`:**
- Purpose: End-to-end and integration coverage that runs the CLI as an external process or talks to a configured API.
- Contains: integration tests per feature area plus the server readiness helper.
- Key files: `tests/cli_commands_integration_test.ts`, `tests/task_attempts_integration_test.ts`, `tests/helpers/test-server.ts`

**`specs/`:**
- Purpose: Human-maintained behavioral reference outside OpenSpec deltas.
- Contains: current CLI behavior notes.
- Key files: `specs/cli.md`

**`openspec/`:**
- Purpose: Formal specification artifacts and archived change history.
- Contains: active and archived changes, source-of-truth specs, templates, and schema definitions.
- Key files: `openspec/specs/task-attempts-subcommands/spec.md`, `openspec/specs/task-attempts-id-autodetect/spec.md`, `openspec/config.yaml`

**`.planning/codebase/`:**
- Purpose: Generated analysis docs consumed by GSD planning and execution commands.
- Contains: `ARCHITECTURE.md`, `STRUCTURE.md`, `STACK.md`, `INTEGRATIONS.md`, `CONVENTIONS.md`, `TESTING.md`, `CONCERNS.md`
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `src/main.ts`: Runtime CLI entry point and command composition root.
- `src/mod.ts`: Library export surface for external TypeScript consumers.

**Configuration:**
- `deno.json`: Runtime tasks, dependency imports, strict compiler config, fmt/lint include paths.
- `src/api/config.ts`: User config persistence in `~/.config/vibe-kanban/vk-config.json` plus env overrides.
- `openspec/config.yaml`: OpenSpec project configuration.

**Core Logic:**
- `src/api/client.ts`: All HTTP endpoint calls and workspace endpoint fallback logic.
- `src/commands/task-attempts.ts`: Largest command domain and the main workflow surface for workspace operations.
- `src/utils/repository-resolver.ts`: Auto-detect repo IDs from git/path context.
- `src/utils/attempt-resolver.ts`: Auto-detect workspace IDs from current branch or `fzf`.

**Testing:**
- `src/utils/*_test.ts`: Small unit tests beside helper modules.
- `src/commands/wait_test.ts`: Unit test beside `wait` command logic.
- `tests/*.ts`: Integration and CLI process tests.

## Naming Conventions

**Files:**
- Lowercase kebab-style or noun-based TypeScript filenames ending in `.ts`: `src/utils/error-handler.ts`, `src/commands/task-attempts.ts`
- Unit tests stay next to the module with `_test.ts`: `src/utils/filter_test.ts`
- Integration tests live in `tests/` with `_integration_test.ts`: `tests/repository_resolver_integration_test.ts`

**Directories:**
- Top-level runtime directories are short, role-based nouns: `src/`, `tests/`, `specs/`, `openspec/`
- Subdirectories under `src/` represent layers, not feature packages: `src/commands/`, `src/api/`, `src/utils/`

## Where to Add New Code

**New Top-Level CLI Feature:**
- Primary code: add a new command module under `src/commands/` and register it in `src/main.ts`
- Shared remote calls: extend `src/api/client.ts` and add/update DTOs in `src/api/types.ts`
- Tests: add command-facing integration coverage under `tests/` and unit coverage beside any new helper module

**New Subcommand Within an Existing Domain:**
- Implementation: edit the relevant domain file in `src/commands/`
- Shared validation or lookup logic: move reusable pieces into `src/utils/` instead of growing long inline action bodies
- Specs: update `specs/cli.md` and any relevant `openspec/specs/**/spec.md`

**New API Model or Endpoint Support:**
- Implementation: add request/response types to `src/api/types.ts` and methods to `src/api/client.ts`
- Consumers: call the new client method from the appropriate command module rather than issuing `fetch` directly

**Utilities:**
- Shared helpers: `src/utils/`
- Git-aware helpers: `src/utils/git.ts` or a sibling module in `src/utils/`
- Interactive selection helpers: `src/utils/fzf.ts` or sibling resolver modules

**Tests:**
- Pure helper behavior: colocate `_test.ts` next to the source file in `src/`
- End-to-end CLI flows or server-backed behavior: add `*_integration_test.ts` under `tests/`

## Special Directories

**`.github/workflows/`:**
- Purpose: CI automation definitions
- Generated: No
- Committed: Yes

**`openspec/changes/archive/`:**
- Purpose: Historical record of completed OpenSpec changes with proposal/design/tasks/spec deltas
- Generated: Semi-generated by workflow, then maintained in git
- Committed: Yes

**`.codex/`, `.claude/`, `.cursor/`, `.gemini/`, `.opencode/`, `.agents/`:**
- Purpose: Agent and command metadata for different tooling environments
- Generated: Mixed; treated as repository configuration
- Committed: Yes

## Placement Guidance

- Keep `src/main.ts` thin. Register commands there, but place domain behavior in `src/commands/`.
- Do not create feature-specific service directories unless the current three-layer split (`commands` / `api` / `utils`) stops being sufficient. The codebase currently prefers expanding those existing buckets.
- Put reusable lookup logic in resolver/helper modules, not inline in command actions. `src/utils/repository-resolver.ts` and `src/utils/attempt-resolver.ts` are the precedent.
- Keep HTTP concerns centralized in `src/api/client.ts`. New commands should call client methods instead of duplicating URL construction or response parsing.
- Put CLI contract changes in both executable code and text specs: `specs/cli.md` for the human-readable summary, and `openspec/specs/**/spec.md` when the change is under formal spec management.

---

*Structure analysis: 2026-03-19*
