## ADDED Requirements

### Requirement: CLI Runner Helper

The system SHALL provide a helper module for invoking CLI commands in integration tests.

#### Scenario: Execute CLI command

- **WHEN** an integration test calls `runCli(["project", "list"])`
- **THEN** the CLI is executed as a subprocess with proper permissions
- **AND** stdout, stderr, and exit code are captured and returned

#### Scenario: Execute CLI command with JSON output

- **WHEN** an integration test calls `runCliJson(["project", "list"])`
- **THEN** the `--json` flag is automatically appended
- **AND** the JSON output is parsed and returned as typed data

#### Scenario: CLI uses test server configuration

- **WHEN** a CLI command is executed via the runner
- **THEN** the `VK_API_URL` environment variable is set from test config
- **AND** the CLI connects to the test server

### Requirement: CLI Command Integration Tests

The system SHALL provide integration tests that invoke actual CLI commands and verify their behavior.

#### Scenario: Test project commands

- **WHEN** integration tests run for project commands
- **THEN** create, list, show, update, delete, repos, add-repo, and remove-repo commands are tested
- **AND** both success cases and error handling are verified

#### Scenario: Test task commands

- **WHEN** integration tests run for task commands
- **THEN** create, list, show, update, and delete commands are tested
- **AND** project context is properly resolved

#### Scenario: Test repository commands

- **WHEN** integration tests run for repository commands
- **THEN** list, register, show, update, and branches commands are tested
- **AND** test repository directories are created and cleaned up

#### Scenario: Test attempt commands

- **WHEN** integration tests run for attempt commands
- **THEN** create, list, show, update, repos, branch-status, and delete commands are tested
- **AND** commands requiring external services (GitHub, git remotes) are skipped

#### Scenario: Test config commands

- **WHEN** integration tests run for config commands
- **THEN** show and set commands are tested
- **AND** configuration values are verified

### Requirement: CLI Test Isolation

The system SHALL ensure CLI integration tests are isolated and do not affect other tests.

#### Scenario: Unique test resources

- **WHEN** a CLI test creates a resource
- **THEN** it uses a unique name with test prefix
- **AND** the resource can be identified for cleanup

#### Scenario: Test cleanup

- **WHEN** a CLI test completes
- **THEN** resources created by the test are deleted
- **AND** failures during cleanup do not cause test failures
