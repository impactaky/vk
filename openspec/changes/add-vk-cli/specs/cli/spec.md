# CLI Specification

## ADDED Requirements

### Requirement: Command Structure

The CLI SHALL follow a hierarchical command structure similar to `gh` (GitHub CLI).

#### Scenario: Top-level command

- **WHEN** user runs `vk` without arguments
- **THEN** display help text with available commands

#### Scenario: Subcommand help

- **WHEN** user runs `vk <command> --help`
- **THEN** display help text for that specific command

#### Scenario: Invalid command

- **WHEN** user runs `vk invalid-command`
- **THEN** display error message and suggest similar commands

### Requirement: Authentication

The CLI SHALL support GitHub OAuth authentication using device flow.

#### Scenario: Login flow

- **WHEN** user runs `vk auth login`
- **THEN** initiate GitHub OAuth device flow and display verification URL and code

#### Scenario: Check authentication status

- **WHEN** user runs `vk auth status`
- **THEN** display current authentication status (logged in/out, username)

#### Scenario: Logout

- **WHEN** user runs `vk auth logout`
- **THEN** clear stored credentials and confirm logout

### Requirement: Configuration Management

The CLI SHALL store configuration in a local file (similar to `~/.config/gh/config.yml`).

#### Scenario: Set configuration value

- **WHEN** user runs `vk config set api_url http://localhost:3000`
- **THEN** store the value in configuration file

#### Scenario: Get configuration value

- **WHEN** user runs `vk config get api_url`
- **THEN** display the stored value

#### Scenario: List all configuration

- **WHEN** user runs `vk config list`
- **THEN** display all configuration key-value pairs

### Requirement: Project Management

The CLI SHALL support CRUD operations for projects.

#### Scenario: List projects

- **WHEN** user runs `vk project list`
- **THEN** display table of all projects with ID, name, and git repo path

#### Scenario: View project details

- **WHEN** user runs `vk project view <project-id>`
- **THEN** display detailed information about the project

#### Scenario: Create project

- **WHEN** user runs `vk project create --name "My Project" --path /path/to/repo`
- **THEN** create new project and display confirmation with project ID

#### Scenario: Delete project

- **WHEN** user runs `vk project delete <project-id>`
- **THEN** prompt for confirmation and delete project if confirmed

### Requirement: Task Management

The CLI SHALL support CRUD operations for tasks.

#### Scenario: List tasks

- **WHEN** user runs `vk task list <project-id>`
- **THEN** display table of all tasks for the project

#### Scenario: View task details

- **WHEN** user runs `vk task view <task-id>`
- **THEN** display detailed information about the task

#### Scenario: Create task

- **WHEN** user runs `vk task create <project-id> --title "Task title" --description "Description"`
- **THEN** create new task and display confirmation with task ID

#### Scenario: Update task

- **WHEN** user runs `vk task update <task-id> --title "New title"`
- **THEN** update task and display confirmation

#### Scenario: Delete task

- **WHEN** user runs `vk task delete <task-id>`
- **THEN** prompt for confirmation and delete task if confirmed

### Requirement: Task Attempt Management

The CLI SHALL support operations for task attempts.

#### Scenario: List task attempts

- **WHEN** user runs `vk attempt list <task-id>`
- **THEN** display table of all attempts for the task

#### Scenario: View attempt details

- **WHEN** user runs `vk attempt view <attempt-id>`
- **THEN** display detailed information about the attempt

#### Scenario: Create task attempt

- **WHEN** user runs `vk attempt create <task-id> --executor claude-code --base-branch main`
- **THEN** create new task attempt and display confirmation

#### Scenario: Send follow-up

- **WHEN** user runs `vk attempt follow-up <attempt-id> --prompt "Follow-up message"`
- **THEN** send follow-up message to the task attempt

### Requirement: Error Handling

The CLI SHALL provide clear error messages for common failure scenarios.

#### Scenario: Network error

- **WHEN** API request fails due to network error
- **THEN** display user-friendly error message with troubleshooting hints

#### Scenario: Authentication error

- **WHEN** API request fails due to invalid/expired token
- **THEN** display error message and suggest running `vk auth login`

#### Scenario: Not found error

- **WHEN** user requests non-existent resource
- **THEN** display clear error message indicating resource not found

### Requirement: Output Formatting

The CLI SHALL support multiple output formats.

#### Scenario: Table output (default)

- **WHEN** user runs list command without format flag
- **THEN** display results in formatted table

#### Scenario: JSON output

- **WHEN** user runs command with `--json` flag
- **THEN** display results as JSON

#### Scenario: Quiet output

- **WHEN** user runs command with `--quiet` flag
- **THEN** display minimal output (IDs only)
