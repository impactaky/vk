## Why

`vk task-attempts spin-off` currently calls
`POST /api/task-attempts/:id/spin-off`, but that endpoint is not supported by
vibe-kanban backend (runtime returns 405).

## What Changes

- Correct spin-off command implementation to use
  `POST /api/task-attempts/create-and-start`.
- Derive spin-off repo inputs from parent task-attempt repos and parent branch.
- Keep command UX as `vk task-attempts spin-off [id] --description <text>` with
  optional id auto-detect.
- Update tests/docs/spec text to reflect the real API contract.

## Capabilities

### Modified Capabilities

- `task-attempts-subcommands`: Adjust spin-off behavior to match
  backend-supported API flow.

## Impact

- CLI behavior: `src/commands/task-attempts.ts`
- API client/type usage: `src/api/client.ts`, `src/api/types.ts`
- Test coverage: `tests/task_attempts_integration_test.ts`
- Docs/spec sync: `specs/cli.md`
