## ADDED Requirements

### Requirement: Project Add Repository Command
The CLI MUST provide a command to add a repository to a project using `display_name` and `git_repo_path` fields.

#### Scenario: Add repository to project
Given a project with id "abc-123" exists
And a git repository exists at "/path/to/repo"
When the user runs `vk project add-repo abc-123 --path /path/to/repo --display-name "My Repo"`
Then the CLI sends a request with `display_name: "My Repo"` and `git_repo_path: "/path/to/repo"` fields
And the repository is added to the project

#### Scenario: Add repository with auto-detected project
Given user is in a directory within a registered project's repository
And a git repository exists at "/path/to/repo"
When the user runs `vk project add-repo --path /path/to/repo --display-name "My Repo"`
Then the CLI auto-detects the project and adds the repository

---
