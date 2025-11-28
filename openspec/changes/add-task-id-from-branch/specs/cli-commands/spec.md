# cli-commands Spec Delta

## ADDED Requirements

### Requirement: Task ID Auto-Detection from Branch
The CLI MUST automatically extract and use the task ID from the current git branch name when task-related commands are invoked without an explicit task ID argument.

#### Scenario: Extract task ID from standard branch format
- **WHEN** the current branch name follows the pattern `<prefix>/<task-id>-<description>` (e.g., `impactaky/99d7-try-to-set-task`)
- **THEN** the CLI extracts the task ID portion (e.g., `99d7`) from the branch name

#### Scenario: Handle branch names without task IDs
- **WHEN** the current branch name does not contain a task ID pattern (e.g., `main`, `develop`, `feature-branch`)
- **THEN** the CLI does not extract a task ID and requires explicit task ID if the command needs one

#### Scenario: Task ID extraction with various separators
- **WHEN** the current branch name is `user/abc123-description` or `user/abc123_description`
- **THEN** the CLI extracts `abc123` as the task ID

---

### Requirement: Git Branch Utilities
The CLI MUST provide utility functions to interact with git branch information.

#### Scenario: Get current branch name
- **WHEN** the CLI is executed within a git repository
- **THEN** it can retrieve the current branch name using git commands

#### Scenario: Handle non-git directories
- **WHEN** the CLI is executed outside a git repository
- **THEN** branch name retrieval returns null or empty without crashing

---

## MODIFIED Requirements

### Requirement: Task Show Command
The CLI MUST provide a command to show task details, with optional task ID parameter that falls back to auto-detection from branch name.

#### Scenario: Show task details with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task show task-456`
- **THEN** the CLI displays task details for "task-456"

#### Scenario: Show task details with auto-detected ID
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** a task with id "99d7" exists
- **AND** the user runs `vk task show` without arguments
- **THEN** the CLI automatically uses "99d7" and displays task details

#### Scenario: Show task without ID and invalid branch
- **WHEN** the current branch is "main" (no task ID pattern)
- **AND** the user runs `vk task show` without arguments
- **THEN** the CLI displays an error indicating task ID could not be determined from branch and requires explicit task ID

#### Scenario: Show task outside git repository
- **WHEN** the user is not in a git repository
- **AND** the user runs `vk task show` without arguments
- **THEN** the CLI displays an error indicating task ID is required

---

### Requirement: Task Update Command
The CLI MUST provide a command to update a task, with optional task ID parameter that falls back to auto-detection from branch name.

#### Scenario: Update task with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --title "New title"`
- **THEN** the CLI updates the task title for "task-456"

#### Scenario: Update task with auto-detected ID
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** a task with id "99d7" exists
- **AND** the user runs `vk task update --status completed`
- **THEN** the CLI automatically uses "99d7" and updates the task status

#### Scenario: Update task without ID and invalid branch
- **WHEN** the current branch is "main" (no task ID pattern)
- **AND** the user runs `vk task update --status completed`
- **THEN** the CLI displays an error indicating task ID could not be determined from branch

---

### Requirement: Task Delete Command
The CLI MUST provide a command to delete a task, with optional task ID parameter that falls back to auto-detection from branch name.

#### Scenario: Delete task with explicit ID and confirmation
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task delete task-456`
- **THEN** the CLI asks for confirmation and deletes the task when confirmed

#### Scenario: Delete task with auto-detected ID
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** a task with id "99d7" exists
- **AND** the user runs `vk task delete --force`
- **THEN** the CLI automatically uses "99d7" and deletes the task without confirmation

#### Scenario: Delete task without ID and invalid branch
- **WHEN** the current branch is "develop" (no task ID pattern)
- **AND** the user runs `vk task delete`
- **THEN** the CLI displays an error indicating task ID could not be determined from branch

---

### Requirement: Attempt List Command
The CLI MUST provide a command to list attempts for a task with optional --task flag that falls back to auto-detection from branch name.

#### Scenario: List attempts with explicit task ID
- **WHEN** a task with id "task-456" has attempts
- **AND** the user runs `vk attempt list --task task-456`
- **THEN** the CLI displays attempts for "task-456"

#### Scenario: List attempts with auto-detected task ID
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** a task with id "99d7" has attempts
- **AND** the user runs `vk attempt list` without --task flag
- **THEN** the CLI automatically uses "99d7" and displays attempts for that task

#### Scenario: List attempts without task ID and invalid branch
- **WHEN** the current branch is "main" (no task ID pattern)
- **AND** the user runs `vk attempt list` without --task flag
- **THEN** the CLI displays an error indicating task ID could not be determined from branch and --task is required

#### Scenario: List attempts with JSON output and auto-detection
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** a task with id "99d7" has attempts
- **AND** the user runs `vk attempt list --json`
- **THEN** the CLI outputs attempts for "99d7" as JSON array

#### Scenario: List attempts with auto-detected project and explicit task
- **WHEN** the user is in a git repository matching project "abc-123"
- **AND** task "task-456" belongs to project "abc-123"
- **AND** the user runs `vk attempt list --task task-456`
- **THEN** the CLI displays attempts for the specified task

#### Scenario: Filter attempts with auto-detected task
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** a task with id "99d7" has attempts with various executors
- **AND** the user runs `vk attempt list --executor CLAUDE_CODE`
- **THEN** the CLI displays only attempts for task "99d7" with executor "CLAUDE_CODE"

---

### Requirement: Attempt Create Command
The CLI MUST provide a command to create a new attempt for a task with optional --task flag that falls back to auto-detection from branch name.

#### Scenario: Create attempt with explicit task ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE`
- **THEN** the CLI creates an attempt for "task-456"

#### Scenario: Create attempt with auto-detected task ID
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** a task with id "99d7" exists
- **AND** the user runs `vk attempt create --executor CLAUDE_CODE`
- **THEN** the CLI automatically uses "99d7" and creates an attempt for that task

#### Scenario: Create attempt without task ID and invalid branch
- **WHEN** the current branch is "main" (no task ID pattern)
- **AND** the user runs `vk attempt create --executor CLAUDE_CODE`
- **THEN** the CLI displays an error indicating task ID could not be determined from branch and --task is required

#### Scenario: Create attempt with base branch and auto-detected task
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** a task with id "99d7" exists
- **AND** the user runs `vk attempt create --executor CLAUDE_CODE --base-branch develop`
- **THEN** the CLI creates an attempt for "99d7" with the specified base branch

#### Scenario: Create attempt missing executor with auto-detected task
- **WHEN** the current branch is "impactaky/99d7-fix-bug"
- **AND** the user runs `vk attempt create` without --executor
- **THEN** the CLI displays an error indicating --executor is required

---
