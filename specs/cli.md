# VK CLI Spec

Last updated: 2026-02-23

This is the human-readable source of truth for current CLI behavior. Keep this
file simple and aligned with code.

## Scope

Current top-level commands:

- `organization`
- `repository`
- `workspace`
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

- Fetches all organizations from latest API.
- API:
  - `GET /v1/organizations`
- Supports optional filter:
  - `--name <name>`
- Output:
  - `--json`: prints JSON array
  - default: table with `ID | Name | Slug | Role | Created | Updated`
- If no results: prints `No organizations found.`

### `vk organization show [id]`

- Shows one organization.
- If `id` is missing, resolver selects organization.
- API:
  - `GET /v1/organizations/:id`
- Output:
  - `--json`: prints JSON object
  - default: prints `ID`, `Name`, `Created`, `Updated`
  - prints `Slug` and `Issue` when present

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
  - `--archive-script <script>`
  - `--copy-files <files>`
  - `--parallel-setup` / `--no-parallel-setup`
  - `--dev-server-script <script>`
  - `--default-target-branch <name>`
  - `--default-working-dir <path>`
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

## Workspace Command

### `vk workspace list`

- Fetches workspaces from API.
- Supports optional filter:
  - `--task-id <id>`
- Output:
  - `--json`: prints JSON array
  - default: table with `ID | Task ID | Name | Branch | Archived | Pinned`
- If no results: prints `No workspaces found.`

### `vk workspace show [id]`

- Shows one workspace.
- If `id` is missing, resolver uses this order:
  - explicit `id` argument (when present)
  - workspace match for current git branch
  - interactive workspace selection (fzf)
  - error: `Not in a workspace branch. Provide workspace ID.`
- Output:
  - `--json`: prints JSON object
  - default: prints key attempt fields (`ID`, `Task ID`, `Name`, `Branch`,
    `Agent Working Dir`, `Archived`, `Pinned`, `Created`, `Updated`)

### `vk workspace create`

- Creates and starts a new workspace.
- Required options:
  - Exactly one prompt source:
    - `--description <text>`
    - `--file <path>`
- Repository selection:
  - `--repo <id-or-name>` (optional)
  - if omitted, repository is auto-resolved from current directory context
    using existing repository resolver behavior
- Prompt content must be non-empty text (empty/whitespace input is rejected).
- Optional options:
  - `--target-branch <name>` (defaults to `main`)
  - `--executor <name:variant>` (defaults to configured `defaultExecutor`,
    otherwise `CLAUDE_CODE:DEFAULT`)
- API request:
  - `POST /api/workspaces/start`
  - body includes `prompt`, `repos`, and `executor_config`
- Output:
  - `--json`: prints `{ workspace, execution_process }`
  - default: prints `Workspace <id> created and started.`

### `vk workspace spin-off [id]`

- Creates and starts a new workspace from a parent workspace branch.
- If `id` is missing, uses the same resolver order as `show`.
- Required option:
  - Exactly one prompt source:
    - `--description <text>`
    - `--file <path>`
- Prompt content must be non-empty text (empty/whitespace input is rejected).
- API request:
  - `POST /api/workspaces/start`
  - body includes:
    - `prompt` from `--description` or file content from `--file`
    - `repos` derived from parent workspace repos
    - `target_branch` set to parent workspace branch for each repo
    - `executor_config` from default executor resolution (same as `create`)
- Output:
  - `--json`: prints `{ workspace, execution_process }`
  - default: prints `Workspace <new-id> spun off from <id>.`

### `vk workspace update [id]`

- Updates workspace fields.
- Supported options:
  - `--name <name>`
  - `--archived` / `--no-archived`
  - `--pinned` / `--no-pinned`
- If `id` is missing, uses the same resolver order as `show`.
- If no update options are provided:
  - prints `No updates specified.`
- Output:
  - `--json`: prints updated workspace JSON
  - default: prints `Workspace <id> updated.`

### `vk workspace delete [id]`

- Deletes one workspace.
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - default: prints `Workspace <id> deleted.`
- Error behavior:
  - resolver/API errors are printed as `Error: <message>` and exit code is `1`

