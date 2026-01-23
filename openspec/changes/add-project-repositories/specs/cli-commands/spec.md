# cli-commands Spec Delta

## MODIFIED Requirements

### Requirement: Project List Command
The CLI MUST provide a command to list all projects with optional filtering.

#### Scenario: List projects successfully
Given the vibe-kanban API is running
When the user runs `vk project list`
Then the CLI displays a table of all projects with id, name, repositories count, and archived status

#### Scenario: List projects with JSON output
Given the vibe-kanban API is running
When the user runs `vk project list --json`
Then the CLI outputs the projects as JSON array including full repositories data

---

### Requirement: Project Show Command
The CLI MUST provide a command to show details of a specific project.

#### Scenario: Show project details
Given a project with id "abc-123" exists
When the user runs `vk project show abc-123`
Then the CLI displays the project details including name, repositories list with paths, and scripts

#### Scenario: Show project with multiple repositories
Given a project with id "abc-123" exists with 3 repositories
When the user runs `vk project show abc-123`
Then the CLI displays each repository with its id, name, and path

---

### Requirement: Project Create Command
The CLI MUST provide a command to create a new project.

#### Scenario: Create project with repository
Given the vibe-kanban API is running
And a repository with id "repo-123" exists
When the user runs `vk project create --name "My Project" --repository repo-123`
Then the CLI creates the project with the specified repository

#### Scenario: Create project with multiple repositories
Given the vibe-kanban API is running
And repositories "repo-1" and "repo-2" exist
When the user runs `vk project create --name "My Project" --repository repo-1 --repository repo-2`
Then the CLI creates the project with both repositories

#### Scenario: Create project without repositories
Given the vibe-kanban API is running
When the user runs `vk project create --name "My Project"`
Then the CLI creates the project with an empty repositories array

---

### Requirement: Auto-detect Project from Git
The CLI MUST automatically detect the current project based on registered repositories.

#### Scenario: Match project by repository path
Given the user is in a directory "/home/user/my-repo"
And a project exists with a repository whose path is "/home/user/my-repo"
When the user runs a command requiring project context
Then the CLI automatically uses that project

#### Scenario: No matching repository
Given the user is in a directory that doesn't match any registered repository
When the user runs a command requiring project context
Then the CLI falls back to fzf selection or shows an error
