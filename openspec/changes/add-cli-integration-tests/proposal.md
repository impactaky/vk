# Change: Add CLI Integration Tests

## Why
Current integration tests only verify API endpoints via `fetch()` calls. There are no tests that invoke actual CLI commands, leaving a gap in test coverage. CLI-level tests ensure the full command flow works end-to-end, including argument parsing, output formatting, and error handling.

## What Changes
- Add CLI runner helper to invoke CLI commands via `Deno.Command`
- Add integration tests for all CLI command groups (project, task, attempt, repository, config)
- Update deno.json to allow subprocess spawning in integration tests

## Impact
- Affected specs: `testing`
- Affected code: `vk/tests/`, `vk/deno.json`
