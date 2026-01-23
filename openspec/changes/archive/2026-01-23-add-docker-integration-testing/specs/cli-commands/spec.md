## MODIFIED Requirements
### Requirement: Configuration Management
The CLI MUST support configuring the API endpoint. Configuration MAY be overridden by environment variables.

#### Scenario: Set API endpoint
When the user runs `vk config set api-url http://localhost:3000`
Then the CLI saves the API URL to configuration

#### Scenario: Show current config
When the user runs `vk config show`
Then the CLI displays the current configuration

#### Scenario: Environment variable overrides config file
- **WHEN** the `VK_API_URL` environment variable is set to `http://custom:3000`
- **AND** the config file has `apiUrl` set to `http://localhost:3000`
- **THEN** the CLI uses `http://custom:3000` as the API URL

#### Scenario: Environment variable not set uses config file
- **WHEN** the `VK_API_URL` environment variable is not set
- **AND** the config file has `apiUrl` set to `http://localhost:3000`
- **THEN** the CLI uses `http://localhost:3000` as the API URL

#### Scenario: Environment variable not set and no config file uses default
- **WHEN** the `VK_API_URL` environment variable is not set
- **AND** no config file exists
- **THEN** the CLI uses `http://localhost:3000` as the default API URL
