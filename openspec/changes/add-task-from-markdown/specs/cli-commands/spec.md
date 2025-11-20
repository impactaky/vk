# cli-commands Spec Delta

## MODIFIED Requirements

### Requirement: Task Create Command
The CLI MUST provide a command to create a new task.

#### Scenario: Create task with auto-detected project
Given the user is in a git repository matching project "abc-123"
When the user runs `vk task create --title "Fix bug"`
Then the CLI creates the task in the auto-detected project

#### Scenario: Create task from markdown file
Given the user is in a git repository matching project "abc-123"
And a file "task.md" exists with content:
```markdown
# Fix authentication bug

Users cannot log in when using SSO.
Check the OAuth callback handler.
```
When the user runs `vk task create --from task.md`
Then the CLI creates a task with title "Fix authentication bug"
And description "Users cannot log in when using SSO.\nCheck the OAuth callback handler."

#### Scenario: Create task from markdown without heading
Given a file "task.md" exists with content:
```markdown
This is just plain text without a heading.
```
When the user runs `vk task create --from task.md`
Then the CLI displays an error "Markdown file must contain a heading for the task title"

#### Scenario: Create task with conflicting options
When the user runs `vk task create --from task.md --title "Other title"`
Then the CLI displays an error "Cannot use --from with --title or --description"

#### Scenario: Create task from non-existent file
When the user runs `vk task create --from nonexistent.md`
Then the CLI displays an error indicating the file was not found
