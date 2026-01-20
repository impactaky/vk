# cli-commands Specification Delta

## ADDED Requirements

### Requirement: Repository List Command
The CLI MUST provide a command to list all registered repositories with optional filtering.

#### Scenario: List repositories successfully
Given the vibe-kanban API is running
When the user runs `vk repository list`
Then the CLI displays a table of all repositories with id, name, display_name, and path

#### Scenario: List repositories with JSON output
Given the vibe-kanban API is running
When the user runs `vk repository list --json`
Then the CLI outputs the repositories as JSON array

#### Scenario: Filter repositories by name
Given the vibe-kanban API has repositories with different names
When the user runs `vk repository list --name my-repo`
Then the CLI displays only repositories with matching name

#### Scenario: Filter repositories by path
Given the vibe-kanban API has repositories at different paths
When the user runs `vk repository list --path /home/user/projects`
Then the CLI displays only repositories with matching path

#### Scenario: No repositories found
Given the vibe-kanban API has no repositories
When the user runs `vk repository list`
Then the CLI displays "No repositories found."

---

### Requirement: Repository Show Command
The CLI MUST provide a command to show details of a specific repository.

#### Scenario: Show repository details
Given a repository with id "repo-123" exists
When the user runs `vk repository show repo-123`
Then the CLI displays the repository details including name, display_name, path, and scripts

#### Scenario: Show repository with JSON output
Given a repository with id "repo-123" exists
When the user runs `vk repository show repo-123 --json`
Then the CLI outputs the repository as JSON

#### Scenario: Show non-existent repository
Given no repository with id "xyz-999" exists
When the user runs `vk repository show xyz-999`
Then the CLI displays an error message

---

### Requirement: Repository Register Command
The CLI MUST provide a command to register an existing git repository.

#### Scenario: Register repository interactively
Given the vibe-kanban API is running
When the user runs `vk repository register`
Then the CLI prompts for path and optional display_name
And registers the repository when provided

#### Scenario: Register repository with flags
Given the vibe-kanban API is running
And a git repository exists at "/path/to/repo"
When the user runs `vk repository register --path /path/to/repo --display-name "My Repo"`
Then the CLI registers the repository without prompts
And displays the new repository ID

#### Scenario: Register repository with path only
Given the vibe-kanban API is running
And a git repository exists at "/path/to/repo"
When the user runs `vk repository register --path /path/to/repo`
Then the CLI registers the repository with null display_name

---

### Requirement: Repository Init Command
The CLI MUST provide a command to initialize a new git repository.

#### Scenario: Initialize repository interactively
Given the vibe-kanban API is running
When the user runs `vk repository init`
Then the CLI prompts for parent_path and folder_name
And initializes the repository when provided

#### Scenario: Initialize repository with flags
Given the vibe-kanban API is running
And the directory "/home/user/projects" exists
When the user runs `vk repository init --parent-path /home/user/projects --folder-name new-project`
Then the CLI creates and registers a new git repository at "/home/user/projects/new-project"
And displays the new repository ID and path

---

### Requirement: Repository Update Command
The CLI MUST provide a command to update repository properties.

#### Scenario: Update repository display name
Given a repository with id "repo-123" exists
When the user runs `vk repository update repo-123 --display-name "New Name"`
Then the CLI updates the repository display_name

#### Scenario: Update repository setup script
Given a repository with id "repo-123" exists
When the user runs `vk repository update repo-123 --setup-script "npm install"`
Then the CLI updates the repository setup_script

#### Scenario: Update repository cleanup script
Given a repository with id "repo-123" exists
When the user runs `vk repository update repo-123 --cleanup-script "npm run clean"`
Then the CLI updates the repository cleanup_script

#### Scenario: Update repository dev server script
Given a repository with id "repo-123" exists
When the user runs `vk repository update repo-123 --dev-server-script "npm run dev"`
Then the CLI updates the repository dev_server_script

#### Scenario: Update repository parallel setup
Given a repository with id "repo-123" exists
When the user runs `vk repository update repo-123 --parallel-setup`
Then the CLI enables parallel_setup_script for the repository

#### Scenario: Update repository copy files
Given a repository with id "repo-123" exists
When the user runs `vk repository update repo-123 --copy-files "*.env,config/*"`
Then the CLI updates the repository copy_files

#### Scenario: No updates specified
Given a repository with id "repo-123" exists
When the user runs `vk repository update repo-123` without any update flags
Then the CLI displays "No updates specified."

---

### Requirement: Repository Branches Command
The CLI MUST provide a command to list branches for a repository.

#### Scenario: List all branches
Given a repository with id "repo-123" exists with branches
When the user runs `vk repository branches repo-123`
Then the CLI displays a table of branches with name, current indicator, and remote status

#### Scenario: List branches with JSON output
Given a repository with id "repo-123" exists with branches
When the user runs `vk repository branches repo-123 --json`
Then the CLI outputs the branches as JSON array

#### Scenario: List only remote branches
Given a repository with id "repo-123" has local and remote branches
When the user runs `vk repository branches repo-123 --remote`
Then the CLI displays only remote branches

#### Scenario: List only local branches
Given a repository with id "repo-123" has local and remote branches
When the user runs `vk repository branches repo-123 --local`
Then the CLI displays only local branches

#### Scenario: No branches found
Given a repository with id "repo-123" has no branches
When the user runs `vk repository branches repo-123`
Then the CLI displays "No branches found."

---
