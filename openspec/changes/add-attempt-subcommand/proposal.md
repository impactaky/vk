# Proposal: Add Attempt Subcommand

## Summary
Add `vk attempt` subcommand to manage task attempts via the vibe-kanban API. This enables users to list, show, and create attempts for tasks directly from the CLI.

## Motivation
Task attempts are a core concept in vibe-kanban, representing individual execution runs by AI agents. Currently, the CLI supports projects and tasks but lacks attempt management capabilities. Adding attempt commands will provide a complete workflow for managing the task lifecycle.

## Scope
This proposal covers the essential CRUD operations for attempts:
- List attempts (for a task)
- Show attempt details
- Create new attempts

Advanced operations (merge, push, rebase, PR creation) are out of scope for this initial implementation and can be added in future proposals.

## Impact
- **Specs affected**: `cli-commands`
- **New types**: `TaskAttempt`, `CreateAttempt` in `src/api/types.ts`
- **New API methods**: Attempt endpoints in `src/api/client.ts`
- **New command file**: `src/commands/attempt.ts`

## Risks
- API endpoint structure must match vibe-kanban server
- Executor profile selection may need user guidance
