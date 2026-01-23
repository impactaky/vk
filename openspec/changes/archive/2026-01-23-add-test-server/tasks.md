# Tasks: Add Test Server Image

## 1. Docker Infrastructure

- [x] 1.1 Create `Dockerfile.test-server` wrapping `npx vibe-kanban`
- [x] 1.2 Create `docker-compose.yml` with health check configuration

## 2. Test Helpers

- [x] 2.1 Create `tests/helpers/test-server.ts` for server lifecycle management
- [x] 2.2 Create `tests/helpers/test-data.ts` for test data utilities

## 3. Integration Tests

- [x] 3.1 Create `tests/api_integration_test.ts` with API endpoint tests
- [x] 3.2 Add project CRUD integration tests
- [x] 3.3 Add repository listing integration tests
- [x] 3.4 Add task and attempt listing integration tests

## 4. CI/CD Updates

- [x] 4.1 Update `.github/workflows/ci.yml` with integration test job
- [x] 4.2 Update `deno.json` with `test:integration` task

## 5. Validation

- [x] 5.1 Run `deno fmt` and `deno lint` to verify code style
- [x] 5.2 Run `deno test` to verify unit tests still pass
- [x] 5.3 Test with running vibe-kanban server - all integration tests pass
