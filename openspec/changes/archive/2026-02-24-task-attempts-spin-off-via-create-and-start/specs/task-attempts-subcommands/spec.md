## ADDED Requirements

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
