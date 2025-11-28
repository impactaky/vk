## MODIFIED Requirements

### Requirement: Attempt Create Command
The CLI MUST provide a command to create a new attempt for a task. The CLI SHALL accept executor specification by either profile ID or profile name, and automatically resolve names to IDs before making API calls.

#### Scenario: Create attempt with required options
Given a task with id "task-456" exists
And an executor profile with name "Claude Code" and id "exec-123" exists
When the user runs `vk attempt create --task task-456 --executor "Claude Code"`
Then the CLI resolves "Claude Code" to executor profile ID "exec-123"
And creates the attempt with the resolved profile ID
And displays the new attempt details

#### Scenario: Create attempt with executor profile ID
Given a task with id "task-456" exists
And an executor profile with id "exec-123" exists
When the user runs `vk attempt create --task task-456 --executor exec-123`
Then the CLI creates the attempt with the provided profile ID
And displays the new attempt details

#### Scenario: Create attempt with base branch
Given a task with id "task-456" exists
And an executor profile with name "Claude Code" exists
When the user runs `vk attempt create --task task-456 --executor "Claude Code" --base-branch develop`
Then the CLI creates the attempt with the specified base branch

#### Scenario: Create attempt with target branch
Given a task with id "task-456" exists
And an executor profile with name "Claude Code" exists
When the user runs `vk attempt create --task task-456 --executor "Claude Code" --target-branch feature/new`
Then the CLI creates the attempt with the specified target branch

#### Scenario: Create attempt with non-existent executor name
Given a task with id "task-456" exists
And no executor profile with name "NonExistent" exists
When the user runs `vk attempt create --task task-456 --executor NonExistent`
Then the CLI displays an error "Executor profile 'NonExistent' not found"

#### Scenario: Create attempt with ambiguous executor name
Given a task with id "task-456" exists
And multiple executor profiles have names matching "Claude"
When the user runs `vk attempt create --task task-456 --executor Claude`
Then the CLI displays an error listing the matching profiles and suggesting to use the full name or profile ID

#### Scenario: Create attempt missing required options
When the user runs `vk attempt create` without --task or --executor
Then the CLI displays an error indicating required options are missing

## ADDED Requirements

### Requirement: Executor Profile Listing
The CLI MUST provide a command to list available executor profiles.

#### Scenario: List executor profiles
Given executor profiles exist in the system
When the user runs `vk executor list`
Then the CLI displays a table of executor profiles with id, name, and type

#### Scenario: List executor profiles with JSON output
Given executor profiles exist in the system
When the user runs `vk executor list --json`
Then the CLI outputs the executor profiles as JSON array

#### Scenario: No executor profiles found
Given no executor profiles exist in the system
When the user runs `vk executor list`
Then the CLI displays "No executor profiles found."
