# cli-commands Spec Delta

## MODIFIED Requirements

### Requirement: Task Create Command
The CLI MUST provide a command to create a new task with optional immediate execution.

#### Scenario: Create task with immediate run
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug" --run --executor CLAUDE_CODE:DEFAULT`
Then the CLI creates the task in the auto-detected project
And the CLI creates an attempt with the specified executor
And the CLI displays the task ID and attempt ID with branch name

#### Scenario: Create task with run and base branch
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug" --run --executor CLAUDE_CODE:DEFAULT --base-branch develop`
Then the CLI creates the task in the auto-detected project
And the CLI creates an attempt with base branch "develop"

#### Scenario: Create task with run and target branch
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug" --run --executor CLAUDE_CODE:DEFAULT --target-branch feature/fix`
Then the CLI creates the task in the auto-detected project
And the CLI creates an attempt with target branch "feature/fix"

#### Scenario: Create task with run missing executor
When the user runs `vk task create --title "Fix bug" --run`
Then the CLI displays an error "Error: --run requires --executor to be specified"

#### Scenario: Create task with from file and immediate run
Given a file "task.md" exists with content:
```markdown
# Fix authentication bug

Users cannot log in when using SSO.
```
When the user runs `vk task create --from task.md --run --executor CLAUDE_CODE:DEFAULT`
Then the CLI creates a task with title "Fix authentication bug"
And the CLI creates an attempt with the specified executor
