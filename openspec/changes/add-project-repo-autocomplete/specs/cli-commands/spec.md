# cli-commands Spec Delta

## MODIFIED Requirements

### Requirement: Default Project Resolution
The CLI MUST automatically resolve the default project from the current git repository when --project is not specified. The CLI SHALL use repository-based matching as the primary strategy, with direct git basename matching as fallback.

#### Scenario: Auto-detect project via registered repository
- **WHEN** user is in a git repository that matches a registered repository
- **AND** a project exists with git_repo_path basename matching the repository's name
- **AND** the user runs `vk project show` without providing ID
- **THEN** the CLI auto-detects the project using repository-based matching

#### Scenario: Auto-detect project via repository across different machines
- **WHEN** user is in a git repository cloned to a different path than the project's git_repo_path
- **AND** a registered repository matches the current directory (via git URL or path)
- **AND** the repository's name matches the project's git_repo_path basename
- **AND** the user runs `vk project show` without providing ID
- **THEN** the CLI auto-detects the project using repository-based matching

#### Scenario: Auto-detect project with multiple matches via repository
- **WHEN** multiple projects have git_repo_path basenames matching the resolved repository's name
- **AND** the user runs `vk project show` without providing ID
- **THEN** the CLI uses the first match and warns about multiple matches

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
