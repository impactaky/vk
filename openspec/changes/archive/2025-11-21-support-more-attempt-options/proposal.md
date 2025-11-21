# Change: Support More Attempt Options and Commands

## Why
The current `vk attempt` subcommand only supports list, show, and create operations. The vibe-kanban API provides many more attempt operations that would be valuable to expose via CLI, including delete, update, merge, push, rebase, stop, and PR creation.

## What Changes
- Add `attempt delete` command to delete attempts
- Add `attempt update` command to update attempt fields (target-branch, branch name)
- Add `attempt merge` command to merge attempt branch
- Add `attempt push` command to push attempt branch to remote
- Add `attempt rebase` command to rebase attempt branch
- Add `attempt stop` command to stop execution
- Add `attempt pr` command to create GitHub PR
- Add `attempt branch-status` command to check branch status
- Extend `attempt create` with `--target-branch` option

## Impact
- Affected specs: cli-commands
- Affected code: src/commands/attempt.ts, src/api/client.ts, src/api/types.ts
