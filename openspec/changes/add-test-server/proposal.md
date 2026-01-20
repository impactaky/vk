# Change: Add Test Server Image for Integration Testing

## Why

The vk CLI currently lacks integration tests against a real vibe-kanban server. Existing tests are unit tests that don't verify actual API communication. This makes it difficult to catch integration bugs and validate the CLI works correctly with the vibe-kanban backend.

## What Changes

- Add `Dockerfile.test-server` that wraps `npx vibe-kanban` for containerized server deployment
- Add `docker-compose.yml` for local development and testing convenience
- Add integration test suite for API client endpoints (projects, tasks, attempts, repositories)
- Update CI workflow to run integration tests with a live vibe-kanban server
- Add test helper modules for server lifecycle management and test data utilities

## Impact

- Affected specs: New `testing` capability
- Affected code:
  - `.github/workflows/ci.yml` - Add integration test job
  - `deno.json` - Add integration test task
  - `tests/` - Add integration test files and helpers
  - Root directory - Add Docker configuration files
