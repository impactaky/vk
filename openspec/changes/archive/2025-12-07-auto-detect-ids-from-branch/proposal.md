# Change: Auto-detect task and attempt IDs from branch name

## Why
Currently, commands that require task or attempt IDs force users to either specify them explicitly via arguments or go through interactive selection with fzf. However, when working in an attempt's branch, the branch name contains identifying information (the 4-character hash prefix) that could be used to automatically detect which task/attempt the user is working on. This creates unnecessary friction when users are already in the context of a specific attempt.

## What Changes
- Add utility function to get current git branch name
- Add utility function to parse branch names and extract task/attempt identifiers from the branch name pattern `{username}/{hash}-{description}`
- Add attempt lookup capability that searches by branch name (via API)
- Modify all commands that accept optional task ID or attempt ID arguments to automatically detect IDs from the current branch when:
  - The ID argument is omitted
  - The user is in a git repository
  - The current branch matches the branch naming pattern
  - An attempt exists with a matching branch name
- When attempt ID is auto-detected, automatically set the parent task ID from the attempt's task_id field for commands that need task context

## Impact
- Affected specs: cli-commands
- Affected code:
  - `src/utils/git.ts` - Add getCurrentBranch() and parseBranchName() functions
  - `src/utils/attempt-resolver.ts` - New file for attempt auto-detection logic
  - `src/api/client.ts` - Add method to search attempts by branch name
  - `src/commands/task.ts` - Update commands to use auto-detection when ID omitted
  - `src/commands/attempt.ts` - Update commands to use auto-detection when ID omitted
