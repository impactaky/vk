# Sessions and Execution Model Research

**Researched:** 2026-01-30
**Confidence:** HIGH (verified via DeepWiki official documentation)
**Scope:** Sessions/Execution Model for vibe-kanban CLI alignment

## Executive Summary

The vibe-kanban API has a three-level hierarchy for execution management: **Workspace -> Session -> ExecutionProcess**. The current CLI only understands Workspaces (exposed as "task-attempts") and lacks awareness of Sessions entirely.

The critical finding is that **follow-up messages must now be sent to Sessions, not Workspaces**. The CLI's current `vk attempt follow-up` command calls the wrong endpoint (`/api/task-attempts/{id}/follow-up`) when it should call `/api/sessions/{id}/follow-up`.

## Entity Hierarchy

```
Workspace (task-attempt)
    |
    +-- Session (agent conversation thread)
           |
           +-- ExecutionProcess (single agent run)
           +-- ExecutionProcess (follow-up run)
           +-- ExecutionProcess (another follow-up)
```

### Workspace

**Definition:** An isolated Git worktree environment allocated for a task attempt.

**Key characteristics:**
- Created via `POST /api/task-attempts`
- Contains filesystem path and repository state
- Has a dedicated branch per workspace
- Can contain MULTIPLE sessions

**Fields (from current CLI types):**
```typescript
interface Workspace {
  id: string;
  task_id: string;
  container_ref: string | null;
  branch: string;
  agent_working_dir: string | null;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  pinned: boolean;
  name: string | null;
}
```

### Session

**Definition:** Tracks an individual agent conversation within a workspace.

**Key characteristics:**
- Created automatically when execution begins
- Multiple sessions can exist per workspace
- Follow-up messages go to SESSIONS, not workspaces
- Each session can spawn multiple execution processes

**Relationship:**
- `workspace_id` foreign key links session to parent workspace
- One workspace -> Many sessions

**API Presence (needs CLI integration):**
```
GET  /api/sessions?workspace_id={uuid}     -- List sessions for workspace
GET  /api/sessions/:id                     -- Get session details
POST /api/sessions                         -- Create new session
POST /api/sessions/:id/follow-up           -- Send follow-up message
```

### ExecutionProcess

**Definition:** Records a specific agent execution event within a session.

**Key characteristics:**
- Created when agent is spawned
- Tracks status, exit code, run reason
- Multiple per session (initial + follow-ups)

**Run Reason Values:**
- `setupscript` - Repository setup operations
- `codingagent` - AI agent execution
- `cleanupscript` - Post-execution cleanup
- `devserver` - Development server process

**Relationship:**
- `session_id` foreign key links to parent session
- One session -> Many execution processes

## Session Lifecycle

```
1. User creates workspace (POST /api/task-attempts)
   -> Workspace created
   -> Session created automatically
   -> Initial ExecutionProcess spawned

2. Agent executes, completes work
   -> ExecutionProcess status = Completed

3. User sends follow-up (POST /api/sessions/{id}/follow-up)
   -> New ExecutionProcess spawned in SAME session
   -> Agent resumes with follow-up message

4. Repeat step 3 for multiple follow-ups

5. Work complete
   -> Task status moves to "inreview"
```

## Follow-Up Mechanism

### How It Works

1. **User sends follow-up to session** (not workspace)
2. System checks if execution is running:
   - If YES: Message is queued via `QueuedMessageService`
   - If NO: New `ExecutionProcess` spawned immediately
3. Each executor has different session resumption:
   - **ClaudeCode**: `--fork-session --resume` flags
   - **Amp**: `threads fork` + `threads continue` commands
   - **Gemini/QwenCode**: ACP protocol session resumption

### API Endpoint

```
POST /api/sessions/{session_id}/follow-up
Content-Type: application/json

{
  "message": "Please also add tests for the edge cases"
}

Response: ExecutionProcess
```

### Current CLI Bug

The CLI currently calls:
```
POST /api/task-attempts/{workspace_id}/follow-up
```

It should call:
```
POST /api/sessions/{session_id}/follow-up
```

This requires:
1. Knowing which session to target
2. Either: Getting the "active" session for a workspace
3. Or: Listing sessions and letting user choose

## API Endpoints (Sessions)

### List Sessions for Workspace

```
GET /api/sessions?workspace_id={uuid}

Response: ApiResponse<Vec<Session>>
```

### Get Session Details

```
GET /api/sessions/:id

Response: ApiResponse<Session>
```

### Create New Session

```
POST /api/sessions

Response: ApiResponse<Session>
```

### Send Follow-Up

```
POST /api/sessions/:id/follow-up

Request: CreateFollowUpAttempt { message: string }
Response: ApiResponse<ExecutionProcess>
```

## CLI Integration Approach

### Option A: Transparent Session Handling (Recommended)

The CLI abstracts sessions away from users. Most users care about workspaces, not sessions.

