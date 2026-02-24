## Why

`--file` prompt input currently reads file content but does not validate that the
resulting prompt is non-empty. Empty files (for example `x.txt` created as a
placeholder) produce confusing downstream behavior.

## What Changes

- Validate prompt content after resolving `--description` or `--file`.
- Reject empty/whitespace prompt content with clear CLI errors.
- Add integration tests that cover empty-file prompt failures.

## Capabilities

### Modified Capabilities

- `task-attempts-subcommands`: prompt-source validation requires non-empty
  prompt content for `create` and `spin-off`.

## Impact

- CLI behavior: `src/commands/task-attempts.ts`
- Integration tests: `tests/task_attempts_integration_test.ts`
- CLI spec docs: `specs/cli.md`
