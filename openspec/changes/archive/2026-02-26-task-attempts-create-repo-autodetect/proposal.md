## Why

`vk task-attempts create` already uses repository resolver utilities that can
auto-detect the current repository from the working directory, but the command
currently hard-fails unless `--repo` is explicitly provided. This creates
unnecessary friction in the common case where users run the command from inside
one registered repo.

## What Changes

- Make `--repo` optional for `vk task-attempts create`.
- Reuse existing repository auto-detection behavior when `--repo` is omitted.
- Keep explicit `--repo <id-or-name>` behavior unchanged.
- Add integration coverage for create-without-repo when current path maps to a
  single registered repo.
- Update CLI documentation for the new contract.

## Capabilities

### Modified Capabilities

- `task-attempts-subcommands`: `vk task-attempts create` resolves repository by
  explicit `--repo` when provided, otherwise auto-detects from current
  directory context.

## Impact

- CLI command behavior: `src/commands/task-attempts.ts`
- Integration tests: `tests/task_attempts_integration_test.ts`
- CLI behavior docs: `specs/cli.md`
