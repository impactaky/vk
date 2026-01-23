# cli-commands Spec Delta: Align API v2

## MODIFIED Requirements

### Requirement: Project List Command
The CLI MUST provide a command to list all projects with optional filtering.

#### Scenario: List projects successfully
Given the vibe-kanban API is running
When the user runs `vk project list`
Then the CLI displays a table of all projects with id, name, and default_agent_working_dir

#### Scenario: List projects with JSON output
Given the vibe-kanban API is running
When the user runs `vk project list --json`
Then the CLI outputs the projects as JSON array

#### Scenario: Filter projects by name
Given the vibe-kanban API has projects named "Frontend" and "Backend"
When the user runs `vk project list --name Frontend`
Then the CLI displays only the project named "Frontend"

#### Scenario: Filter projects with JSON output
Given the vibe-kanban API has multiple projects
When the user runs `vk project list --name Frontend --json`
Then the CLI outputs filtered projects as JSON array

---

### Requirement: Project Show Command
The CLI MUST provide a command to show details of a specific project including its associated repositories.

#### Scenario: Show project details
Given a project with id "abc-123" exists
When the user runs `vk project show abc-123`
Then the CLI displays the project details including name, default_agent_working_dir, and timestamps

#### Scenario: Show non-existent project
Given no project with id "xyz-999" exists
When the user runs `vk project show xyz-999`
Then the CLI displays an error message

---

### Requirement: Project Create Command
The CLI MUST provide a command to create a new project with repository associations.

#### Scenario: Create project interactively
Given the vibe-kanban API is running
When the user runs `vk project create`
Then the CLI prompts for name
And creates the project when confirmed

#### Scenario: Create project with flags
Given the vibe-kanban API is running
And a repository with id "repo-123" exists
When the user runs `vk project create --name "My Project" --repo repo-123`
Then the CLI creates the project with the associated repository

#### Scenario: Create project with multiple repositories
Given the vibe-kanban API is running
And repositories "repo-1" and "repo-2" exist
When the user runs `vk project create --name "My Project" --repo repo-1 --repo repo-2`
Then the CLI creates the project with both repositories associated

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

### Requirement: Project Update Command
The CLI MUST provide a command to update a project name.

#### Scenario: Update project name
Given a project with id "abc-123" exists
When the user runs `vk project update abc-123 --name "New Name"`
Then the CLI updates the project name

---

### Requirement: Project Repository Management
The CLI MUST provide commands to manage repositories associated with a project.

#### Scenario: List project repositories
Given a project with id "abc-123" has repositories associated
When the user runs `vk project repos abc-123`
Then the CLI displays a table of repositories with repo_id and is_main

#### Scenario: Add repository to project
Given a project with id "abc-123" exists
And a repository with id "repo-456" exists
When the user runs `vk project add-repo abc-123 --repo repo-456`
Then the CLI adds the repository to the project

#### Scenario: Add main repository to project
Given a project with id "abc-123" exists
And a repository with id "repo-456" exists
When the user runs `vk project add-repo abc-123 --repo repo-456 --main`
Then the CLI adds the repository as the main repository

#### Scenario: Remove repository from project
Given a project with id "abc-123" has repository "repo-456" associated
When the user runs `vk project remove-repo abc-123 --repo repo-456`
Then the CLI removes the repository from the project

---

### Requirement: Task List Command
The CLI MUST provide a command to list tasks for a project with optional filtering by status.

#### Scenario: List tasks for project
Given a project with id "abc-123" has tasks
When the user runs `vk task list --project abc-123`
Then the CLI displays a table of tasks with id, title, and status

#### Scenario: List tasks with auto-detected project
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task list`
Then the CLI displays tasks for the auto-detected project

#### Scenario: Filter tasks by status
Given a project has tasks with various statuses
When the user runs `vk task list --status done`
Then the CLI displays only tasks with status "done"

#### Scenario: Filter tasks with JSON output
Given a project has multiple tasks
When the user runs `vk task list --status done --json`
Then the CLI outputs filtered tasks as JSON array

---

### Requirement: Task Show Command
The CLI MUST provide a command to show task details with auto-detection support.

#### Scenario: Show task details with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task show task-456`
- **THEN** the CLI displays task details including title, description, status, and timestamps

#### Scenario: Show task with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to a workspace with task_id "task-456"
- **AND** the user runs `vk task show` without providing ID
- **THEN** the CLI auto-detects task-456 and displays its details

---

### Requirement: Task Create Command
The CLI MUST provide a command to create a new task with optional immediate execution.

#### Scenario: Create task with immediate run
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug" --run --executor CLAUDE_CODE:DEFAULT`
Then the CLI creates the task in the auto-detected project
And the CLI creates a workspace with the specified executor
And the CLI displays the task ID and workspace ID with branch name

#### Scenario: Create task with run and base branch
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug" --run --executor CLAUDE_CODE:DEFAULT --base-branch develop`
Then the CLI creates the task in the auto-detected project
And the CLI creates a workspace with base branch "develop"

#### Scenario: Create task with run missing executor
When the user runs `vk task create --title "Fix bug" --run`
Then the CLI displays an error "Error: --executor is required when --run is specified"

---

### Requirement: Task Update Command
The CLI MUST provide a command to update a task with auto-detection support.

#### Scenario: Update task title with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --title "New title"`
- **THEN** the CLI updates the task title

#### Scenario: Update task status with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --status done`
- **THEN** the CLI updates the task status

---

### Requirement: Workspace List Command
The CLI MUST provide a command to list workspaces (task attempts) for a task with optional filtering.

