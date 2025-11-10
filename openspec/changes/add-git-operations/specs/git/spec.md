# Git Operations Specification

## ADDED Requirements

### Requirement: Merge Task Attempt
The CLI SHALL support merging task attempt branches.

#### Scenario: Merge task attempt branch
- **WHEN** user runs `vk git merge <attempt-id>`
- **THEN** merge the task attempt branch and display confirmation

#### Scenario: Merge with conflicts
- **WHEN** merge encounters conflicts
- **THEN** display error message with conflict details

### Requirement: Push Branch
The CLI SHALL support pushing task attempt branches to remote.

#### Scenario: Push task attempt branch
- **WHEN** user runs `vk git push <attempt-id>`
- **THEN** push the branch to remote and display confirmation

#### Scenario: Push fails
- **WHEN** push fails due to remote issues
- **THEN** display error message with details

### Requirement: Create GitHub PR
The CLI SHALL support creating GitHub pull requests from task attempts.

#### Scenario: Create PR with title
- **WHEN** user runs `vk git create-pr <attempt-id> --title "PR title"`
- **THEN** create GitHub PR and display PR URL

#### Scenario: Create PR with body
- **WHEN** user runs `vk git create-pr <attempt-id> --title "PR title" --body "Description"`
- **THEN** create GitHub PR with description and display PR URL

#### Scenario: Create PR with target branch
- **WHEN** user runs `vk git create-pr <attempt-id> --title "PR title" --target main`
- **THEN** create GitHub PR targeting specified branch

### Requirement: Rebase Task Attempt
The CLI SHALL support rebasing task attempt branches.

#### Scenario: Rebase to new base branch
- **WHEN** user runs `vk git rebase <attempt-id> --new-base feature-branch`
- **THEN** rebase task attempt to new base branch

#### Scenario: Rebase with conflicts
- **WHEN** rebase encounters conflicts
- **THEN** display error message with conflict details

### Requirement: Change Target Branch
The CLI SHALL support changing the target branch for task attempts.

#### Scenario: Change target branch
- **WHEN** user runs `vk git change-target <attempt-id> --target new-branch`
- **THEN** change target branch and display confirmation

### Requirement: Rename Branch
The CLI SHALL support renaming task attempt branches.

#### Scenario: Rename branch
- **WHEN** user runs `vk git rename-branch <attempt-id> --name new-branch-name`
- **THEN** rename branch and display confirmation

#### Scenario: Rename with children
- **WHEN** task attempt has child attempts
- **THEN** update all child attempts and display count

### Requirement: Branch Status
The CLI SHALL support checking branch status for task attempts.

#### Scenario: Check branch status
- **WHEN** user runs `vk git branch-status <attempt-id>`
- **THEN** display branch status including uncommitted changes, ahead/behind counts, and conflicts

#### Scenario: Status with JSON output
- **WHEN** user runs `vk git branch-status <attempt-id> --json`
- **THEN** display branch status as JSON

### Requirement: Error Handling
The CLI SHALL provide clear error messages for git operation failures.

#### Scenario: Git operation error
- **WHEN** git operation fails
- **THEN** display user-friendly error message with troubleshooting hints

#### Scenario: Conflict error
- **WHEN** operation encounters merge/rebase conflicts
- **THEN** display conflict details and suggested resolution steps
