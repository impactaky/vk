## Why

Task-attempt create/spin-off integration tests currently rely on in-process mock
HTTP servers. The team requires these tests to run against the real API
instance launched via Docker Compose.

## What Changes

- Replace mock-backed create/spin-off success tests with real-instance tests.
- Seed test inputs from live API endpoints (`/task-attempts`, `/repos`).
- Keep validation-only tests unchanged where mocks are unnecessary.

## Capabilities

### Modified Capabilities

- `task-attempts-subcommands`: integration tests validate create/spin-off
  behavior against real API instance instead of mock servers.

## Impact

- Integration tests: `tests/task_attempts_integration_test.ts`
