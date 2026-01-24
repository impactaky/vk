## MODIFIED Requirements

### Requirement: Project Repository Management
The CLI MUST provide commands to manage repositories associated with a project.

#### Scenario: List project repositories
Given a project with id "abc-123" has repositories associated
When the user runs `vk project repos abc-123`
Then the CLI displays a table of repositories with ID, Name, and Path

#### Scenario: List project repositories with JSON output
Given a project with id "abc-123" has repositories associated
When the user runs `vk project repos abc-123 --json`
Then the CLI outputs the full repository objects as JSON array

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
