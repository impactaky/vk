# CLI Commands Specification

## ADDED Requirements

### Requirement: Project List Command
The CLI MUST provide a command to list all projects.

#### Scenario: List projects successfully
Given the vibe-kanban API is running
When the user runs `vk project list`
Then the CLI displays a table of all projects with id, name, and git_repo_path

#### Scenario: List projects with JSON output
Given the vibe-kanban API is running
When the user runs `vk project list --json`
Then the CLI outputs the projects as JSON array

---

### Requirement: Project Show Command
The CLI MUST provide a command to show details of a specific project.

#### Scenario: Show project details
Given a project with id "abc-123" exists
When the user runs `vk project show abc-123`
Then the CLI displays the project details including name, git_repo_path, and scripts

#### Scenario: Show non-existent project
Given no project with id "xyz-999" exists
When the user runs `vk project show xyz-999`
Then the CLI displays an error message

---

### Requirement: Project Create Command
The CLI MUST provide a command to create a new project.

#### Scenario: Create project interactively
Given the vibe-kanban API is running
When the user runs `vk project create`
Then the CLI prompts for name and git_repo_path
And creates the project when confirmed

#### Scenario: Create project with flags
Given the vibe-kanban API is running
When the user runs `vk project create --name "My Project" --path "/path/to/repo"`
Then the CLI creates the project without prompts

---

### Requirement: Project Delete Command
The CLI MUST provide a command to delete a project.

#### Scenario: Delete project with confirmation
Given a project with id "abc-123" exists
When the user runs `vk project delete abc-123`
Then the CLI asks for confirmation
And deletes the project when confirmed

#### Scenario: Delete project force
Given a project with id "abc-123" exists
When the user runs `vk project delete abc-123 --force`
Then the CLI deletes the project without confirmation

---

### Requirement: Task List Command
The CLI MUST provide a command to list tasks for a project.

#### Scenario: List tasks for project
Given a project with id "abc-123" has tasks
When the user runs `vk task list --project abc-123`
Then the CLI displays a table of tasks with id, title, and status

#### Scenario: List tasks with JSON output
Given a project with id "abc-123" has tasks
When the user runs `vk task list --project abc-123 --json`
Then the CLI outputs the tasks as JSON array

---

### Requirement: Task Show Command
The CLI MUST provide a command to show task details.

#### Scenario: Show task details
Given a task with id "task-456" exists
When the user runs `vk task show task-456`
Then the CLI displays task details including title, description, and status

---

### Requirement: Task Create Command
The CLI MUST provide a command to create a new task.

#### Scenario: Create task with title
Given a project with id "abc-123" exists
When the user runs `vk task create --project abc-123 --title "Fix bug"`
Then the CLI creates the task and displays its id

#### Scenario: Create task interactively
Given a project with id "abc-123" exists
When the user runs `vk task create --project abc-123`
Then the CLI prompts for title and description

---

### Requirement: Task Update Command
The CLI MUST provide a command to update a task.

#### Scenario: Update task title
Given a task with id "task-456" exists
When the user runs `vk task update task-456 --title "New title"`
Then the CLI updates the task title

#### Scenario: Update task status
Given a task with id "task-456" exists
When the user runs `vk task update task-456 --status completed`
Then the CLI updates the task status

---

### Requirement: Task Delete Command
The CLI MUST provide a command to delete a task.

#### Scenario: Delete task with confirmation
Given a task with id "task-456" exists
When the user runs `vk task delete task-456`
Then the CLI asks for confirmation
And deletes the task when confirmed

---

### Requirement: Configuration Management
The CLI MUST support configuring the API endpoint.

#### Scenario: Set API endpoint
When the user runs `vk config set api-url http://localhost:3000`
Then the CLI saves the API URL to configuration

#### Scenario: Show current config
When the user runs `vk config show`
Then the CLI displays the current configuration

---

### Requirement: Global Options
The CLI MUST support common global options.

#### Scenario: Help flag
When the user runs `vk --help`
Then the CLI displays usage information and available commands

#### Scenario: Version flag
When the user runs `vk --version`
Then the CLI displays the version number
