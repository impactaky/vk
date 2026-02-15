# Phase 1 Context: Critical Fix

**Phase goal:** Users can send follow-up messages to running workspaces
**Created:** 2026-01-30 **Status:** Ready for planning

## Decisions

### Session Resolution

**How to find the right session for a workspace:**

1. **Multiple sessions exist** → Launch fzf interactive selection (matches
   existing CLI patterns)
2. **No sessions exist** → Error: "No sessions found for this workspace"
3. **Session not running** → Error (verify session is active before sending)
4. **Auto-detected workspace (from git branch)** → Same resolution logic as
   explicit ID

### Executor Handling

**How to handle executor_profile_id requirement:**

1. **Default behavior** → Re-use executor from the target session
2. **Override** → Accept optional `--executor` flag to specify different
   executor
3. **Mismatched executor** → Allow it (let API decide if valid)
4. **Additional flags** (`force_when_dirty`, `perform_git_reset`) → Defer, add
   only if clear use case emerges

## Implementation Notes

- Follow existing fzf patterns from `src/utils/fzf.ts`
- Session list endpoint: `GET /api/sessions?workspace_id={id}`
- Follow-up endpoint: `POST /api/sessions/{id}/follow-up`
- Request schema: `{ prompt, executor_profile_id, ... }` (not `{ message }`)

## Not Discussed (Use Judgment)

- Error message wording (clear and actionable)
- `--message` flag backward compatibility (map to `prompt` internally)

## Deferred Ideas

None captured during discussion.

---

_Context captured: 2026-01-30_
