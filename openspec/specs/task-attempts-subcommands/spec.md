## Purpose

Define the expected `vk task-attempts` command surface and output behavior.
## Requirements
### Requirement: Task-attempt command surface coverage
The CLI SHALL expose `vk task-attempts` subcommands for the supported task-attempt API operations beyond `list` and `show`, including create, spin-off, update, delete, repos, branch-status, rename-branch, merge, push, rebase, stop, and PR-related operations.

#### Scenario: User invokes an implemented task-attempt operation
- **WHEN** a user runs an implemented `vk task-attempts` subcommand
- **THEN** the CLI executes the corresponding API operation for that subcommand

### Requirement: PR operations are grouped under a nested subcommand
The CLI SHALL group pull request operations under `vk task-attempts pr`, including nested operations for attaching an existing PR and listing PR comments.

#### Scenario: User discovers PR operations
- **WHEN** a user inspects or uses task-attempt PR functionality
- **THEN** PR operations are available under the `task-attempts pr` command group instead of flat top-level variants

### Requirement: Consistent success and JSON output behavior
Each task-attempt subcommand SHALL support existing CLI output conventions: human-readable success output by default and structured output when `--json` is used where a response payload exists.

#### Scenario: User requests machine-readable output
- **WHEN** a user runs a task-attempt subcommand with `--json`
- **THEN** the CLI prints the operation result as JSON using the command's response payload shape

#### Scenario: User uses default output mode
- **WHEN** a user runs a task-attempt subcommand without `--json`
- **THEN** the CLI prints concise human-readable status consistent with other VK commands

### Requirement: Task-attempt spin-off uses create-and-start workflow

`vk task-attempts spin-off [id] --description <text>` SHALL create a new
task-attempt via `POST /api/task-attempts/create-and-start` using repositories
from the parent attempt.

#### Scenario: Spin-off from parent attempt

- **WHEN** user runs `vk task-attempts spin-off [id] --description <text>`
- **THEN** CLI resolves parent attempt id (explicit or auto-detect)
- **AND** fetches parent attempt and parent attempt repos
- **AND** calls `POST /api/task-attempts/create-and-start`
- **AND** sets each repo input `target_branch` to the parent attempt branch
- **AND** prints JSON output when `--json` is used, otherwise a concise success
  message

### Requirement: Spin-off validates required description

`vk task-attempts spin-off` SHALL fail with a clear error when `--description`
is omitted.

#### Scenario: Missing description

- **WHEN** user runs `vk task-attempts spin-off [id]` without `--description`
- **THEN** CLI exits with error message indicating `--description` is required

### Requirement: Create task-attempt prompt input
`vk task-attempts create` MUST accept exactly one prompt source:
`--description <text>` or `--file <path>`.

#### Scenario: Create with description
- **WHEN** user runs `vk task-attempts create --description "text" --repo <repo>`
- **THEN** CLI sends `prompt` as the provided description text.

#### Scenario: Create with file
- **WHEN** user runs `vk task-attempts create --file prompt.md --repo <repo>`
- **THEN** CLI reads `prompt.md` content and sends it as `prompt`.

#### Scenario: Missing prompt source
- **WHEN** user runs create without both `--description` and `--file`
- **THEN** CLI errors that one prompt source is required.

#### Scenario: Conflicting prompt sources
- **WHEN** user passes both `--description` and `--file`
- **THEN** CLI errors that the options are mutually exclusive.

### Requirement: Spin-off prompt input
`vk task-attempts spin-off [id]` MUST accept exactly one prompt source:
`--description <text>` or `--file <path>`.

#### Scenario: Spin-off with file
- **WHEN** user runs `vk task-attempts spin-off [id] --file prompt.md`
- **THEN** CLI reads file content and sends it as create-and-start `prompt`.

### Requirement: Task-attempt prompt source validation
For `vk task-attempts create` and `vk task-attempts spin-off [id]`, resolved prompt content MUST be non-empty text.

#### Scenario: Empty file prompt is rejected
- **WHEN** user passes `--file` pointing to an empty (or whitespace-only) file
- **THEN** CLI returns a clear validation error before API submission.

