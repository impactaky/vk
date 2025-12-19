# cli-commands Specification

## Purpose
TBD - created by archiving change add-basic-commands. Update Purpose after archive.
## Requirements
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
When the user runs `vk project list --archived false`
Then the CLI displays only projects where is_archived is false

#### Scenario: Filter projects by name
Given the vibe-kanban API has projects named "Frontend" and "Backend"
When the user runs `vk project list --name Frontend`
Then the CLI displays only the project named "Frontend"

#### Scenario: Filter projects by color
Given the vibe-kanban API has projects with different hex colors
When the user runs `vk project list --color "#3498db"`
Then the CLI displays only projects with that hex color

#### Scenario: Filter projects with multiple conditions
Given the vibe-kanban API has multiple projects
When the user runs `vk project list --archived false --name Frontend`
Then the CLI displays only projects matching all filter conditions (AND logic)

#### Scenario: Filter projects with JSON output
Given the vibe-kanban API has multiple projects
When the user runs `vk project list --archived false --json`
Then the CLI outputs filtered projects as JSON array

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
When the user runs `vk task list --status completed`
Then the CLI displays only tasks with status "completed"

#### Scenario: Filter tasks by priority
Given a project has tasks with various priorities
When the user runs `vk task list --priority 5`
Then the CLI displays only tasks with priority 5

#### Scenario: Filter tasks by executor
Given a project has tasks with various executors
When the user runs `vk task list --executor CLAUDE_CODE`
Then the CLI displays only tasks with executor "CLAUDE_CODE"

#### Scenario: Filter tasks by favorite status
Given a project has both favorite and non-favorite tasks
When the user runs `vk task list --favorite true`
Then the CLI displays only tasks marked as favorite

#### Scenario: Filter tasks by label
Given a project has tasks with labels ["bug", "urgent"] and ["feature"]
When the user runs `vk task list --label bug`
Then the CLI displays only tasks that have "bug" in their labels array

#### Scenario: Filter tasks by color
Given a project has tasks with different hex colors
When the user runs `vk task list --color "#ff5733"`
Then the CLI displays only tasks with that hex color

#### Scenario: Filter tasks with multiple conditions
Given a project has multiple tasks
When the user runs `vk task list --status in_progress --priority 5`
Then the CLI displays only tasks matching all filter conditions (AND logic)

#### Scenario: Filter tasks with JSON output
Given a project has multiple tasks
When the user runs `vk task list --status completed --json`
Then the CLI outputs filtered tasks as JSON array

---

### Requirement: Task Show Command
The CLI MUST provide a command to show task details with auto-detection support.

#### Scenario: Show task details with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task show task-456`
- **THEN** the CLI displays task details including title, description, and status

#### Scenario: Show task with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to an attempt with task_id "task-456"
- **AND** the user runs `vk task show` without providing ID
- **THEN** the CLI auto-detects task-456 and displays its details

#### Scenario: Show task fails without ID or valid branch
- **WHEN** user is not in a valid attempt branch
- **AND** the user runs `vk task show` without providing ID
- **THEN** the CLI falls back to interactive selection or displays an error

---

### Requirement: Task Create Command
The CLI MUST provide a command to create a new task with optional immediate execution.

#### Scenario: Create task with immediate run
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug" --run --executor CLAUDE_CODE:DEFAULT`
Then the CLI creates the task in the auto-detected project
And the CLI creates an attempt with the specified executor
And the CLI displays the task ID and attempt ID with branch name

#### Scenario: Create task with run and base branch
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug" --run --executor CLAUDE_CODE:DEFAULT --base-branch develop`
Then the CLI creates the task in the auto-detected project
And the CLI creates an attempt with base branch "develop"

#### Scenario: Create task with run and target branch
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug" --run --executor CLAUDE_CODE:DEFAULT --target-branch feature/fix`
Then the CLI creates the task in the auto-detected project
And the CLI creates an attempt with target branch "feature/fix"

