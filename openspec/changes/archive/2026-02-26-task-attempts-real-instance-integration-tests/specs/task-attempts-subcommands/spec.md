## ADDED Requirements

### Requirement: Compose-backed task-attempt integration tests
Task-attempt command integration tests for successful create and spin-off flows MUST execute against the real API instance configured by test environment (`VK_API_URL`) rather than in-process mock API servers.

#### Scenario: Create success path test execution
- **WHEN** integration tests run create success scenarios
- **THEN** test data is sourced from real API endpoints
- **AND** CLI requests are sent to the compose-backed API instance

#### Scenario: Spin-off success path test execution
- **WHEN** integration tests run spin-off success scenarios
- **THEN** parent attempt data is sourced from real API endpoints
- **AND** CLI requests are sent to the compose-backed API instance
