## MODIFIED Requirements

### Requirement: Project Repository Management
The CLI MUST provide commands to manage repositories associated with a project. The `add-repo` command MUST send the correct API payload with `display_name` and `git_repo_path`.

#### Scenario: Add repository to project
Given a project with id "abc-123" exists
And a git repository exists at "/path/to/repo"
When the user runs `vk project add-repo abc-123 --path /path/to/repo --display-name "My Repo"`
Then the CLI sends a request with `display_name: "My Repo"` and `git_repo_path: "/path/to/repo"` fields
And the repository is added to the project

### Requirement: Project Create with Repositories
The CLI MUST allow specifying repositories when creating a project using `--repo-path` and `--repo-name` options.

#### Scenario: Create project with repository
When the user runs `vk project create --name "My Project" --repo-path /path/to/repo --repo-name "My Repo"`
Then the CLI creates a project with a repository at the specified path and display name
