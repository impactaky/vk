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

