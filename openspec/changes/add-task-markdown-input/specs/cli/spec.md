# CLI Specification - Task Markdown Input

## ADDED Requirements

### Requirement: Markdown Input for Task Creation

The CLI SHALL support creating tasks from markdown files via a `--markdown` option, extracting the title from the first markdown heading and using the remaining content as the description.

#### Scenario: Create task from markdown file

- **WHEN** user runs `vk task create <project-id> --markdown task.md` where task.md contains a markdown heading and content
- **THEN** extract title from first H1 heading and use remaining content as description

#### Scenario: Markdown with H1 heading extraction

- **WHEN** markdown file contains `# My Task Title` followed by other content
- **THEN** extract "My Task Title" as the task title (without the `#` prefix)

#### Scenario: Markdown with ATX-style heading

- **WHEN** markdown file starts with `# Heading`
- **THEN** parse as H1 heading and extract text after `#` and whitespace

#### Scenario: Markdown without heading

- **WHEN** markdown file has no H1 heading
- **THEN** display error message indicating that markdown input requires a title heading

#### Scenario: Title flag overrides markdown

- **WHEN** user provides both `--markdown task.md` and `--title "Custom Title"`
- **THEN** use the `--title` flag value and ignore markdown title parsing

#### Scenario: Description flag overrides markdown

- **WHEN** user provides both `--markdown task.md` and `--description "Custom desc"`
- **THEN** extract title from markdown but use explicit description from flag

#### Scenario: Both flags override markdown

- **WHEN** user provides `--markdown task.md`, `--title "Title"`, and `--description "Desc"`
- **THEN** use both explicit flag values and ignore markdown parsing

#### Scenario: Markdown file not found

- **WHEN** user provides `--markdown nonexistent.md`
- **THEN** display error message indicating file not found

## MODIFIED Requirements

### Requirement: Create task

The CLI SHALL support creating tasks via explicit flags or markdown input, with explicit flags taking precedence when both are provided.

#### Scenario: Create task with explicit flags

- **WHEN** user runs `vk task create <project-id> --title "Task title" --description "Description"`
- **THEN** create new task and display confirmation with task ID

#### Scenario: Create task from markdown file

- **WHEN** user runs `vk task create <project-id> --markdown task.md`
- **THEN** parse markdown to extract title and description, then create task

#### Scenario: Create task with mixed input

- **WHEN** user provides `--markdown task.md` and explicit `--title` flag
- **THEN** use explicit title from flag, extract description from markdown, and create task

#### Scenario: Missing required input

- **WHEN** user runs `vk task create <project-id>` without `--markdown` and without `--title` flag
- **THEN** display error message indicating title is required via `--title` flag or `--markdown` option
