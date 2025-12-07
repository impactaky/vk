## ADDED Requirements

### Requirement: Branch Name Parsing
The CLI MUST provide utilities to parse branch names and extract attempt identifiers.

#### Scenario: Parse branch with standard pattern
- **WHEN** a branch name follows the pattern `{username}/{hash}-{description}` (e.g., `impactaky/bd84-try-to-set-task`)
- **THEN** the parser extracts the hash prefix `bd84`

#### Scenario: Parse branch without standard pattern
- **WHEN** a branch name does not follow the standard pattern (e.g., `main`, `feature/test`, `fix-bug`)
- **THEN** the parser returns null indicating no attempt identifier found

#### Scenario: Parse branch with similar but invalid pattern
- **WHEN** a branch name has slashes but wrong format (e.g., `username/description-only`)
- **THEN** the parser returns null

---

### Requirement: Current Git Branch Detection
The CLI MUST provide utility to detect the current git branch.

#### Scenario: Get current branch in git repository
- **WHEN** the CLI is run inside a git repository on a specific branch
- **THEN** the utility returns the current branch name

#### Scenario: Get current branch outside git repository
- **WHEN** the CLI is run outside a git repository
- **THEN** the utility handles the error gracefully and returns null or throws appropriate error

---

### Requirement: Attempt Auto-Detection from Branch
The CLI MUST automatically detect the current attempt ID from the git branch name.

#### Scenario: Auto-detect attempt from matching branch
- **WHEN** user is in a git branch matching pattern `{username}/{hash}-{description}`
- **AND** an attempt exists with a branch field matching the current branch name
- **THEN** the CLI automatically uses that attempt's ID

#### Scenario: Auto-detect fails when no matching attempt
- **WHEN** user is in a git branch with valid pattern
- **AND** no attempt exists with a matching branch name
- **THEN** the CLI falls back to interactive selection or displays error

#### Scenario: Auto-detect skipped when ID provided
- **WHEN** user explicitly provides an attempt ID as argument
- **THEN** the CLI uses the provided ID and skips auto-detection

---

### Requirement: Task Auto-Detection from Current Attempt
The CLI MUST automatically detect the task ID from the current attempt's parent task.

#### Scenario: Auto-detect task from current attempt
- **WHEN** user omits task ID argument
- **AND** current branch corresponds to a valid attempt
- **THEN** the CLI uses the attempt's task_id field as the task ID

#### Scenario: Auto-detect task fails gracefully
- **WHEN** user omits task ID argument
- **AND** no attempt can be auto-detected from current branch
- **THEN** the CLI falls back to interactive selection or displays error requiring explicit task ID

---

## MODIFIED Requirements

### Requirement: Task Show Command
The CLI MUST provide a command to show task details with auto-detection support.

#### Scenario: Show task details with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task show task-456`
- **THEN** the CLI displays task details including title, description, and status

#### Scenario: Show task with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to an attempt with task_id "task-456"
- **AND** the user runs `vk task show` without providing ID
- **THEN** the CLI auto-detects task-456 and displays its details

#### Scenario: Show task fails without ID or valid branch
- **WHEN** user is not in a valid attempt branch
- **AND** the user runs `vk task show` without providing ID
- **THEN** the CLI falls back to interactive selection or displays an error

---

### Requirement: Task Update Command
The CLI MUST provide a command to update a task with auto-detection support.

#### Scenario: Update task title with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --title "New title"`
- **THEN** the CLI updates the task title

#### Scenario: Update task status with explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task update task-456 --status completed`
- **THEN** the CLI updates the task status

#### Scenario: Update task with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to an attempt with task_id "task-456"
- **AND** the user runs `vk task update --title "New title"` without providing ID
- **THEN** the CLI auto-detects task-456 and updates it

---

### Requirement: Task Delete Command
The CLI MUST provide a command to delete a task with auto-detection support.

#### Scenario: Delete task with confirmation and explicit ID
- **WHEN** a task with id "task-456" exists
- **AND** the user runs `vk task delete task-456`
- **THEN** the CLI asks for confirmation and deletes the task when confirmed

