## ADDED Requirements

### Requirement: Attempt Delete Command
The CLI MUST provide a command to delete an attempt.

#### Scenario: Delete attempt with confirmation
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt delete attempt-789`
Then the CLI asks for confirmation
And deletes the attempt when confirmed

#### Scenario: Delete attempt force
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt delete attempt-789 --force`
Then the CLI deletes the attempt without confirmation

---

### Requirement: Attempt Update Command
The CLI MUST provide a command to update attempt properties.

#### Scenario: Update target branch
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt update attempt-789 --target-branch develop`
Then the CLI updates the attempt's target branch

#### Scenario: Rename branch
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt update attempt-789 --branch new-branch-name`
Then the CLI renames the attempt's branch

---

### Requirement: Attempt Merge Command
The CLI MUST provide a command to merge an attempt's branch.

#### Scenario: Merge attempt branch
Given an attempt with id "attempt-789" exists with commits
When the user runs `vk attempt merge attempt-789`
Then the CLI merges the attempt's branch into target branch

#### Scenario: Merge with JSON output
Given an attempt with id "attempt-789" exists with commits
When the user runs `vk attempt merge attempt-789 --json`
Then the CLI outputs the merge result as JSON

---

### Requirement: Attempt Push Command
The CLI MUST provide a command to push an attempt's branch to remote.

#### Scenario: Push attempt branch
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt push attempt-789`
Then the CLI pushes the attempt's branch to the remote

---

### Requirement: Attempt Rebase Command
The CLI MUST provide a command to rebase an attempt's branch.

#### Scenario: Rebase attempt branch
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt rebase attempt-789`
Then the CLI rebases the attempt's branch onto target branch

---

### Requirement: Attempt Stop Command
The CLI MUST provide a command to stop an attempt's execution.

#### Scenario: Stop attempt execution
Given an attempt with id "attempt-789" is running
When the user runs `vk attempt stop attempt-789`
Then the CLI stops the attempt's execution

---

### Requirement: Attempt PR Command
The CLI MUST provide a command to create a GitHub PR for an attempt.

#### Scenario: Create PR for attempt
Given an attempt with id "attempt-789" exists with pushed commits
When the user runs `vk attempt pr attempt-789`
Then the CLI creates a GitHub PR for the attempt's branch

#### Scenario: Create PR with title
Given an attempt with id "attempt-789" exists with pushed commits
When the user runs `vk attempt pr attempt-789 --title "Fix bug"`
Then the CLI creates a GitHub PR with the specified title

---

### Requirement: Attempt Branch Status Command
The CLI MUST provide a command to check an attempt's branch status.

#### Scenario: Show branch status
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt branch-status attempt-789`
Then the CLI displays the branch status including ahead/behind counts

#### Scenario: Show branch status with JSON output
Given an attempt with id "attempt-789" exists
When the user runs `vk attempt branch-status attempt-789 --json`
Then the CLI outputs the branch status as JSON

---

## MODIFIED Requirements

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

#### Scenario: Create attempt with target branch
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE --target-branch feature/new`
Then the CLI creates the attempt with the specified target branch

#### Scenario: Create attempt missing required options
When the user runs `vk attempt create` without --task or --executor
Then the CLI displays an error indicating required options are missing
