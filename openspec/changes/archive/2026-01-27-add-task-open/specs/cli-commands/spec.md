## ADDED Requirements

### Requirement: Task Open Command
The CLI MUST provide a command to open a task in the default web browser with auto-detection support.

#### Scenario: Open task with explicit ID
- **WHEN** a task with id "task-456" exists in project "proj-123"
- **AND** the user runs `vk task open task-456`
- **THEN** the CLI opens `{VK_URL}/projects/proj-123/tasks/task-456` in the default browser

#### Scenario: Open task with auto-detected ID from branch
- **WHEN** user is in a branch corresponding to an attempt with task_id "task-456"
- **AND** the user runs `vk task open` without providing ID
- **THEN** the CLI auto-detects task-456 and opens its URL in the default browser

#### Scenario: Open task with project option
- **WHEN** multiple projects exist
- **AND** the user runs `vk task open --project proj-123`
- **THEN** the CLI prompts for task selection from project "proj-123" using fzf
- **AND** opens the selected task URL in the default browser

#### Scenario: Open task displays URL before opening
- **WHEN** the user runs `vk task open task-456`
- **THEN** the CLI prints the URL to stdout before opening the browser
