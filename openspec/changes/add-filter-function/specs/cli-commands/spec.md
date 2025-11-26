# cli-commands Specification Deltas

## MODIFIED Requirements

### Requirement: Project List Command
The CLI MUST provide a command to list all projects with optional filtering.

#### Scenario: List projects successfully
Given the vibe-kanban API is running
When the user runs `vk project list`
Then the CLI displays a table of all projects with id, name, and git_repo_path

#### Scenario: List projects with JSON output
Given the vibe-kanban API is running
When the user runs `vk project list --json`
Then the CLI outputs the projects as JSON array

#### Scenario: Filter projects by archived status
Given the vibe-kanban API has both archived and non-archived projects
When the user runs `vk project list --filter is_archived=false`
Then the CLI displays only projects where is_archived is false

#### Scenario: Filter projects by name
Given the vibe-kanban API has projects named "Frontend" and "Backend"
When the user runs `vk project list --filter name=Frontend`
Then the CLI displays only the project named "Frontend"

#### Scenario: Filter projects with multiple conditions
Given the vibe-kanban API has multiple projects
When the user runs `vk project list --filter is_archived=false --filter name=Frontend`
Then the CLI displays only projects matching all filter conditions (AND logic)

#### Scenario: Filter projects with JSON output
Given the vibe-kanban API has multiple projects
When the user runs `vk project list --filter is_archived=false --json`
Then the CLI outputs filtered projects as JSON array

#### Scenario: Invalid filter syntax
Given the user runs `vk project list --filter invalid-syntax`
When the filter does not contain an equals sign
Then the CLI displays an error message explaining the correct format

#### Scenario: Filter by non-existent field
Given the user runs `vk project list --filter nonexistent=value`
When the field does not exist on the project object
Then the CLI displays an error indicating the field is not valid for filtering

---

### Requirement: Task List Command
The CLI MUST provide a command to list tasks for a project with optional filtering.

#### Scenario: List tasks for project (updated)
Given a project with id "abc-123" has tasks
When the user runs `vk task list --project abc-123`
Then the CLI displays a table of tasks with id, title, and status

#### Scenario: List tasks with auto-detected project
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task list`
Then the CLI displays tasks for the auto-detected project

#### Scenario: Filter tasks by status
Given a project has tasks with various statuses
When the user runs `vk task list --filter status=completed`
Then the CLI displays only tasks with status "completed"

#### Scenario: Filter tasks by priority
Given a project has tasks with various priorities
When the user runs `vk task list --filter priority=5`
Then the CLI displays only tasks with priority 5

#### Scenario: Filter tasks by executor
Given a project has tasks with various executors
When the user runs `vk task list --filter executor=CLAUDE_CODE`
Then the CLI displays only tasks with executor "CLAUDE_CODE"

#### Scenario: Filter tasks by favorite status
Given a project has both favorite and non-favorite tasks
When the user runs `vk task list --filter is_favorite=true`
Then the CLI displays only tasks marked as favorite

#### Scenario: Filter tasks by label
Given a project has tasks with labels ["bug", "urgent"] and ["feature"]
When the user runs `vk task list --filter labels=bug`
Then the CLI displays only tasks that have "bug" in their labels array

#### Scenario: Filter tasks with multiple conditions
Given a project has multiple tasks
When the user runs `vk task list --filter status=in_progress --filter priority=5`
Then the CLI displays only tasks matching all filter conditions (AND logic)

#### Scenario: Filter tasks with JSON output
Given a project has multiple tasks
When the user runs `vk task list --filter status=completed --json`
Then the CLI outputs filtered tasks as JSON array

#### Scenario: Invalid filter syntax for tasks
Given the user runs `vk task list --filter status:completed`
When the filter does not use the correct key=value format
Then the CLI displays an error message explaining the correct format

#### Scenario: Filter tasks by non-existent field
Given the user runs `vk task list --filter invalid_field=value`
When the field does not exist on the task object
Then the CLI displays an error indicating the field is not valid for filtering

---

### Requirement: Attempt List Command
The CLI MUST provide a command to list attempts for a task with optional filtering.

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

#### Scenario: Filter attempts by executor
Given a task has attempts with various executors
When the user runs `vk attempt list --task task-456 --filter executor=CLAUDE_CODE`
Then the CLI displays only attempts with executor "CLAUDE_CODE"

#### Scenario: Filter attempts by branch
Given a task has attempts with different branch names
When the user runs `vk attempt list --task task-456 --filter branch=feature-branch`
Then the CLI displays only attempts with branch name "feature-branch"

#### Scenario: Filter attempts by target branch
Given a task has attempts targeting different branches
When the user runs `vk attempt list --task task-456 --filter target_branch=main`
Then the CLI displays only attempts targeting the "main" branch

#### Scenario: Filter attempts with multiple conditions
Given a task has multiple attempts
When the user runs `vk attempt list --task task-456 --filter executor=CLAUDE_CODE --filter target_branch=main`
Then the CLI displays only attempts matching all filter conditions (AND logic)

#### Scenario: Filter attempts with JSON output
Given a task has multiple attempts
When the user runs `vk attempt list --task task-456 --filter executor=CLAUDE_CODE --json`
Then the CLI outputs filtered attempts as JSON array

#### Scenario: Invalid filter syntax for attempts
Given the user runs `vk attempt list --task task-456 --filter executor`
When the filter does not include a value
Then the CLI displays an error message explaining the correct format

#### Scenario: Filter attempts by non-existent field
Given the user runs `vk attempt list --task task-456 --filter invalid=value`
When the field does not exist on the attempt object
Then the CLI displays an error indicating the field is not valid for filtering

---

## ADDED Requirements

### Requirement: Filter Option Support
The CLI MUST support a --filter option on all list commands that accepts key=value pairs.

#### Scenario: Multiple filters use AND logic
Given any list command with multiple --filter options
When the user specifies `--filter key1=value1 --filter key2=value2`
Then only items matching ALL filter conditions are displayed

#### Scenario: Boolean value parsing
Given a filter targeting a boolean field
When the user runs a command with `--filter is_archived=true` or `--filter is_archived=false`
Then the CLI correctly parses "true" and "false" as boolean values

#### Scenario: String value matching is case-sensitive
Given a filter targeting a string field
When the user runs a command with `--filter name=Frontend`
Then only items with exact case-sensitive string match are displayed

#### Scenario: Array field matching
Given a filter targeting an array field like labels
When the user runs a command with `--filter labels=bug`
Then items where ANY element in the array matches the value are displayed

#### Scenario: Numeric value parsing
Given a filter targeting a numeric field
When the user runs a command with `--filter priority=5`
Then the CLI correctly parses "5" as a number and matches numeric fields

#### Scenario: Empty results after filtering
Given a list command with filters that match no items
When the command is executed
Then the CLI displays "No [items] found." message

#### Scenario: Filter validation at startup
Given any list command with a --filter option
When the filter key does not match any valid field for that resource type
Then the CLI displays an error before making API calls

---