#### Scenario: Create task with run missing executor
When the user runs `vk task create --title "Fix bug" --run`
Then the CLI displays an error "Error: --run requires --executor to be specified"

#### Scenario: Create task with from file and immediate run
Given a file "task.md" exists with content:
```markdown
# Fix authentication bug

Users cannot log in when using SSO.
```
When the user runs `vk task create --from task.md --run --executor CLAUDE_CODE:DEFAULT`
Then the CLI creates a task with title "Fix authentication bug"
And the CLI creates an attempt with the specified executor

### Requirement: Task Update Command
The CLI MUST provide a command to update a task with auto-detection support.

#### Scenario: Update task title with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --title "New title"`
- **THEN** the CLI updates the task title

#### Scenario: Update task status with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --status completed`
- **THEN** the CLI updates the task status

#### Scenario: Update task with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to an attempt with task_id "task-456"
- **AND** the user runs `vk task update --title "New title"` without providing ID
- **THEN** the CLI auto-detects task-456 and updates it

---

### Requirement: Task Delete Command
The CLI MUST provide a command to delete a task with auto-detection support.

#### Scenario: Delete task with confirmation and explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task delete task-456`
- **THEN** the CLI asks for confirmation and deletes the task when confirmed

#### Scenario: Delete task with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to an attempt with task_id "task-456"
- **AND** the user runs `vk task delete` without providing ID
- **THEN** the CLI auto-detects task-456, asks for confirmation, and deletes when confirmed

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
The CLI MUST filter attempts by full executor profile ID in `<name>:<variant>` format.

#### Scenario: Filter attempts by executor with variant
Given a task has attempts with executors "CLAUDE_CODE:DEFAULT" and "CLAUDE_CODE:AGGRESSIVE"
When the user runs `vk attempt list --task task-456 --executor CLAUDE_CODE:DEFAULT`
Then the CLI displays only attempts with executor "CLAUDE_CODE" and variant "DEFAULT"

#### Scenario: Filter attempts with full match
Given a task has attempts with executors "CLAUDE_CODE:DEFAULT" and "OTHER_EXECUTOR:DEFAULT"
When the user runs `vk attempt list --task task-456 --executor CLAUDE_CODE:DEFAULT`
Then the CLI displays only attempts matching the full "CLAUDE_CODE:DEFAULT" string
And does not display attempts with "OTHER_EXECUTOR:DEFAULT"

### Requirement: Attempt Show Command
The CLI MUST provide a command to show attempt details with auto-detection support.

#### Scenario: Show attempt details with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt show attempt-789`
- **THEN** the CLI displays attempt details including branch, executor, target_branch, and timestamps

#### Scenario: Show attempt with JSON output and explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt show attempt-789 --json`
- **THEN** the CLI outputs the attempt details as JSON

#### Scenario: Show non-existent attempt with explicit ID
- **WHEN** no attempt with id "xyz-999" exists
- **AND** the user runs `vk attempt show xyz-999`
- **THEN** the CLI displays an error message

#### Scenario: Show attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt show` without providing ID
- **THEN** the CLI auto-detects attempt-789 and displays its details

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

#### Scenario: Create attempt with target branch
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE --target-branch feature/new`
Then the CLI creates the attempt with the specified target branch

#### Scenario: Create attempt missing required options
When the user runs `vk attempt create` without --task or --executor
Then the CLI displays an error indicating required options are missing

### Requirement: Attempt Delete Command
The CLI MUST provide a command to delete an attempt with auto-detection support.

#### Scenario: Delete attempt with confirmation and explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt delete attempt-789`
- **THEN** the CLI asks for confirmation and deletes the attempt when confirmed

#### Scenario: Delete attempt force with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt delete attempt-789 --force`
- **THEN** the CLI deletes the attempt without confirmation

#### Scenario: Delete attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt delete` without providing ID
- **THEN** the CLI auto-detects attempt-789, asks for confirmation, and deletes when confirmed

