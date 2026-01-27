# Change: Align vk CLI with vibekanban API v2 types

## Why

The vibekanban API has evolved and the vk CLI is out of sync with the latest API specification. This causes:
1. **Breaking**: Task list returns incorrect field names (`TaskWithAttemptStatus` vs `TaskWithWorkspaceStatus`)
2. **Breaking**: Merge/push/rebase operations fail because they require `repo_id` parameter
3. **Missing**: New API fields like `Repo.default_target_branch` and `CreateTask.image_ids` are not supported

## What Changes

### Breaking Changes (Must Fix)
- Rename `TaskWithWorkspaceStatus` to `TaskWithAttemptStatus` in `src/api/types.ts`
- Update field names:
  - `has_in_progress_workspace` → `has_in_progress_attempt`
  - `last_workspace_failed` → `last_attempt_failed`
  - Remove `has_merged_workspace` (not in API)
  - Add `executor: string` field
- Add `repo_id` parameter to merge, push, force-push, and rebase operations
- Update rebase to support `old_base_branch` and `new_base_branch` parameters

### New Fields (Additive)
- Add `default_target_branch: string | null` to `Repo` type
- Add `image_ids?: string[] | null` to `CreateTask` and `UpdateTask` types

## Impact

- Affected specs: cli-commands
- Affected code:
  - `src/api/types.ts` - Type definitions
  - `src/api/client.ts` - API client methods
  - `src/commands/attempt.ts` - Workspace commands (merge, push, rebase)