### `vk workspace repos [id]`

- Lists repositories attached to one workspace.
- If `id` is missing, uses the same resolver order as `show`.
- Output:
  - `--json`: prints JSON array
  - default: table with `ID | Repo ID | Target Branch`
- If no results: prints `No repositories found for workspace.`

### `vk workspace branch-status [id]`

- Lists branch status for repositories in one workspace.
- If `id` is missing, uses the same resolver order as `show`.
- API:
  - `GET /api/workspaces/:id/git/status`
- Output:
  - `--json`: prints JSON array
  - default: table with
    `Repository | Ahead | Behind | Uncommitted | Untracked | Conflict`
- If no results: prints `No branch status found.`

### `vk workspace rename-branch [id]`

- Command placement decision: keep `rename-branch` as a standalone
  `workspace` subcommand.
- Renames the workspace branch for one workspace.
- Required option:
  - `--new-branch-name <name>`
- If `id` is missing, uses the same resolver order as `show`.
- API:
  - `PUT /api/workspaces/:id/git/branch`
- Output:
  - `--json`: prints API response JSON
  - default: prints `Workspace <id> branch renamed to <name>.`

### `vk workspace merge [id]`

- Merges workspace branch for a repository.
- Required option:
  - `--repo <id-or-name>`
- If `id` is missing, uses the same resolver order as `show`.
- API:
  - `POST /api/workspaces/:id/git/merge`
- Output:
  - default: prints `Workspace <id> merged for repo <repo-id>.`

### `vk workspace push [id]`

- Pushes workspace branch for a repository.
- Required option:
  - `--repo <id-or-name>`
- If `id` is missing, uses the same resolver order as `show`.
- API:
  - `POST /api/workspaces/:id/git/push`
- Output:
  - default: prints `Workspace <id> pushed for repo <repo-id>.`

### `vk workspace rebase [id]`

- Rebases workspace branch for a repository.
- Required option:
  - `--repo <id-or-name>`
- Optional options:
  - `--old-base-branch <name>`
  - `--new-base-branch <name>`
- If `id` is missing, uses the same resolver order as `show`.
- API:
  - `POST /api/workspaces/:id/git/rebase`
- Output:
  - default: prints `Workspace <id> rebased for repo <repo-id>.`

### `vk workspace stop [id]`

- Stops an active workspace.
- If `id` is missing, uses the same resolver order as `show`.
- API:
  - `POST /api/workspaces/:id/execution/stop`
- Output:
  - default: prints `Workspace <id> stopped.`

### `vk workspace pr`

- Creates a pull request for a workspace repository.
- Optional option:
  - `--id <id>`
- Required option:
  - `--repo <id-or-name>`
- Optional options:
  - `--title <title>`
  - `--body <body>`
- If `--id` is missing, uses the same resolver order as `show`.
- API:
  - `POST /api/workspaces/:id/pull-requests`
- Output:
  - `--json`: prints PR creation result JSON
  - default: prints `Pull request created: <url>`

### `vk workspace pr attach [id]`

- Attaches an existing PR to a workspace repository.
- Required options:
  - `--repo <id-or-name>`
  - `--pr-number <number>`
- If `id` is missing, uses the same resolver order as `show`.
- API:
  - `POST /api/workspaces/:id/pull-requests/attach`
- Output:
  - `--json`: prints attach result JSON
  - default: prints `Pull request attached: <url>`

### `vk workspace pr comments [id]`

- Lists PR comments for a workspace repository.
- Required option:
  - `--repo <id-or-name>`
- If `id` is missing, uses the same resolver order as `show`.
- API:
  - `GET /api/workspaces/:id/pull-requests/comments?repo_id=<repo-id>`
- Output:
  - `--json`: prints comments JSON payload
  - default: table with `ID | Type | User | Path | Line | Created`
- If no comments: prints `No PR comments found.`

## TDD Rule

For every behavior change:

1. Add or update one failing test first.
2. Implement the smallest code change to pass.
3. Keep this spec in sync with the new behavior.