**Implementation:**
1. When user calls `vk attempt follow-up <workspace_id>`:
   - CLI fetches sessions for workspace: `GET /api/sessions?workspace_id={id}`
   - CLI selects the most recent/active session
   - CLI sends follow-up to that session: `POST /api/sessions/{session_id}/follow-up`

**Pros:**
- Minimal UX change for users
- Backward compatible command structure
- Sessions are implementation detail

**Cons:**
- Loses ability to target specific sessions (rarely needed)

### Option B: Explicit Session Commands

Add new `session` command group to CLI.

**New commands:**
```bash
vk session list [workspace_id]       # List sessions for workspace
vk session show <session_id>         # Show session details
vk session follow-up <session_id> --message "..."  # Send follow-up
```

**Modify existing:**
```bash
vk attempt follow-up  # Deprecated, points to vk session follow-up
```

**Pros:**
- Full session control
- Matches API structure

**Cons:**
- More commands for users to learn
- Breaking change to existing workflows

### Recommendation: Hybrid Approach

1. **Keep `vk attempt follow-up` working** by auto-resolving session
2. **Add `vk session list`** for users who need visibility
3. **Add optional `--session` flag** to follow-up for explicit targeting

```bash
# Auto-resolves to latest session (most common use)
vk attempt follow-up --message "Add tests"

# Explicit session targeting (power users)
vk attempt follow-up --session abc123 --message "Add tests"

# List sessions when needed
vk session list [workspace_id]
```

## Required CLI Changes

### 1. Add Session Types

```typescript
// src/api/types.ts

interface Session {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  // Additional fields TBD from API response
}
```

### 2. Add Session API Methods

```typescript
// src/api/client.ts

// List sessions for a workspace
listSessions(workspaceId: string): Promise<Session[]> {
  return this.request<Session[]>(`/sessions?workspace_id=${workspaceId}`);
}

// Get single session
getSession(id: string): Promise<Session> {
  return this.request<Session>(`/sessions/${id}`);
}

// Send follow-up to session (NOT workspace)
sessionFollowUp(sessionId: string, request: FollowUpRequest): Promise<ExecutionProcess> {
  return this.request<ExecutionProcess>(`/sessions/${sessionId}/follow-up`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
```

### 3. Fix `vk attempt follow-up` Command

Current implementation (BROKEN):
```typescript
await client.followUp(workspaceId, request);  // Calls /task-attempts/{id}/follow-up
```

Fixed implementation:
```typescript
// Get latest session for workspace
const sessions = await client.listSessions(workspaceId);
if (sessions.length === 0) {
  throw new Error("No sessions found for this workspace");
}
// Use most recent session (last created or last updated)
const latestSession = sessions.sort((a, b) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
)[0];

// Send follow-up to session
await client.sessionFollowUp(latestSession.id, request);
```

### 4. (Optional) Add Session List Command

```typescript
// src/commands/session.ts

attemptCommand
  .command("sessions")
  .description("List sessions for a workspace")
  .arguments("[workspace_id:string]")
  .option("--json", "Output as JSON")
  .action(async (options, workspaceId) => {
    const client = await ApiClient.create();
    const id = await getAttemptIdWithAutoDetect(client, workspaceId, options.project);
    const sessions = await client.listSessions(id);
    // ... display sessions
  });
```

## Open Questions

### LOW confidence items requiring verification:

1. **Session fields:** What exact fields does the Session response include? Need to verify against actual API response.

2. **Active session selection:** Is there a concept of "active" or "current" session? Or should we always use most recent?

3. **Session creation:** When is a session created? Only on workspace creation, or can users manually create sessions?

4. **Execution process listing:** Is there an endpoint to list execution processes for a session? (For showing execution history)

5. **Session statuses:** What statuses can a session have? Running, Completed, Failed?

### Recommendations for phase-specific research:

- Before implementing, test the actual API responses to confirm Session type fields
- Verify if `/api/task-attempts/{id}/follow-up` is deprecated or removed
- Check if there's a "latest session" convenience endpoint

## Sources

- DeepWiki vibe-kanban documentation (HIGH confidence)
  - /BloopAI/vibe-kanban/9.1-rest-api-endpoints - Session API endpoints
  - /BloopAI/vibe-kanban/2-architecture-overview - Entity hierarchy
  - /BloopAI/vibe-kanban/4-execution-engine - Session lifecycle
  - /BloopAI/vibe-kanban/3-api-layer - API structure

- Current CLI source code (HIGH confidence)
  - /var/tmp/vibe-kanban/worktrees/b708-gsd-new-mileston/vk/src/api/types.ts
  - /var/tmp/vibe-kanban/worktrees/b708-gsd-new-mileston/vk/src/api/client.ts
  - /var/tmp/vibe-kanban/worktrees/b708-gsd-new-mileston/vk/src/commands/attempt.ts

---
*Research completed: 2026-01-30*
