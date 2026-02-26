## ADDED Requirements

### Requirement: Create command repository autodetection
`vk task-attempts create` SHALL accept optional `--repo <id-or-name>`. When
`--repo` is omitted, repository selection SHALL use existing repository
resolution behavior based on current working directory context.

#### Scenario: Create with explicit repository
- **WHEN** user runs `vk task-attempts create --repo <id-or-name> ...`
- **THEN** CLI resolves and uses the provided repository identifier
- **AND** existing explicit resolution behavior remains unchanged

#### Scenario: Create without --repo in a matching repository directory
- **WHEN** user runs `vk task-attempts create ...` without `--repo`
- **AND** current directory maps to exactly one registered repository via
  resolver rules
- **THEN** CLI auto-selects that repository and creates the task attempt

#### Scenario: Create without --repo when repository cannot be resolved
- **WHEN** user runs `vk task-attempts create ...` without `--repo`
- **AND** resolver cannot determine a repository from current directory or
  interactive fallback
- **THEN** CLI returns the resolver error and does not submit create request