#### Scenario: Delete task with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to an attempt with task_id "task-456"
- **AND** the user runs `vk task delete` without providing ID
- **THEN** the CLI auto-detects task-456, asks for confirmation, and deletes when confirmed

---

### Requirement: Attempt Show Command
The CLI MUST provide a command to show attempt details with auto-detection support.

#### Scenario: Show attempt details with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt show attempt-789`
- **THEN** the CLI displays attempt details including branch, executor, target_branch, and timestamps

#### Scenario: Show attempt with JSON output and explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt show attempt-789 --json`
- **THEN** the CLI outputs the attempt details as JSON

#### Scenario: Show non-existent attempt with explicit ID
- **WHEN** no attempt with id "xyz-999" exists
- **AND** the user runs `vk attempt show xyz-999`
- **THEN** the CLI displays an error message

#### Scenario: Show attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt show` without providing ID
- **THEN** the CLI auto-detects attempt-789 and displays its details

---

### Requirement: Attempt Delete Command
The CLI MUST provide a command to delete an attempt with auto-detection support.

#### Scenario: Delete attempt with confirmation and explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt delete attempt-789`
- **THEN** the CLI asks for confirmation and deletes the attempt when confirmed

#### Scenario: Delete attempt force with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt delete attempt-789 --force`
- **THEN** the CLI deletes the attempt without confirmation

#### Scenario: Delete attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt delete` without providing ID
- **THEN** the CLI auto-detects attempt-789, asks for confirmation, and deletes when confirmed

---

### Requirement: Attempt Update Command
The CLI MUST provide a command to update attempt properties with auto-detection support.

#### Scenario: Update target branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt update attempt-789 --target-branch develop`
- **THEN** the CLI updates the attempt's target branch

#### Scenario: Rename branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt update attempt-789 --branch new-branch-name`
- **THEN** the CLI renames the attempt's branch

#### Scenario: Update attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt update --target-branch develop` without providing ID
- **THEN** the CLI auto-detects attempt-789 and updates it

---

### Requirement: Attempt Merge Command
The CLI MUST provide a command to merge an attempt's branch with auto-detection support.

#### Scenario: Merge attempt branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists with commits
- **AND** the user runs `vk attempt merge attempt-789`
- **THEN** the CLI merges the attempt's branch into target branch

#### Scenario: Merge with JSON output and explicit ID
- **WHEN** an attempt with id "attempt-789" exists with commits
- **AND** the user runs `vk attempt merge attempt-789 --json`
- **THEN** the CLI outputs the merge result as JSON

#### Scenario: Merge attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789" with commits
- **AND** the user runs `vk attempt merge` without providing ID
- **THEN** the CLI auto-detects attempt-789 and merges it

---

### Requirement: Attempt Push Command
The CLI MUST provide a command to push an attempt's branch to remote with auto-detection support.

#### Scenario: Push attempt branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt push attempt-789`
- **THEN** the CLI pushes the attempt's branch to the remote

#### Scenario: Push attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt push` without providing ID
- **THEN** the CLI auto-detects attempt-789 and pushes it

---

### Requirement: Attempt Rebase Command
The CLI MUST provide a command to rebase an attempt's branch with auto-detection support.

#### Scenario: Rebase attempt branch with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt rebase attempt-789`
- **THEN** the CLI rebases the attempt's branch onto target branch

#### Scenario: Rebase attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt rebase` without providing ID
- **THEN** the CLI auto-detects attempt-789 and rebases it

---

### Requirement: Attempt Stop Command
The CLI MUST provide a command to stop an attempt's execution with auto-detection support.

#### Scenario: Stop attempt execution with explicit ID
- **WHEN** an attempt with id "attempt-789" is running
- **AND** the user runs `vk attempt stop attempt-789`
- **THEN** the CLI stops the attempt's execution

#### Scenario: Stop attempt with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to running attempt "attempt-789"
- **AND** the user runs `vk attempt stop` without providing ID
- **THEN** the CLI auto-detects attempt-789 and stops it

