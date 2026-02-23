## Why

`vk task-attempts` currently exposes only `list` and `show`, while the API already supports a much broader workspace/task-attempt lifecycle. This gap blocks common operator workflows and forces users to fall back to ad-hoc API usage when they need create/update/delete, branch operations, and PR-related actions.

## What Changes

- Add CLI coverage for the remaining `api/task-attempts` surface via new `vk task-attempts` subcommands, implemented in phased, one-subcommand-per-PR slices.
- Add optional attempt ID auto-detection for commands that accept `[id]`, with resolver order: explicit ID, current git branch match, then interactive selection.
- Add nested PR command grouping under `vk task-attempts pr` (including `attach` and `comments`) to keep related behavior discoverable and consistent.
- Define consistent success/output behavior (human-readable + `--json`) and align docs/tests as each subcommand ships.

## Capabilities

### New Capabilities

- `task-attempts-subcommands`: Defines CLI requirements for new `vk task-attempts` subcommands mapped to the corresponding API endpoints (CRUD, repo/branch status, git operations, and PR operations).
- `task-attempts-id-autodetect`: Defines resolver behavior for optional `[id]` across task-attempt commands, including branch-based detection and interactive fallback.

### Modified Capabilities

- None.

## Impact

- CLI command surface: `src/commands/task-attempts.ts`, related command wiring in `src/main.ts`.
- Resolver and selection logic: `src/utils/project-resolver.ts`, `src/utils/repository-resolver.ts`, and task-attempt resolver/fzf selection helpers.
- API contract usage: `src/api/client.ts` and `src/api/types.ts` for request/response shape coverage.
- Test and docs alignment: integration/CLI tests plus `specs/cli.md` updates per delivered subcommand.
