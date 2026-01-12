## 1. Update Type Definitions
- [x] 1.1 Update `TaskStatus` type from `pending | in_progress | completed | cancelled` to `todo | inprogress | inreview | done | cancelled`
- [x] 1.2 Add `BaseCodingAgent` enum with all 9 agents: `CLAUDE_CODE`, `AMP`, `GEMINI`, `CODEX`, `OPENCODE`, `CURSOR_AGENT`, `QWEN_CODE`, `COPILOT`, `DROID`
- [x] 1.3 Update `ExecutorProfileId` to use `BaseCodingAgent` type for executor field
- [x] 1.4 Add `FollowUpRequest` type with `message: string` field
- [x] 1.5 Add `PRComment` and `UnifiedPRComment` types for PR comment responses
- [x] 1.6 Add `AttachPRRequest` type with `pr_number: number` field

## 2. Update API Client
- [x] 2.1 Add `forcePushAttempt(id: string)` method calling `POST /api/task-attempts/{id}/push/force`
- [x] 2.2 Add `abortConflicts(id: string)` method calling `POST /api/task-attempts/{id}/conflicts/abort`
- [x] 2.3 Add `followUp(id: string, request: FollowUpRequest)` method calling `POST /api/task-attempts/{id}/follow-up`
- [x] 2.4 Add `attachPR(id: string, request: AttachPRRequest)` method calling `POST /api/task-attempts/{id}/pr/attach`
- [x] 2.5 Add `getPRComments(id: string)` method calling `GET /api/task-attempts/{id}/pr/comments`

## 3. Update Task Commands
- [x] 3.1 Update status filter options in `task list` to use new status values
- [x] 3.2 Update status option in `task create` to use new status values
- [x] 3.3 Update status option in `task update` to use new status values
- [x] 3.4 Update task status display formatting for new values

## 4. Add New Attempt Commands
- [x] 4.1 Add `vk attempt follow-up <id> --message <message>` command
- [x] 4.2 Add `vk attempt force-push <id>` command
- [x] 4.3 Add `vk attempt abort-conflicts <id>` command
- [x] 4.4 Add `vk attempt attach-pr <id> --pr-number <number>` command
- [x] 4.5 Add `vk attempt pr-comments <id>` command with `--json` output option

## 5. Update Executor Validation
- [x] 5.1 Update `parseExecutorString()` to validate against `BaseCodingAgent` enum
- [x] 5.2 Add helpful error message listing valid executor names when validation fails

## 6. Testing & Validation
- [x] 6.1 Test all task status transitions with new values
- [x] 6.2 Test new attempt commands against running vibe-kanban instance
- [x] 6.3 Test executor validation with all 9 agent names
- [x] 6.4 Verify CLI help text shows updated status values
