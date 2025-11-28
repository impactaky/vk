# Change: Auto-detect Task ID from Branch Name

## Why
When working on tasks in vibe-kanban, developers follow a branch naming convention that includes the task ID (e.g., `impactaky/99d7-try-to-set-task`). Currently, when running commands that require a task ID (like `vk task show`, `vk task update`, `vk attempt list`), users must manually specify the task ID even though it's encoded in their current branch name. This creates unnecessary friction and redundant data entry.

## What Changes
- Add utility function to extract task ID from git branch names following the pattern `<prefix>/<task-id>-<description>`
- Update task commands (`show`, `update`, `delete`) to auto-detect task ID from branch when not explicitly provided
- Update attempt commands that require task ID (`list`, `create`) to auto-detect task ID from branch when --task flag is omitted
- Maintain backwards compatibility: explicit task IDs or --task flags always take precedence over auto-detection
- Provide clear error messages when branch-based auto-detection fails

## Impact
- Affected specs: `cli-commands`
- Affected code:
  - `src/utils/git.ts` - Add task ID extraction function
  - `src/commands/task.ts` - Integrate auto-detection into task commands
  - `src/commands/attempt.ts` - Integrate auto-detection into attempt commands that need task ID
- User experience: Commands become more convenient when working within task branches, while explicit IDs remain supported for flexibility
