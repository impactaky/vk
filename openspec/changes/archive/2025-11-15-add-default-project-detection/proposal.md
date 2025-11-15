# Change: Add Default Project Detection via Git Remote

## Why

Currently, task commands require an explicit `--project-id` parameter, which creates friction for developers working within a git repository. Users must manually look up and specify the project ID even when working in a repository that clearly corresponds to a vibe-kanban project. This reduces the CLI's usability and doesn't follow the principle of least surprise.

## What Changes

- Add automatic project ID detection by matching the git remote URL basename against registered project names
- Make `--project-id` optional for task commands when detection succeeds
- Provide clear error messages when auto-detection fails or when the directory is not a git repository
- Allow explicit `--project-id` to override auto-detection

## Impact

- Affected specs: `task-management`
- Affected code:
  - `src/commands/task.ts` - Task command handlers need project detection logic
  - `src/utils/git.ts` (new) - Git remote URL parsing and project matching
  - `main.ts` - CLI argument handling for task commands
- **Breaking**: No breaking changes; this is a backward-compatible enhancement
