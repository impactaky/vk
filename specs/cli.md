# VK CLI Spec

Last updated: 2026-02-23

This is the human-readable source of truth for current CLI behavior.
Keep this file simple and aligned with code.

## Scope

Current top-level commands:
- `organization`
- `repository`
- `task-attempts`
- `config`
- `completions`

## Global Behavior

- CLI name is `vk`.
- `vk --ai` prints JSON help and exits with code `0`.
- `vk -v` or `vk --verbose` enables API request/response logs.
- On handled errors, CLI prints `Error: <message>` and exits with code `1`.

## Config Command

### `vk config show`
- Prints:
  - `API URL: <value>`
  - `Shell: <value or (default: bash)>`
  - `Default executor: <value or (not set)>`

### `vk config set <key> <value>`
- Allowed keys:
  - `api-url`
  - `shell`
  - `default-executor`
- Updates config and prints:
  - `Configuration updated: <key> = <value>`
- If key is unknown:
  - Prints `Unknown configuration key: <key>`
  - Prints `Available keys: api-url, shell, default-executor`
  - Exits with code `1`

## Organization Command

### `vk organization list`
- Fetches all organizations from API.
- Supports optional filter:
  - `--name <name>`
- Output:
  - `--json`: prints JSON array
  - default: table with `ID | Name | Created | Updated`
- If no results: prints `No organizations found.`

### `vk organization show [id]`
- Shows one organization.
- If `id` is missing, resolver selects organization.
- Output:
  - `--json`: prints JSON object
  - default: prints `ID`, `Name`, `Created`, `Updated`

## Repository Command

### `vk repository list`
- Fetches all repositories from API.
- Supports optional filters:
  - `--name <name>`
  - `--path <path>`
- Output:
  - `--json`: prints JSON array
  - default: table with `ID | Name | Display Name | Path`
- If no results: prints `No repositories found.`

### `vk repository show [id]`
- Shows one repository.
- If `id` is missing, resolver selects repository.
- Output:
  - `--json`: prints JSON object
  - default: prints core fields (`ID`, `Name`, `Display Name`, `Path`, `Created`, `Updated`)
  - optional fields are printed only when present

### `vk repository register`
- Registers an existing git repository.
- Inputs:
  - `--path <path>` (prompted if missing)
  - `--display-name <name>` (optional, prompted if flag is not provided)
- Success output:
  - `Repository registered successfully!`
  - `ID: <id>`
  - `Name: <name>`

### `vk repository init`
- Creates a new git repository.
- Inputs:
  - `--parent-path <path>` (prompted if missing)
  - `--folder-name <name>` (prompted if missing)
- Success output:
  - `Repository initialized successfully!`
  - `ID: <id>`
  - `Path: <path>`

### `vk repository update [id]`
- Updates repository properties.
- Supported options:
  - `--display-name <name>`
  - `--setup-script <script>`
  - `--cleanup-script <script>`
  - `--copy-files <files>`
  - `--parallel-setup` / `--no-parallel-setup`
  - `--dev-server-script <script>`
- If no update option is provided:
  - prints `No updates specified.`
- On success:
  - prints `Repository <id> updated.`

### `vk repository branches [id]`
- Lists branches for one repository.
- Supports:
  - `--remote` (remote only)
  - `--local` (local only)
- Output:
  - `--json`: prints JSON array
  - default: table with `Name | Current | Remote`
- If no results: prints `No branches found.`

## Task-Attempts Command

### `vk task-attempts list`
- Fetches task attempts from API.
- Supports optional filter:
  - `--task-id <id>`
- Output:
  - `--json`: prints JSON array
  - default: table with `ID | Task ID | Name | Branch | Archived | Pinned`
- If no results: prints `No task attempts found.`

### `vk task-attempts show [id]`
- Shows one task attempt.
- If `id` is missing, resolver auto-detects/selects attempt.
- Supports optional project hint:
  - `--project <id>`
- Output:
  - `--json`: prints JSON object
  - default: prints key attempt fields (`ID`, `Task ID`, `Name`, `Branch`, `Agent Working Dir`, `Archived`, `Pinned`, `Created`, `Updated`)

## TDD Rule

For every behavior change:
1. Add or update one failing test first.
2. Implement the smallest code change to pass.
3. Keep this spec in sync with the new behavior.
