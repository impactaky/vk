## MODIFIED Requirements

### Requirement: Attempt Create Command
The CLI MUST provide a command to create a new attempt for a task with executor profile ID in `<name>:<variant>` format.

#### Scenario: Create attempt with executor name and variant
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE:DEFAULT`
Then the CLI parses "CLAUDE_CODE:DEFAULT" into name "CLAUDE_CODE" and variant "DEFAULT"
And sends executor_profile_id as `{executor: "CLAUDE_CODE", variant: "DEFAULT"}` to the API
And displays the new attempt details

#### Scenario: Create attempt with different variant
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE:AGGRESSIVE`
Then the CLI creates the attempt with executor "CLAUDE_CODE" and variant "AGGRESSIVE"

#### Scenario: Create attempt with base branch and executor variant
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE:DEFAULT --base-branch develop`
Then the CLI creates the attempt with the specified base branch and executor variant

#### Scenario: Create attempt with target branch and executor variant
Given a task with id "task-456" exists
When the user runs `vk attempt create --task task-456 --executor CLAUDE_CODE:DEFAULT --target-branch feature/new`
Then the CLI creates the attempt with the specified target branch and executor variant

#### Scenario: Create attempt with invalid executor format
When the user runs `vk attempt create --task task-456 --executor INVALID_FORMAT`
Then the CLI displays an error indicating the executor must be in "<name>:<variant>" format

#### Scenario: Create attempt missing required options
When the user runs `vk attempt create` without --task or --executor
Then the CLI displays an error indicating required options are missing

---

## MODIFIED Requirements

### Requirement: Attempt List Command
The CLI MUST filter attempts by full executor profile ID in `<name>:<variant>` format.

#### Scenario: Filter attempts by executor with variant
Given a task has attempts with executors "CLAUDE_CODE:DEFAULT" and "CLAUDE_CODE:AGGRESSIVE"
When the user runs `vk attempt list --task task-456 --executor CLAUDE_CODE:DEFAULT`
Then the CLI displays only attempts with executor "CLAUDE_CODE" and variant "DEFAULT"

#### Scenario: Filter attempts with full match
Given a task has attempts with executors "CLAUDE_CODE:DEFAULT" and "OTHER_EXECUTOR:DEFAULT"
When the user runs `vk attempt list --task task-456 --executor CLAUDE_CODE:DEFAULT`
Then the CLI displays only attempts matching the full "CLAUDE_CODE:DEFAULT" string
And does not display attempts with "OTHER_EXECUTOR:DEFAULT"