#### Scenario: List workspaces for task
Given a task with id "task-456" has workspaces
When the user runs `vk attempt list --task task-456`
Then the CLI displays a table of workspaces with id, branch, name, archived, and pinned

#### Scenario: List workspaces with JSON output
Given a task with id "task-456" has workspaces
When the user runs `vk attempt list --task task-456 --json`
Then the CLI outputs workspaces as JSON array

#### Scenario: Filter workspaces by branch
Given a task has workspaces with different branches
When the user runs `vk attempt list --task task-456 --branch feature/test`
Then the CLI displays only workspaces with matching branch

---

### Requirement: Workspace Show Command
The CLI MUST provide a command to show workspace details with auto-detection support.

#### Scenario: Show workspace details with explicit ID
- **WHEN** a workspace with id "workspace-789" exists
- **AND** the user runs `vk attempt show workspace-789`
- **THEN** the CLI displays workspace details including branch, name, archived, pinned, agent_working_dir, and timestamps

#### Scenario: Show workspace with JSON output and explicit ID
- **WHEN** a workspace with id "workspace-789" exists
- **AND** the user runs `vk attempt show workspace-789 --json`
- **THEN** the CLI outputs the workspace details as JSON

#### Scenario: Show workspace with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to workspace "workspace-789"
- **AND** the user runs `vk attempt show` without providing ID
- **THEN** the CLI auto-detects workspace-789 and displays its details

---

### Requirement: Workspace Create Command
The CLI MUST provide a command to create a new workspace for a task.

#### Scenario: Create workspace with required options
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE:DEFAULT`
Then the CLI creates the workspace and displays the new workspace details

#### Scenario: Create workspace with base branch
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE:DEFAULT --base-branch develop`
Then the CLI creates the workspace with the specified base branch

#### Scenario: Create workspace missing required options
When the user runs `vk attempt create` without --task or --executor
Then the CLI displays an error indicating required options are missing

---

### Requirement: Workspace Update Command
The CLI MUST provide a command to update workspace properties with auto-detection support.

#### Scenario: Update workspace name with explicit ID
- **WHEN** a workspace with id "workspace-789" exists
- **AND** the user runs `vk attempt update workspace-789 --name "My Workspace"`
- **THEN** the CLI updates the workspace name

#### Scenario: Archive workspace with explicit ID
- **WHEN** a workspace with id "workspace-789" exists
- **AND** the user runs `vk attempt update workspace-789 --archived`
- **THEN** the CLI sets the workspace as archived

#### Scenario: Pin workspace with explicit ID
- **WHEN** a workspace with id "workspace-789" exists
- **AND** the user runs `vk attempt update workspace-789 --pinned`
- **THEN** the CLI sets the workspace as pinned

#### Scenario: Rename branch with explicit ID
- **WHEN** a workspace with id "workspace-789" exists
- **AND** the user runs `vk attempt update workspace-789 --branch new-branch-name`
- **THEN** the CLI renames the workspace's branch

#### Scenario: Update workspace with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to workspace "workspace-789"
- **AND** the user runs `vk attempt update --name "My Workspace"` without providing ID
- **THEN** the CLI auto-detects workspace-789 and updates it

---

### Requirement: Workspace Repos Command
The CLI MUST provide a command to list repositories associated with a workspace.

#### Scenario: List workspace repositories
Given a workspace with id "workspace-789" has repositories
When the user runs `vk attempt repos workspace-789`
Then the CLI displays a table of repositories with repo_id, branch, and worktree_path

#### Scenario: List workspace repositories with JSON output
Given a workspace with id "workspace-789" has repositories
When the user runs `vk attempt repos workspace-789 --json`
Then the CLI outputs repositories as JSON array

---

### Requirement: Default Project Resolution
The CLI MUST automatically resolve the default project from the current git repository when --project is not specified. Resolution works by matching the current git repository against repositories associated with projects.

#### Scenario: Auto-detect project from git remote
Given the user is in a git repository with remote URL "https://github.com/BloopAI/vibe-kanban.git"
And a project exists with an associated repository matching the git URL basename
When the user runs `vk task list` without --project flag
Then the CLI automatically uses the matching project ID

#### Scenario: No matching project found
Given the user is in a git repository
And no project has an associated repository matching the current git
When the user runs `vk task list` without --project flag
Then the CLI falls back to interactive selection

---

## REMOVED Requirements

### Requirement: Project List Filter by Archived Status (REMOVED)
The `--archived` filter option is removed as projects no longer have an `is_archived` field.

### Requirement: Project List Filter by Color (REMOVED)
The `--color` filter option is removed as projects no longer have a `hex_color` field.

### Requirement: Task Filter by Priority (REMOVED)
The `--priority` filter option is removed as tasks no longer have a `priority` field.

### Requirement: Task Filter by Executor (REMOVED)
The `--executor` filter option on task list is removed as tasks no longer have an `executor` field.

### Requirement: Task Filter by Label (REMOVED)
The `--label` filter option is removed as tasks no longer have a `labels` field.

### Requirement: Task Filter by Favorite (REMOVED)
The `--favorite` filter option is removed as tasks no longer have an `is_favorite` field.

### Requirement: Task Filter by Color (REMOVED)
The `--color` filter option on task list is removed as tasks no longer have a `hex_color` field.

### Requirement: Attempt Filter by Executor (REMOVED)
The `--executor` filter option on workspace list is removed as workspaces no longer have an `executor` field directly.

### Requirement: Attempt Filter by Target Branch (REMOVED)
The `--target-branch` filter option is removed as workspaces no longer have a `target_branch` field.

### Requirement: Attempt Update Target Branch (REMOVED)
The `--target-branch` update option is removed as workspaces no longer have this field.
