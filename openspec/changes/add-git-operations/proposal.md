# Change: Add Git Operations to vk CLI

## Why
Users need to manage git operations for task attempts directly from the CLI, including merging branches, pushing to remote, creating PRs, rebasing, and managing branch configurations. These operations are essential for the task attempt workflow in vibe-kanban.

## What Changes
- Add git operation commands for task attempts
- Implement merge command to merge task attempt branch
- Implement push command to push branch to remote
- Implement create-pr command to create GitHub PR
- Implement rebase command to rebase task attempt
- Implement change-target command to change target branch
- Implement rename-branch command to rename task attempt branch
- Implement branch-status command to check branch status
- Add types for git operation requests and responses

## Impact
- Affected specs: CLI git operations (new capability)
- Affected code: New git command module, updated main.ts, new API types
- New dependencies: None (uses existing Deno standard library)
