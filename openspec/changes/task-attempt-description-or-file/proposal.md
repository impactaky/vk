## Why

`vk task-attempts create` and `vk task-attempts spin-off` currently require
inline `--description` text. In the OPSX flow, prompts are often authored in
markdown files, so CLI users need to pass a file path directly.

## What Changes

- Add `--file <path>` support for task-attempt prompt input.
- Accept either `--description` or `--file` for create/spin-off commands.
- Keep clear validation errors for missing or conflicting prompt inputs.
- Update docs and integration tests to reflect the new input contract.

## Capabilities

### Modified Capabilities

- `task-attempts-subcommands`: prompt input for create/spin-off supports either
  inline description or markdown file content.

## Impact

- CLI behavior: `src/commands/task-attempts.ts`
- Integration tests: `tests/task_attempts_integration_test.ts`
- CLI spec docs: `specs/cli.md`
