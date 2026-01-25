## ADDED Requirements

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
