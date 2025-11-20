# Default Project Resolution

## ADDED Requirements

### Requirement: Git URL Basename Extraction
The CLI MUST extract the repository basename from the current directory's git remote URL.

#### Scenario: Extract basename from HTTPS URL
Given the git remote URL is "https://github.com/user/repo-name.git"
When the CLI extracts the basename
Then the result is "repo-name"

#### Scenario: Extract basename from SSH URL
Given the git remote URL is "git@github.com:user/repo-name.git"
When the CLI extracts the basename
Then the result is "repo-name"

#### Scenario: Extract basename from URL without .git suffix
Given the git remote URL is "https://github.com/user/repo-name"
When the CLI extracts the basename
Then the result is "repo-name"

#### Scenario: Handle missing git remote
Given the current directory has no git remote configured
When the CLI attempts to extract the basename
Then the CLI returns null and does not set a default project

### Requirement: Project Lookup by Git URL Basename
The CLI MUST find a vibe-kanban project whose git URL basename matches the current repository.

#### Scenario: Find matching project
Given the extracted basename is "vk"
And a vibe-kanban project exists with git URL "https://github.com/impactaky/vk.git"
When the CLI looks up projects
Then the CLI identifies that project as the default

#### Scenario: No matching project found
Given the extracted basename is "unknown-repo"
And no vibe-kanban project has a matching git URL basename
When the CLI looks up projects
Then the CLI does not set a default project

### Requirement: Default Project Resolution Flow
The CLI MUST use the resolved project as default when no explicit project ID is provided.

#### Scenario: Use resolved default project
Given the user runs a CLI command without specifying a project ID
And the current directory's git basename matches a vibe-kanban project
When the command executes
Then the command uses the matched project's ID

#### Scenario: Explicit project ID takes precedence
Given the user runs a CLI command with an explicit project ID
And the current directory's git basename matches a different project
When the command executes
Then the command uses the explicitly provided project ID
