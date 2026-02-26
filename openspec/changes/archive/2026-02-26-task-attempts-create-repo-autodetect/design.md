## Overview

This change removes command-level `--repo` enforcement in
`task-attempts create` and delegates repository selection entirely to existing
`getRepositoryId()` behavior, which already handles explicit ID/name and
auto-detection from path context.

## Design Decisions

- Keep `--repo` option available but optional in command contract.
- Remove manual `Option --repo is required.` guard in create action.
- Continue calling `getRepositoryId(options.repo, client)` so:
  - explicit `--repo` path is unchanged,
  - omitted `--repo` triggers path/fzf resolver behavior,
  - resolver errors flow through existing CLI error handling.

## Error Handling

- Prompt validation remains unchanged (`--description`/`--file`).
- Repository resolution errors remain sourced from repository resolver.
- No new custom error strings are introduced for repo resolution.

## Testing Strategy

- Keep existing create tests for explicit `--repo` by id and name.
- Add integration test for `create` without `--repo` in a mapped repository
  directory.
- Ensure mock API receives the expected resolved `repo_id`.
