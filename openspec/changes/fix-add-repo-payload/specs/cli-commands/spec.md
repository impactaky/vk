## MODIFIED Requirements

### Requirement: Project Repository Management
The CLI MUST provide commands to manage repositories associated with a project. The `add-repo` command MUST send the complete API payload including `display_name`.

#### Scenario: Add repository to project
Given a project with id "abc-123" exists
And a repository with id "repo-456" exists
When the user runs `vk project add-repo abc-123 --repo repo-456`
Then the CLI sends a request with `repo_id`, `is_main`, and `display_name` fields
And the repository is added to the project

#### Scenario: Add main repository to project
Given a project with id "abc-123" exists
And a repository with id "repo-456" exists
When the user runs `vk project add-repo abc-123 --repo repo-456 --main`
Then the CLI sends a request with `repo_id`, `is_main: true`, and `display_name` fields
And the repository is added as the main repository
