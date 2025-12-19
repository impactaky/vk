## MODIFIED Requirements

### Requirement: Task List Command
The CLI MUST provide a command to list tasks for a project with optional filtering.

#### Scenario: Filter tasks by status (updated values)
Given a project has tasks with various statuses
When the user runs `vk task list --status done`
Then the CLI displays only tasks with status "done"

#### Scenario: Filter tasks by status inreview
Given a project has tasks in code review
When the user runs `vk task list --status inreview`
Then the CLI displays only tasks with status "inreview"

#### Scenario: Filter tasks by status todo
Given a project has tasks not yet started
When the user runs `vk task list --status todo`
Then the CLI displays only tasks with status "todo"

---

### Requirement: Task Create Command
The CLI MUST provide a command to create a new task with optional immediate execution.

#### Scenario: Create task with status
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "New feature" --status inprogress`
Then the CLI creates the task with status "inprogress"

---

### Requirement: Task Update Command
The CLI MUST provide a command to update a task with auto-detection support.

#### Scenario: Update task status to done
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --status done`
- **THEN** the CLI updates the task status to "done"

#### Scenario: Update task status to inreview
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --status inreview`
- **THEN** the CLI updates the task status to "inreview"

---

## ADDED Requirements

### Requirement: Attempt Follow-Up Command
The CLI MUST provide a command to send follow-up messages to running attempts.

#### Scenario: Send follow-up message with explicit ID
- **WHEN** an attempt with id "attempt-789" is running
- **AND** the user runs `vk attempt follow-up attempt-789 --message "Please also add tests"`
- **THEN** the CLI sends the follow-up message to the running executor

#### Scenario: Send follow-up with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to running attempt "attempt-789"
- **AND** the user runs `vk attempt follow-up --message "Continue with next step"`
- **THEN** the CLI auto-detects attempt-789 and sends the follow-up

#### Scenario: Follow-up fails when attempt not running
- **WHEN** an attempt with id "attempt-789" is not running
- **AND** the user runs `vk attempt follow-up attempt-789 --message "test"`
- **THEN** the CLI displays an error indicating the attempt is not running

---

### Requirement: Attempt Force Push Command
The CLI MUST provide a command to force push an attempt's branch to remote.

#### Scenario: Force push attempt branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt force-push attempt-789`
- **THEN** the CLI force pushes the attempt's branch to the remote

#### Scenario: Force push with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt force-push` without providing ID
- **THEN** the CLI auto-detects attempt-789 and force pushes it

#### Scenario: Force push with confirmation
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt force-push attempt-789`
- **THEN** the CLI asks for confirmation before force pushing
- **AND** proceeds when user confirms

---

### Requirement: Attempt Abort Conflicts Command
The CLI MUST provide a command to abort git conflicts for an attempt.

#### Scenario: Abort conflicts with explicit ID
- **WHEN** an attempt with id "attempt-789" has ongoing conflicts
- **AND** the user runs `vk attempt abort-conflicts attempt-789`
- **THEN** the CLI aborts the conflicts for the attempt

#### Scenario: Abort conflicts with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789" with conflicts
- **AND** the user runs `vk attempt abort-conflicts` without providing ID
- **THEN** the CLI auto-detects attempt-789 and aborts conflicts

---

### Requirement: Attempt Attach PR Command
The CLI MUST provide a command to attach an existing GitHub PR to an attempt.

#### Scenario: Attach existing PR with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** a GitHub PR #42 exists for the same branch
- **AND** the user runs `vk attempt attach-pr attempt-789 --pr-number 42`
- **THEN** the CLI attaches PR #42 to the attempt

#### Scenario: Attach PR with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt attach-pr --pr-number 42`
- **THEN** the CLI auto-detects attempt-789 and attaches PR #42

---

### Requirement: Attempt PR Comments Command
The CLI MUST provide a command to view comments on an attempt's pull request.

#### Scenario: View PR comments with explicit ID
- **WHEN** an attempt with id "attempt-789" has an associated PR with comments
- **AND** the user runs `vk attempt pr-comments attempt-789`
- **THEN** the CLI displays the PR comments

#### Scenario: View PR comments with JSON output
- **WHEN** an attempt with id "attempt-789" has an associated PR with comments
- **AND** the user runs `vk attempt pr-comments attempt-789 --json`
- **THEN** the CLI outputs the PR comments as JSON

#### Scenario: View PR comments with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789" with PR
- **AND** the user runs `vk attempt pr-comments` without providing ID
- **THEN** the CLI auto-detects attempt-789 and displays its PR comments

#### Scenario: PR comments fails when no PR exists
- **WHEN** an attempt with id "attempt-789" has no associated PR
- **AND** the user runs `vk attempt pr-comments attempt-789`
- **THEN** the CLI displays an error indicating no PR is associated

---

### Requirement: Executor Name Validation
The CLI MUST validate executor names against the supported BaseCodingAgent enum.

#### Scenario: Valid executor name accepted
- **WHEN** the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE:DEFAULT`
- **THEN** the CLI accepts the executor name and creates the attempt

#### Scenario: Invalid executor name rejected
- **WHEN** the user runs `vk attempt create --task task-456 --executor INVALID_AGENT:DEFAULT`
- **THEN** the CLI displays an error listing valid executor names: CLAUDE_CODE, AMP, GEMINI, CODEX, OPENCODE, CURSOR_AGENT, QWEN_CODE, COPILOT, DROID

#### Scenario: All supported executor names
- **GIVEN** the supported executors are CLAUDE_CODE, AMP, GEMINI, CODEX, OPENCODE, CURSOR_AGENT, QWEN_CODE, COPILOT, DROID
- **WHEN** the user runs `vk attempt create` with any of these executors
- **THEN** the CLI accepts the executor name

---

### Requirement: Updated Task Status Values
The CLI MUST use the vibe-kanban TaskStatus values: todo, inprogress, inreview, done, cancelled.

#### Scenario: Status enum values in help text
- **WHEN** the user runs `vk task list --help`
- **THEN** the help text shows status options as: todo, inprogress, inreview, done, cancelled

#### Scenario: Status enum values in create help
- **WHEN** the user runs `vk task create --help`
- **THEN** the help text shows status options as: todo, inprogress, inreview, done, cancelled

#### Scenario: Invalid status rejected
- **WHEN** the user runs `vk task update task-456 --status pending`
- **THEN** the CLI displays an error indicating valid status values

---
