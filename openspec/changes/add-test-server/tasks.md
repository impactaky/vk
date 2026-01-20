# Tasks: Add Test Server Image

## 1. Docker Infrastructure

- [ ] 1.1 Create `Dockerfile.test-server` wrapping `npx vibe-kanban`
- [ ] 1.2 Create `docker-compose.yml` with health check configuration

## 2. Test Helpers

- [ ] 2.1 Create `tests/helpers/test-server.ts` for server lifecycle management
- [ ] 2.2 Create `tests/helpers/test-data.ts` for test data utilities

## 3. Integration Tests

- [ ] 3.1 Create `tests/api_integration_test.ts` with project CRUD tests
- [ ] 3.2 Add task CRUD integration tests
- [ ] 3.3 Add attempt operation integration tests
- [ ] 3.4 Add repository operation integration tests

## 4. CI/CD Updates

- [ ] 4.1 Update `.github/workflows/ci.yml` with integration test job
- [ ] 4.2 Update `deno.json` with `test:integration` task

## 5. Validation

- [ ] 5.1 Run `deno fmt` and `deno lint` to verify code style
- [ ] 5.2 Run `deno test` to verify unit tests still pass
- [ ] 5.3 Test Docker setup locally with `docker compose up`
