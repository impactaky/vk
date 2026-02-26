# VK CLI Spec

Last updated: 2026-02-23

This is the human-readable source of truth for current CLI behavior. Keep this
file simple and aligned with code.

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
  - default: prints core fields (`ID`, `Name`, `Display Name`, `Path`,
    `Created`, `Updated`)
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
- If `id` is missing, resolver uses this order:
  - explicit `id` argument (when present)
  - workspace match for current git branch
  - interactive workspace selection (fzf)
  - error: `Not in a workspace branch. Provide workspace ID.`
- Output:
  - `--json`: prints JSON object
  - default: prints key attempt fields (`ID`, `Task ID`, `Name`, `Branch`,
    `Agent Working Dir`, `Archived`, `Pinned`, `Created`, `Updated`)

### `vk task-attempts create`

- Creates and starts a new task attempt workspace.
- Required options:
  - Exactly one prompt source:
    - `--description <text>`
    - `--file <path>`
  - `--repo <id-or-name>`
- Prompt content must be non-empty text (empty/whitespace input is rejected).
- Optional options:
  - `--target-branch <name>` (defaults to `main`)
  - `--executor <name:variant>` (defaults to configured `defaultExecutor`,
    otherwise `CLAUDE_CODE:DEFAULT`)
- API request:
  - `POST /api/task-attempts/create-and-start`
  - body includes `prompt`, `repos`, and `executor_config`
- Output:
  - `--json`: prints `{ workspace, execution_process }`
  - default: prints `Task attempt <id> created and started.`

### `vk task-attempts spin-off [id]`

- Creates and starts a new task attempt from a parent task-attempt branch.
- If `id` is missing, uses the same resolver order as `show`.
- Required option:
  - Exactly one prompt source:
    - `--description <text>`
    - `--file <path>`
- Prompt content must be non-empty text (empty/whitespace input is rejected).
- API request:
  - `POST /api/task-attempts/create-and-start`
  - body includes:
    - `prompt` from `--description` or file content from `--file`
    - `repos` derived from parent task-attempt repos
    - `target_branch` set to parent task-attempt branch for each repo
    - `executor_config` from default executor resolution (same as `create`)
- Output:
  - `--json`: prints `{ workspace, execution_process }`
  - default: prints `Task attempt <new-id> spun off from <id>.`

### `vk task-attempts update [id]`

- Updates task-attempt fields.
- Supported options:
  - `--name <name>`
  - `--archived` / `--no-archived`
  - `--pinned` / `--no-pinned`
- If `id` is missing, uses the same resolver order as `show`.
- If no update options are provided:
  - prints `No updates specified.`
- Output:
  - `--json`: prints updated task-attempt JSON
  - default: prints `Task attempt <id> updated.`

### `vk task-attempts delete [id]`

- Deletes one task attempt.
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - default: prints `Task attempt <id> deleted.`
- Error behavior:
  - resolver/API errors are printed as `Error: <message>` and exit code is `1`

### `vk task-attempts repos [id]`

- Lists repositories attached to one task attempt.
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - `--json`: prints JSON array
  - default: table with `ID | Repo ID | Target Branch`
- If no results: prints `No repositories found for task attempt.`

### `vk task-attempts branch-status [id]`

- Lists branch status for repositories in one task attempt.
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - `--json`: prints JSON array
  - default: table with
    `Repository | Ahead | Behind | Uncommitted | Untracked | Conflict`
- If no results: prints `No branch status found.`

### `vk task-attempts rename-branch [id]`

- Command placement decision: keep `rename-branch` as a standalone
  `task-attempts` subcommand.
- Renames the workspace branch for one task attempt.
- Required option:
  - `--new-branch-name <name>`
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - `--json`: prints API response JSON
  - default: prints `Task attempt <id> branch renamed to <name>.`

### `vk task-attempts merge [id]`

- Merges task-attempt branch for a repository.
- Required option:
  - `--repo <id-or-name>`
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - default: prints `Task attempt <id> merged for repo <repo-id>.`

### `vk task-attempts push [id]`

- Pushes task-attempt branch for a repository.
- Required option:
  - `--repo <id-or-name>`
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - default: prints `Task attempt <id> pushed for repo <repo-id>.`

### `vk task-attempts rebase [id]`

- Rebases task-attempt branch for a repository.
- Required option:
  - `--repo <id-or-name>`
- Optional options:
  - `--old-base-branch <name>`
  - `--new-base-branch <name>`
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - default: prints `Task attempt <id> rebased for repo <repo-id>.`

### `vk task-attempts stop [id]`

- Stops an active task-attempt.
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - default: prints `Task attempt <id> stopped.`

### `vk task-attempts pr`

- Creates a pull request for a task-attempt repository.
- Optional option:
  - `--id <id>`
- Required option:
  - `--repo <id-or-name>`
- Optional options:
  - `--title <title>`
  - `--body <body>`
- If `--id` is missing, uses the same resolver order as `show`.
- Output:
  - `--json`: prints PR creation result JSON
  - default: prints `Pull request created: <url>`

### `vk task-attempts pr attach [id]`

- Attaches an existing PR to a task-attempt repository.
- Required options:
  - `--repo <id-or-name>`
  - `--pr-number <number>`
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - `--json`: prints attach result JSON
  - default: prints `Pull request attached: <url>`

### `vk task-attempts pr comments [id]`

- Lists PR comments for a task-attempt repository.
- Required option:
  - `--repo <id-or-name>`
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - `--json`: prints comments JSON payload
  - default: table with `ID | Type | User | Path | Line | Created`
- If no comments: prints `No PR comments found.`

## TDD Rule

For every behavior change:

1. Add or update one failing test first.
2. Implement the smallest code change to pass.
3. Keep this spec in sync with the new behavior.
