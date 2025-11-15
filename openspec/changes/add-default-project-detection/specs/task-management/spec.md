# Task Management Specification Deltas

## ADDED Requirements

### Requirement: Automatic Project Detection

The CLI SHALL automatically detect the current project ID by matching the git remote repository basename against registered vibe-kanban projects when the user does not explicitly provide a project ID.

#### Scenario: Git remote matches registered project

- **WHEN** user runs `vk task list` in a git repository
- **AND** the git remote origin URL basename matches a registered project name
- **THEN** the CLI SHALL use the matched project ID automatically
- **AND** no explicit `--project-id` parameter is required

#### Scenario: Git remote URL parsing

- **WHEN** the git remote origin URL is `https://github.com/user/my-repo.git`
- **THEN** the basename SHALL be extracted as `my-repo`
- **WHEN** the git remote origin URL is `git@github.com:user/my-repo.git`
- **THEN** the basename SHALL be extracted as `my-repo`

#### Scenario: No git repository

- **WHEN** user runs `vk task list` in a directory that is not a git repository
- **AND** no explicit `--project-id` is provided
- **THEN** the CLI SHALL display an error message indicating that the current directory is not a git repository
- **AND** the CLI SHALL suggest using the `--project-id` parameter explicitly

#### Scenario: No matching project found

- **WHEN** the git remote basename is `my-repo`
- **AND** no registered project in vibe-kanban matches `my-repo`
- **THEN** the CLI SHALL display an error listing available projects
- **AND** the CLI SHALL suggest using the `--project-id` parameter explicitly

#### Scenario: Explicit project ID overrides detection

- **WHEN** user runs `vk task list --project-id explicit-id`
- **THEN** the CLI SHALL use `explicit-id` regardless of git remote detection
- **AND** no automatic detection SHALL occur

## MODIFIED Requirements

### Requirement: Task List Command Arguments

The task list command SHALL accept an optional project ID parameter, falling back to automatic detection when not provided.

#### Scenario: Project ID provided explicitly

- **WHEN** user runs `vk task list <project-id>`
- **THEN** tasks SHALL be fetched for the specified project ID
- **AND** no automatic detection SHALL occur

#### Scenario: Project ID omitted

- **WHEN** user runs `vk task list` without a project ID argument
- **THEN** the CLI SHALL attempt automatic project detection via git remote
- **AND** use the detected project ID if successful
- **AND** display an error if detection fails

### Requirement: Task Create Command Arguments

The task create command SHALL accept an optional `--project-id` parameter, falling back to automatic detection when not provided.

#### Scenario: Project ID flag provided

- **WHEN** user runs `vk task create --project-id <id> --title "Task"`
- **THEN** the task SHALL be created for the specified project ID
- **AND** no automatic detection SHALL occur

#### Scenario: Project ID flag omitted

- **WHEN** user runs `vk task create --title "Task"` without `--project-id`
- **THEN** the CLI SHALL attempt automatic project detection via git remote
- **AND** use the detected project ID if successful
- **AND** display an error if detection fails
