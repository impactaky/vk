# cli-commands Spec Delta

## ADDED Requirements

### Requirement: Attempt List Command
The CLI MUST provide a command to list attempts for a task.

#### Scenario: List attempts for task
Given a task with id "task-456" has attempts
When the user runs `vk attempt list --task task-456`
Then the CLI displays a table of attempts with id, branch, executor, and status

#### Scenario: List attempts with JSON output
Given a task with id "task-456" has attempts
When the user runs `vk attempt list --task task-456 --json`
Then the CLI outputs the attempts as JSON array

#### Scenario: List attempts with auto-detected project
Given the user is in a git repository matching project "abc-123"
And task "task-456" belongs to project "abc-123"
When the user runs `vk attempt list --task task-456`
Then the CLI displays attempts for the specified task

---

### Requirement: Attempt Show Command
The CLI MUST provide a command to show attempt details.

#### Scenario: Show attempt details
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt show attempt-789`
Then the CLI displays attempt details including branch, executor, target_branch, and timestamps

#### Scenario: Show attempt with JSON output
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt show attempt-789 --json`
Then the CLI outputs the attempt details as JSON

#### Scenario: Show non-existent attempt
Given no attempt with id "xyz-999" exists
When the user runs `vk attempt show xyz-999`
Then the CLI displays an error message

---

### Requirement: Attempt Create Command
The CLI MUST provide a command to create a new attempt for a task.

#### Scenario: Create attempt with required options
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE`
Then the CLI creates the attempt and displays the new attempt details

#### Scenario: Create attempt with base branch
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE --base-branch develop`
Then the CLI creates the attempt with the specified base branch

#### Scenario: Create attempt missing required options
When the user runs `vk attempt create` without --task or --executor
Then the CLI displays an error indicating required options are missing

---
