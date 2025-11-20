# Tasks

## Implementation Tasks

- [x] **Add TaskAttempt types to src/api/types.ts**
   - Add `TaskAttempt` interface with fields: id, task_id, branch, target_branch, executor, container_ref, worktree_deleted, setup_completed_at, created_at, updated_at
   - Add `TaskAttemptStatus` type
   - Add `CreateAttempt` interface with task_id, executor_profile_id, base_branch

- [x] **Add attempt API methods to src/api/client.ts**
   - `listAttempts(taskId: string)`: GET /api/task-attempts?task_id={taskId}
   - `getAttempt(id: string)`: GET /api/task-attempts/{id}
   - `createAttempt(attempt: CreateAttempt)`: POST /api/task-attempts

- [x] **Create src/commands/attempt.ts**
   - Implement `attempt list` command with --task and --json options
   - Implement `attempt show` command with --json option
   - Implement `attempt create` command with --task, --executor, and --base-branch options
   - Add table formatting for list output

- [x] **Register attempt command in src/main.ts**
   - Import attemptCommand from commands/attempt.ts
   - Add to main CLI command group

- [ ] **Add tests for attempt commands**
   - Test list, show, create commands
   - Test error handling for missing options

- [x] **Run deno fmt, lint, and check**
   - Ensure code passes all quality checks

## Validation
- Run `deno task test` to verify tests pass
- Manual testing with vibe-kanban API
