# fzf-selection Specification

## Purpose
Provide interactive fuzzy-search selection for projects, tasks, and attempts when required IDs are not provided and cannot be auto-detected.

## ADDED Requirements

### Requirement: FZF Availability Check
The CLI MUST check for fzf installation before attempting interactive selection.

#### Scenario: FZF not installed
Given fzf is not installed on the system
When a command requires interactive selection
Then the CLI displays an error message indicating fzf is required
And suggests installation instructions

#### Scenario: FZF is installed
Given fzf is installed on the system
When a command requires interactive selection
Then the CLI launches fzf with the available items

---

### Requirement: Interactive Project Selection
The CLI MUST provide fzf selection for projects when auto-detection fails and --project is not specified.

#### Scenario: Select project via fzf when not in git repo
Given the user is not in a git repository
And fzf is installed
When the user runs `vk task list` without --project flag
Then the CLI launches fzf with available projects showing name and git_repo_path
And continues with the selected project ID

#### Scenario: Select project via fzf when no matching project
Given the user is in a git repository with no matching project
And fzf is installed
When the user runs `vk task list` without --project flag
Then the CLI launches fzf with available projects
And continues with the selected project ID

#### Scenario: User cancels project selection
Given fzf is launched for project selection
When the user presses Escape or Ctrl-C
Then the CLI exits without executing the command

---

### Requirement: Interactive Task Selection
The CLI MUST provide fzf selection for tasks when task ID is omitted from task commands.

#### Scenario: Select task via fzf for task show
Given a project is resolved (auto-detected or selected)
And the project has tasks
And fzf is installed
When the user runs `vk task show` without task ID
Then the CLI launches fzf with available tasks showing id, title, and status
And displays the selected task details

#### Scenario: Select task via fzf for task update
Given a project is resolved
And fzf is installed
When the user runs `vk task update --title "New title"` without task ID
Then the CLI launches fzf to select the task
And updates the selected task

#### Scenario: Select task via fzf for task delete
Given a project is resolved
And fzf is installed
When the user runs `vk task delete` without task ID
Then the CLI launches fzf to select the task
And proceeds with delete confirmation for selected task

#### Scenario: No tasks available for selection
Given a project has no tasks
When the user runs `vk task show` without task ID
Then the CLI displays an error indicating no tasks found

---

### Requirement: Interactive Attempt Selection
The CLI MUST provide fzf selection for attempts when attempt ID is omitted from attempt commands.

#### Scenario: Select attempt via fzf for attempt show
Given fzf is installed
When the user runs `vk attempt show` without attempt ID
Then the CLI prompts for task selection first (if needed)
Then launches fzf with available attempts showing id, branch, and executor
And displays the selected attempt details

#### Scenario: Select attempt via fzf for attempt merge
Given fzf is installed
When the user runs `vk attempt merge` without attempt ID
Then the CLI launches fzf to select the attempt
And merges the selected attempt's branch

#### Scenario: Select attempt via fzf for attempt pr
Given fzf is installed
When the user runs `vk attempt pr` without attempt ID
Then the CLI launches fzf to select the attempt
And creates PR for the selected attempt

#### Scenario: Select attempt via fzf for other attempt commands
Given fzf is installed
When the user runs `vk attempt <update|delete|push|rebase|stop|branch-status>` without attempt ID
Then the CLI launches fzf to select the attempt
And executes the command with the selected attempt

---

### Requirement: FZF Display Format
The CLI MUST display items in a readable format within fzf.

#### Scenario: Project display format
When fzf displays projects
Then each line shows: `<id>  <name>  <git_repo_path>`

#### Scenario: Task display format
When fzf displays tasks
Then each line shows: `<id>  <title>  [<status>]`

#### Scenario: Attempt display format
When fzf displays attempts
Then each line shows: `<id>  <branch>  <executor>`

---