---

### Requirement: Attempt PR Command
The CLI MUST provide a command to create a GitHub PR for an attempt with auto-detection support.

#### Scenario: Create PR for attempt with explicit ID
- **WHEN** an attempt with id "attempt-789" exists with pushed commits
- **AND** the user runs `vk attempt pr attempt-789`
- **THEN** the CLI creates a GitHub PR for the attempt's branch

#### Scenario: Create PR with title and explicit ID
- **WHEN** an attempt with id "attempt-789" exists with pushed commits
- **AND** the user runs `vk attempt pr attempt-789 --title "Fix bug"`
- **THEN** the CLI creates a GitHub PR with the specified title

#### Scenario: Create PR with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789" with pushed commits
- **AND** the user runs `vk attempt pr` without providing ID
- **THEN** the CLI auto-detects attempt-789 and creates a PR for it

---

### Requirement: Attempt Branch Status Command
The CLI MUST provide a command to check an attempt's branch status with auto-detection support.

#### Scenario: Show branch status with explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt branch-status attempt-789`
- **THEN** the CLI displays the branch status including ahead/behind counts

#### Scenario: Show branch status with JSON output and explicit ID
- **WHEN** an attempt with id "attempt-789" exists
- **AND** the user runs `vk attempt branch-status attempt-789 --json`
- **THEN** the CLI outputs the branch status as JSON

#### Scenario: Show branch status with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to attempt "attempt-789"
- **AND** the user runs `vk attempt branch-status` without providing ID
- **THEN** the CLI auto-detects attempt-789 and displays its branch status

---

### Requirement: Attempt List Command
The CLI MUST provide a command to list attempts for a task with optional filtering and auto-detection support.

#### Scenario: List attempts for task with explicit task ID
- **WHEN** a task with id "task-456" has attempts
- **AND** the user runs `vk attempt list --task task-456`
- **THEN** the CLI displays a table of attempts with id, branch, executor, and status

#### Scenario: List attempts with JSON output and explicit task ID
- **WHEN** a task with id "task-456" has attempts
- **AND** the user runs `vk attempt list --task task-456 --json`
- **THEN** the CLI outputs the attempts as JSON array

#### Scenario: List attempts with auto-detected project
- **WHEN** the user is in a git repository matching project "abc-123"
- **AND** task "task-456" belongs to project "abc-123"
- **AND** the user runs `vk attempt list --task task-456`
- **THEN** the CLI displays attempts for the specified task

#### Scenario: List attempts with auto-detected task ID from branch
- **WHEN** user is in a branch corresponding to an attempt with task_id "task-456"
- **AND** the user runs `vk attempt list` without --task flag
- **THEN** the CLI auto-detects task-456 and displays its attempts

#### Scenario: Filter attempts by executor
- **WHEN** a task has attempts with various executors
- **AND** the user runs `vk attempt list --task task-456 --executor CLAUDE_CODE`
- **THEN** the CLI displays only attempts with executor "CLAUDE_CODE"

#### Scenario: Filter attempts by branch
- **WHEN** a task has attempts with different branch names
- **AND** the user runs `vk attempt list --task task-456 --branch feature-branch`
- **THEN** the CLI displays only attempts with branch name "feature-branch"

#### Scenario: Filter attempts by target branch
- **WHEN** a task has attempts targeting different branches
- **AND** the user runs `vk attempt list --task task-456 --target-branch main`
- **THEN** the CLI displays only attempts targeting the "main" branch

#### Scenario: Filter attempts with multiple conditions
- **WHEN** a task has multiple attempts
- **AND** the user runs `vk attempt list --task task-456 --executor CLAUDE_CODE --target-branch main`
- **THEN** the CLI displays only attempts matching all filter conditions (AND logic)

#### Scenario: Filter attempts with JSON output
- **WHEN** a task has multiple attempts
- **AND** the user runs `vk attempt list --task task-456 --executor CLAUDE_CODE --json`
- **THEN** the CLI outputs filtered attempts as JSON array
