# Change: Add comprehensive API integration tests

## Why

The existing integration test suite had limited coverage of API endpoints. Many CRUD operations for tasks, projects, repositories, and workspaces were not tested, leaving potential issues undetected.

## What Changes

- Add Task CRUD integration tests (create, get, update, delete)
- Add Task status filter integration tests
- Add Project update integration test
- Add Remove repository from project integration test
- Add Repository CRUD integration tests (ignored due to server API version differences)
- Add Workspace/Task Attempt CRUD integration tests (ignored due to server API version differences)

## Impact

- Affected specs: testing
- Affected code: tests/api_integration_test.ts
- Test results: 94 passed, 0 failed, 5 ignored
