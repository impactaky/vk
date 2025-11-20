# cli-commands Specification Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Task Create Command
The CLI MUST provide a command to create a new task.

#### Scenario: Create task with auto-detected project
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug"`
Then the CLI creates the task in the auto-detected project