---

### Requirement: Attempt Update Command
The CLI MUST provide a command to update attempt properties with auto-detection support.

#### Scenario: Update target branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt update attempt-789 --target-branch develop`
- **THEN** the CLI updates the attempt's target branch

#### Scenario: Rename branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt update attempt-789 --branch new-branch-name`
- **THEN** the CLI renames the attempt's branch

#### Scenario: Update attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt update --target-branch develop` without providing ID
- **THEN** the CLI auto-detects attempt-789 and updates it

---

### Requirement: Attempt Merge Command
The CLI MUST provide a command to merge an attempt's branch with auto-detection support.

#### Scenario: Merge attempt branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists with commits
- **AND** the user runs `vk attempt merge attempt-789`
- **THEN** the CLI merges the attempt's branch into target branch

#### Scenario: Merge with JSON output and explicit ID
- **WHEN** an attempt with id "attempt-789" exists with commits
- **AND** the user runs `vk attempt merge attempt-789 --json`
- **THEN** the CLI outputs the merge result as JSON

#### Scenario: Merge attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789" with commits
- **AND** the user runs `vk attempt merge` without providing ID
- **THEN** the CLI auto-detects attempt-789 and merges it

---

### Requirement: Attempt Push Command
The CLI MUST provide a command to push an attempt's branch to remote with auto-detection support.

#### Scenario: Push attempt branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt push attempt-789`
- **THEN** the CLI pushes the attempt's branch to the remote

#### Scenario: Push attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt push` without providing ID
- **THEN** the CLI auto-detects attempt-789 and pushes it

---

### Requirement: Attempt Rebase Command
The CLI MUST provide a command to rebase an attempt's branch with auto-detection support.

#### Scenario: Rebase attempt branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt rebase attempt-789`
- **THEN** the CLI rebases the attempt's branch onto target branch

#### Scenario: Rebase attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt rebase` without providing ID
- **THEN** the CLI auto-detects attempt-789 and rebases it

---

### Requirement: Attempt Stop Command
The CLI MUST provide a command to stop an attempt's execution with auto-detection support.

#### Scenario: Stop attempt execution with explicit ID
- **WHEN** an attempt with id "attempt-789" is running
- **AND** the user runs `vk attempt stop attempt-789`
- **THEN** the CLI stops the attempt's execution

#### Scenario: Stop attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to running attempt "attempt-789"
- **AND** the user runs `vk attempt stop` without providing ID
- **THEN** the CLI auto-detects attempt-789 and stops it

---

### Requirement: Attempt PR Command
The CLI MUST provide a command to create a GitHub PR for an attempt with auto-detection support.

#### Scenario: Create PR for attempt with explicit ID
- **WHEN** an attempt with id "attempt-789" exists with pushed commits
- **AND** the user runs `vk attempt pr attempt-789`
- **THEN** the CLI creates a GitHub PR for the attempt's branch

#### Scenario: Create PR with title and explicit ID
- **WHEN** an attempt with id "attempt-789" exists with pushed commits
- **AND** the user runs `vk attempt pr attempt-789 --title "Fix bug"`
- **THEN** the CLI creates a GitHub PR with the specified title

#### Scenario: Create PR with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789" with pushed commits
- **AND** the user runs `vk attempt pr` without providing ID
- **THEN** the CLI auto-detects attempt-789 and creates a PR for it

---

### Requirement: Attempt Branch Status Command
The CLI MUST provide a command to check an attempt's branch status with auto-detection support.

#### Scenario: Show branch status with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt branch-status attempt-789`
- **THEN** the CLI displays the branch status including ahead/behind counts

#### Scenario: Show branch status with JSON output and explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt branch-status attempt-789 --json`
- **THEN** the CLI outputs the branch status as JSON

#### Scenario: Show branch status with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt branch-status` without providing ID
- **THEN** the CLI auto-detects attempt-789 and displays its branch status

---

