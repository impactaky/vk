## ADDED Requirements

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
