## ADDED Requirements

### Requirement: Optional task-attempt ID resolution order
For task-attempt commands that accept an optional `[id]`, the CLI SHALL resolve the target attempt in this order: explicit CLI argument, current branch workspace mapping, and then interactive selection.

#### Scenario: Explicit id is provided
- **WHEN** the user passes `[id]` to a task-attempt command
- **THEN** the CLI uses that ID directly and skips branch and interactive resolution

#### Scenario: Id is omitted on a matching workspace branch
- **WHEN** the user omits `[id]` and the current git branch maps to a single workspace
- **THEN** the CLI uses the mapped workspace ID automatically

### Requirement: Interactive fallback for omitted id
When `[id]` is omitted and branch mapping does not resolve a target, the CLI SHALL provide interactive selection flow to choose project, task, and workspace.

#### Scenario: No branch match and interactive mode is available
- **WHEN** `[id]` is omitted and no workspace is resolved from branch context
- **THEN** the CLI prompts for project, task, and workspace selection and uses the selected workspace ID

### Requirement: Clear failure when id cannot be resolved
If `[id]` is omitted and no target can be resolved automatically or interactively, the CLI MUST fail with a clear actionable error instructing the user to provide a workspace ID.

#### Scenario: Resolution fails without a selectable target
- **WHEN** `[id]` is omitted and branch plus interactive fallback cannot resolve a workspace
- **THEN** the CLI exits with an error that instructs the user to provide a workspace ID explicitly
