# testing Specification

## Purpose
TBD - created by archiving change add-test-server. Update Purpose after archive.
## Requirements
### Requirement: Test Server Container

The system SHALL provide a Docker container configuration for running the vibe-kanban server for testing purposes.

#### Scenario: Build test server image

- **WHEN** the user runs `docker compose build`
- **THEN** a Docker image is built that includes the vibe-kanban server via `npx`

#### Scenario: Start test server container

- **WHEN** the user runs `docker compose up`
- **THEN** the vibe-kanban server starts and is accessible on port 3000
- **AND** the container waits until the server is healthy before reporting ready

### Requirement: Integration Test Suite

The system SHALL provide integration tests that verify the API client works correctly with a live vibe-kanban server.

#### Scenario: Run integration tests

- **WHEN** the user runs `deno task test:integration`
- **THEN** integration tests execute against the configured API endpoint
- **AND** tests verify CRUD operations for projects, tasks, attempts, and repositories

#### Scenario: Integration tests in CI

- **WHEN** a pull request or push triggers the CI workflow
- **THEN** integration tests run with a live vibe-kanban server
- **AND** the workflow reports success only if all integration tests pass

### Requirement: Test Data Management

The system SHALL provide utilities for managing test data during integration tests.

#### Scenario: Generate unique test identifiers

- **WHEN** an integration test needs to create a test resource
- **THEN** a unique identifier is generated to avoid conflicts with existing data

#### Scenario: Cleanup test data

- **WHEN** an integration test completes
- **THEN** test resources created during the test are cleaned up

### Requirement: Server Readiness Check

The system SHALL wait for the vibe-kanban server to be ready before running integration tests.

#### Scenario: Wait for server health

- **WHEN** integration tests start
- **THEN** the system polls the server health endpoint until ready or timeout
- **AND** tests only begin after the server responds successfully

### Requirement: Task API Integration Tests

The system SHALL provide integration tests that verify Task CRUD operations work correctly with the vibe-kanban API.

#### Scenario: Create, get, and delete task

- **WHEN** an integration test creates a task via POST /api/tasks
- **THEN** the task is created successfully with the provided title and description
- **AND** the task can be retrieved by ID via GET /api/tasks/:id
- **AND** the task can be deleted via DELETE /api/tasks/:id

#### Scenario: Update task properties

- **WHEN** an integration test updates a task via PUT /api/tasks/:id
- **THEN** the task title, description, and status can be updated
- **AND** the updated values are persisted and returned correctly

#### Scenario: Filter tasks by status

- **WHEN** an integration test lists tasks with a status filter via GET /api/tasks?status=...
- **THEN** only tasks matching the specified status are returned
- **AND** the known test task with that status is included in the results

### Requirement: Project Update Integration Test

The system SHALL provide integration tests that verify Project update operations work correctly.

#### Scenario: Update project name

- **WHEN** an integration test updates a project via PUT /api/projects/:id
- **THEN** the project name is updated successfully
- **AND** the updated name is persisted and returned on subsequent GET requests

### Requirement: Project Repository Management Integration Tests

The system SHALL provide integration tests that verify adding and removing repositories from projects.

#### Scenario: Remove repository from project

- **WHEN** an integration test removes a repository from a project via DELETE /api/projects/:id/repositories/:repoId
- **THEN** the repository is no longer associated with the project
- **AND** subsequent GET /api/projects/:id/repositories requests do not include the removed repository

### Requirement: Repository API Integration Tests (Conditional)

The system SHALL provide integration tests for Repository CRUD operations that can be enabled when the server API is compatible.

#### Scenario: Register, get, update, and delete repository

- **WHEN** an integration test registers a repository via POST /api/repos
- **THEN** the repository is created with the provided path and display_name
- **AND** the repository can be retrieved, updated, and deleted
- **NOTE** This test may be ignored if server API requires different fields

### Requirement: Workspace API Integration Tests (Conditional)

The system SHALL provide integration tests for Workspace (Task Attempt) CRUD operations that can be enabled when the server API is compatible.

#### Scenario: Create, get, update, and delete task attempt

- **WHEN** an integration test creates a workspace via POST /api/task-attempts
- **THEN** the workspace is created with the provided task_id, executor_profile_id, and base_branch
- **AND** the workspace can be retrieved, updated (name, archived, pinned), and deleted
- **NOTE** This test may be ignored if server API requires additional fields

#### Scenario: List task attempts with filter

- **WHEN** an integration test lists workspaces via GET /api/task-attempts?task_id=...
- **THEN** only workspaces for the specified task are returned

#### Scenario: Get task attempt repositories

- **WHEN** an integration test requests workspace repositories via GET /api/task-attempts/:id/repositories
- **THEN** an array of associated repositories is returned

