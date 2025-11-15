# CLI Specification - Task Markdown Input

## ADDED Requirements

### Requirement: Markdown Input for Task Creation

The CLI SHALL support creating tasks from markdown input, extracting the title from the first markdown heading and using the remaining content as the description.

#### Scenario: Create task from markdown stdin

- **WHEN** user runs `echo -e "# Task Title\n\nTask description here" | vk task create <project-id>`
- **THEN** create task with title "Task Title" and description "Task description here"

#### Scenario: Create task from markdown file

- **WHEN** user runs `vk task create <project-id> < task.md` where task.md contains a markdown heading and content
- **THEN** extract title from first H1 heading and use remaining content as description

#### Scenario: Markdown with H1 heading extraction

- **WHEN** markdown input contains `# My Task Title` followed by other content
- **THEN** extract "My Task Title" as the task title (without the `#` prefix)

#### Scenario: Markdown with ATX-style heading

- **WHEN** markdown input starts with `# Heading`
- **THEN** parse as H1 heading and extract text after `#` and whitespace

#### Scenario: Markdown without heading

- **WHEN** markdown input has no H1 heading
- **THEN** display error message indicating that markdown input requires a title heading

#### Scenario: Explicit flags override markdown

- **WHEN** user provides both markdown input and `--title` flag
- **THEN** use the `--title` flag value and ignore markdown title parsing

#### Scenario: Partial flag override

- **WHEN** user provides markdown input with `--title` flag but no `--description` flag
- **THEN** use explicit title from flag and extract description from markdown content

## MODIFIED Requirements

### Requirement: Create task

The CLI SHALL support creating tasks via explicit flags or markdown input, with flags taking precedence when both are provided.

#### Scenario: Create task with explicit flags

- **WHEN** user runs `vk task create <project-id> --title "Task title" --description "Description"`
- **THEN** create new task and display confirmation with task ID

#### Scenario: Create task from markdown stdin

- **WHEN** user pipes markdown content to `vk task create <project-id>` without explicit title flag
- **THEN** parse markdown to extract title and description, then create task

#### Scenario: Create task with mixed input

- **WHEN** user provides markdown stdin and explicit `--title` flag
- **THEN** use explicit title from flag, extract description from markdown, and create task

#### Scenario: Missing required input

- **WHEN** user runs `vk task create <project-id>` without stdin and without `--title` flag
- **THEN** display error message indicating title is required via flag or markdown input
