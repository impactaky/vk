# Change: Add Docker-based Integration Testing

## Why
Integration tests were silently skipped when the vibe-kanban server was unavailable, hiding test failures. A Docker Compose setup enables reliable, reproducible integration testing by running both the server and tests in containers.

## What Changes
- Add Docker Compose configuration with vibe-kanban server and test runner containers
- Remove test skip logic that silently bypassed tests when server unavailable
- Add `VK_API_URL` environment variable support to config for container networking

## Impact
- Affected specs: cli-commands (config command)
- Affected code:
  - `docker-compose.yml` - New container definitions
  - `src/api/config.ts` - Environment variable override
  - `tests/api_integration_test.ts` - Remove skip logic
  - `tests/repository_resolver_integration_test.ts` - Remove skip logic
  - `tests/helpers/test-server.ts` - Use shared config
