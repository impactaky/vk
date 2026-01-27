# Tasks for align-api-v2-types

## 1. Update Type Definitions
- [ ] 1.1 Rename `TaskWithWorkspaceStatus` to `TaskWithAttemptStatus` in `src/api/types.ts`
- [ ] 1.2 Update field `has_in_progress_workspace` → `has_in_progress_attempt`
- [ ] 1.3 Update field `last_workspace_failed` → `last_attempt_failed`
- [ ] 1.4 Remove field `has_merged_workspace`
- [ ] 1.5 Add field `executor: string` to `TaskWithAttemptStatus`
- [ ] 1.6 Add `default_target_branch: string | null` to `Repo` interface
- [ ] 1.7 Add `image_ids?: string[] | null` to `CreateTask` interface
- [ ] 1.8 Add `image_ids?: string[] | null` to `UpdateTask` interface

## 2. Add Request Types for Git Operations
- [ ] 2.1 Add `MergeWorkspaceRequest` interface with `repo_id: string`
- [ ] 2.2 Add `PushWorkspaceRequest` interface with `repo_id: string`
- [ ] 2.3 Add `RebaseWorkspaceRequest` interface with `repo_id`, `old_base_branch?`, `new_base_branch?`

## 3. Update API Client Methods
- [ ] 3.1 Update `mergeWorkspace(id, repoId)` to accept repo_id and send in body
- [ ] 3.2 Update `pushWorkspace(id, repoId)` to accept repo_id and send in body
- [ ] 3.3 Update `forcePushWorkspace(id, repoId)` to accept repo_id and send in body
- [ ] 3.4 Update `rebaseWorkspace(id, request)` to accept full request body

## 4. Update Attempt Commands
- [ ] 4.1 Add `--repo` option to `merge` command with auto-detection for single-repo workspaces
- [ ] 4.2 Add `--repo` option to `push` command with auto-detection for single-repo workspaces
- [ ] 4.3 Add `--repo` option to `force-push` command with auto-detection for single-repo workspaces
- [ ] 4.4 Add `--repo`, `--old-base`, `--new-base` options to `rebase` command

## 5. Validation
- [ ] 5.1 Run `deno task lint` and fix any issues
- [ ] 5.2 Run `deno task test` and fix any failures
