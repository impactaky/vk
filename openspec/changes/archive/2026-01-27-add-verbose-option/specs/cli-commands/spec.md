# cli-commands Specification Delta

## ADDED Requirements

### Requirement: Verbose Output Option
The CLI MUST provide a global `-v` / `--verbose` option that displays detailed API request and response information.

#### Scenario: Enable verbose mode with short flag
- **WHEN** the user runs any command with `-v` flag (e.g., `vk project list -v`)
- **THEN** the CLI outputs API request details to stderr before the request
- **AND** the CLI outputs API response details to stderr after the response
- **AND** the normal command output is still displayed to stdout

#### Scenario: Enable verbose mode with long flag
- **WHEN** the user runs any command with `--verbose` flag (e.g., `vk project list --verbose`)
- **THEN** the CLI outputs API request details to stderr
- **AND** the CLI outputs API response details to stderr

#### Scenario: Verbose output includes request method and URL
- **WHEN** verbose mode is enabled
- **AND** the CLI makes an API request
- **THEN** the verbose output includes the HTTP method (GET, POST, PUT, DELETE)
- **AND** the verbose output includes the full request URL

#### Scenario: Verbose output includes request body
- **WHEN** verbose mode is enabled
- **AND** the CLI makes an API request with a body (POST, PUT)
- **THEN** the verbose output includes the request body content

#### Scenario: Verbose output includes response status
- **WHEN** verbose mode is enabled
- **AND** the CLI receives an API response
- **THEN** the verbose output includes the HTTP status code
- **AND** the verbose output includes the status text

#### Scenario: Verbose output includes response body
- **WHEN** verbose mode is enabled
- **AND** the CLI receives an API response
- **THEN** the verbose output includes the response body content

#### Scenario: Verbose output goes to stderr
- **WHEN** verbose mode is enabled
- **AND** the user pipes command output (e.g., `vk project list -v --json | jq .`)
- **THEN** the verbose output goes to stderr
- **AND** the JSON output goes to stdout and is valid JSON

#### Scenario: Verbose mode disabled by default
- **WHEN** the user runs a command without `-v` or `--verbose` flag
- **THEN** no API request/response details are displayed
- **AND** only the normal command output is shown

#### Scenario: Verbose flag in help text
- **WHEN** the user runs `vk --help`
- **THEN** the help text includes the `-v, --verbose` option
- **AND** the description explains it shows API request/response details