### Requirement: Field-Specific Filter Options
The CLI MUST support field-specific filter options on all list commands.

#### Scenario: Multiple filters use AND logic
Given any list command with multiple filter options
When the user specifies multiple filter flags (e.g., `--status completed --priority 5`)
Then only items matching ALL filter conditions are displayed

#### Scenario: Boolean value parsing
Given a filter option targeting a boolean field
When the user runs a command with `--archived true` or `--archived false`
Then the CLI correctly parses "true" and "false" as boolean values

#### Scenario: String value matching is case-sensitive
Given a filter option targeting a string field
When the user runs a command with `--name Frontend`
Then only items with exact case-sensitive string match are displayed

#### Scenario: Array field matching
Given a filter option targeting an array field like labels
When the user runs a command with `--label bug`
Then items where ANY element in the array matches the value are displayed

#### Scenario: Numeric value parsing
Given a filter option targeting a numeric field
When the user runs a command with `--priority 5`
Then the CLI correctly parses "5" as a number and matches numeric fields

#### Scenario: Empty results after filtering
Given a list command with filter options that match no items
When the command is executed
Then the CLI displays "No [items] found." message

#### Scenario: Filter options are optional
Given any list command
When the user does not specify any filter options
Then all items are displayed without filtering

#### Scenario: Help text shows filter options
Given any list command
When the user runs the command with `--help`
Then the help text displays all available filter options with descriptions

---

### Requirement: Branch Name Parsing
The CLI MUST provide utilities to parse branch names and extract attempt identifiers.

#### Scenario: Parse branch with standard pattern
- **WHEN** a branch name follows the pattern `{username}/{hash}-{description}` (e.g., `impactaky/bd84-try-to-set-task`)
- **THEN** the parser extracts the hash prefix `bd84`

#### Scenario: Parse branch without standard pattern
- **WHEN** a branch name does not follow the standard pattern (e.g., `main`, `feature/test`, `fix-bug`)
- **THEN** the parser returns null indicating no attempt identifier found

#### Scenario: Parse branch with similar but invalid pattern
- **WHEN** a branch name has slashes but wrong format (e.g., `username/description-only`)
- **THEN** the parser returns null

---

### Requirement: Current Git Branch Detection
The CLI MUST provide utility to detect the current git branch.

#### Scenario: Get current branch in git repository
- **WHEN** the CLI is run inside a git repository on a specific branch
- **THEN** the utility returns the current branch name

#### Scenario: Get current branch outside git repository
- **WHEN** the CLI is run outside a git repository
- **THEN** the utility handles the error gracefully and returns null or throws appropriate error

---

### Requirement: Attempt Auto-Detection from Branch
The CLI MUST automatically detect the current attempt ID from the git branch name.

#### Scenario: Auto-detect attempt from matching branch
- **WHEN** user is in a git branch matching pattern `{username}/{hash}-{description}`
- **AND** an attempt exists with a branch field matching the current branch name
- **THEN** the CLI automatically uses that attempt's ID

#### Scenario: Auto-detect fails when no matching attempt
- **WHEN** user is in a git branch with valid pattern
- **AND** no attempt exists with a matching branch name
- **THEN** the CLI falls back to interactive selection or displays error

#### Scenario: Auto-detect skipped when ID provided
- **WHEN** user explicitly provides an attempt ID as argument
- **THEN** the CLI uses the provided ID and skips auto-detection

---

### Requirement: Task Auto-Detection from Current Attempt
The CLI MUST automatically detect the task ID from the current attempt's parent task.

#### Scenario: Auto-detect task from current attempt
- **WHEN** user omits task ID argument
- **AND** current branch corresponds to a valid attempt
- **THEN** the CLI uses the attempt's task_id field as the task ID

#### Scenario: Auto-detect task fails gracefully
- **WHEN** user omits task ID argument
- **AND** no attempt can be auto-detected from current branch
- **THEN** the CLI falls back to interactive selection or displays error requiring explicit task ID

---

