# Change: Update CLI to align with vibe-kanban API

## Why
The vk CLI was built against an earlier version of the vibe-kanban API. Recent API updates have introduced:
- New TaskStatus values (`todo`, `inprogress`, `inreview`, `done`, `cancelled` instead of `pending`, `in_progress`, `completed`, `cancelled`)
- New API endpoints for force push, conflict abort, follow-up, and PR attachment
- Updated executor profile naming (BaseCodingAgent enum with 9 agents)
- Additional attempt operations (run-agent-setup, gh-cli-setup, start-dev-server, run-setup-script, run-cleanup-script)

## What Changes

### Task Status Alignment
- **BREAKING**: Update TaskStatus enum from `pending | in_progress | completed | cancelled` to `todo | inprogress | inreview | done | cancelled`
- Update all CLI commands that accept/display status values

### New Attempt Operations
- Add `vk attempt follow-up` command for sending follow-up messages to running attempts
- Add `vk attempt force-push` command for force pushing branches
- Add `vk attempt abort-conflicts` command for aborting git conflicts
- Add `vk attempt attach-pr` command for attaching existing PRs
- Add `vk attempt pr-comments` command for viewing PR comments

### API Client Updates
- Add `forcePushAttempt()` method for `POST /api/task-attempts/{id}/push/force`
- Add `abortConflicts()` method for `POST /api/task-attempts/{id}/conflicts/abort`
- Add `followUp()` method for `POST /api/task-attempts/{id}/follow-up`
- Add `attachPR()` method for `POST /api/task-attempts/{id}/pr/attach`
- Add `getPRComments()` method for `GET /api/task-attempts/{id}/pr/comments`

### Type Definitions
- Update `TaskStatus` to match vibe-kanban API
- Add `BaseCodingAgent` enum with all 9 supported agents
- Update `ExecutorProfileId` to use `BaseCodingAgent` for executor field
- Add types for follow-up request/response
- Add types for PR comments

## Impact
- Affected specs: cli-commands
- Affected code: `src/api/types.ts`, `src/api/client.ts`, `src/commands/task.ts`, `src/commands/attempt.ts`
- **BREAKING**: Task status values change - users with scripts that filter by status will need updates
