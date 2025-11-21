# cli-commands Specification

## Purpose
TBD - created by archiving change add-basic-commands. Update Purpose after archive.
## Requirements
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

#### Scenario: List tasks for project (updated)
Given a project with id "abc-123" has tasks
When the user runs `vk task list --project abc-123`
Then the CLI displays a table of tasks with id, title, and status

#### Scenario: List tasks with auto-detected project
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task list`
Then the CLI displays tasks for the auto-detected project

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

#### Scenario: Create task with auto-detected project
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug"`
Then the CLI creates the task in the auto-detected project

#### Scenario: Create task from markdown file
Given the user is in a git repository matching project "abc-123"
And a file "task.md" exists with content:
```markdown
# Fix authentication bug

Users cannot log in when using SSO.
Check the OAuth callback handler.
```
When the user runs `vk task create --from task.md`
Then the CLI creates a task with title "Fix authentication bug"
And description "Users cannot log in when using SSO.\nCheck the OAuth callback handler."

#### Scenario: Create task from markdown without heading
Given a file "task.md" exists with content:
```markdown
This is just plain text without a heading.
```
When the user runs `vk task create --from task.md`
Then the CLI displays an error "Markdown file must contain a heading for the task title"

#### Scenario: Create task with conflicting options
When the user runs `vk task create --from task.md --title "Other title"`
Then the CLI displays an error "Cannot use --from with --title or --description"

#### Scenario: Create task from non-existent file
When the user runs `vk task create --from nonexistent.md`
Then the CLI displays an error indicating the file was not found

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

### Requirement: Default Project Resolution
The CLI MUST automatically resolve the default project from the current git repository when --project is not specified.

#### Scenario: Auto-detect project from git remote
Given the user is in a git repository with remote URL "https://github.com/BloopAI/vibe-kanban.git"
And a project exists with git_repo_path containing "vibe-kanban"
When the user runs `vk task list` without --project flag
Then the CLI automatically uses the matching project ID

#### Scenario: No matching project found
Given the user is in a git repository with remote URL "https://github.com/example/unknown-repo.git"
And no project has a matching git_repo_path basename
When the user runs `vk task list` without --project flag
Then the CLI displays an error indicating no matching project found and suggests using --project

#### Scenario: Not in a git repository
Given the user is not in a git repository
When the user runs `vk task list` without --project flag
Then the CLI displays an error indicating no git repository found and requires --project

#### Scenario: Multiple projects match
Given multiple projects have git_repo_path basenames matching the current git remote
When the user runs `vk task list` without --project flag
Then the CLI uses the first match and optionally warns about multiple matches

---

### Requirement: Attempt List Command
The CLI MUST provide a command to list attempts for a task.

#### Scenario: List attempts for task
Given a task with id "task-456" has attempts
When the user runs `vk attempt list --task task-456`
Then the CLI displays a table of attempts with id, branch, executor, and status

#### Scenario: List attempts with JSON output
Given a task with id "task-456" has attempts
When the user runs `vk attempt list --task task-456 --json`
Then the CLI outputs the attempts as JSON array

#### Scenario: List attempts with auto-detected project
Given the user is in a git repository matching project "abc-123"
And task "task-456" belongs to project "abc-123"
When the user runs `vk attempt list --task task-456`
Then the CLI displays attempts for the specified task

---

### Requirement: Attempt Show Command
The CLI MUST provide a command to show attempt details.

#### Scenario: Show attempt details
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt show attempt-789`
Then the CLI displays attempt details including branch, executor, target_branch, and timestamps

#### Scenario: Show attempt with JSON output
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt show attempt-789 --json`
Then the CLI outputs the attempt details as JSON

#### Scenario: Show non-existent attempt
Given no attempt with id "xyz-999" exists
When the user runs `vk attempt show xyz-999`
Then the CLI displays an error message

---

### Requirement: Attempt Create Command
The CLI MUST provide a command to create a new attempt for a task.

#### Scenario: Create attempt with required options
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE`
Then the CLI creates the attempt and displays the new attempt details

#### Scenario: Create attempt with base branch
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE --base-branch develop`
Then the CLI creates the attempt with the specified base branch

#### Scenario: Create attempt missing required options
When the user runs `vk attempt create` without --task or --executor
Then the CLI displays an error indicating required options are missing

---

