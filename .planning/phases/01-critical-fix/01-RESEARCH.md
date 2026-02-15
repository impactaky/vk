# Phase 1: Critical Fix - Research

**Researched:** 2026-01-30 **Domain:** TypeScript CLI Development / REST API
Integration / Session Management **Confidence:** HIGH

## Summary

Phase 1 fixes the broken `vk attempt follow-up` command by aligning with the
vibe-kanban API's session-based architecture. The current CLI incorrectly calls
`/api/task-attempts/{id}/follow-up` when the API expects
`/api/sessions/{id}/follow-up`. This requires adding Session entity awareness to
the CLI while maintaining backward-compatible UX through transparent session
resolution.

The work spans three technical areas: (1) TypeScript type definitions for
Sessions and updated FollowUpRequest schema, (2) API client methods for session
operations, and (3) session resolution logic that handles multiple sessions per
workspace gracefully using the existing fzf pattern.

**Primary recommendation:** Implement transparent session auto-resolution in
`vk attempt follow-up` using workspace ID lookup + fzf selection pattern when
multiple sessions exist, matching the existing workspace/task resolution pattern
in `attempt-resolver.ts`.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library         | Version    | Purpose             | Why Standard                                                       |
| --------------- | ---------- | ------------------- | ------------------------------------------------------------------ |
| Deno            | 2.x        | TypeScript runtime  | Zero-config TypeScript, built-in tools, security model             |
| @cliffy/command | 1.0.0-rc.7 | CLI framework       | Type-safe arg parsing, subcommands, standard in Deno CLI ecosystem |
| @cliffy/prompt  | 1.0.0-rc.7 | Interactive prompts | User confirmations, fzf integration, matches command framework     |
| @cliffy/table   | 1.0.0-rc.7 | Formatted output    | Consistent table rendering, pairs with command framework           |

### Supporting

| Library     | Version       | Purpose         | When to Use                                       |
| ----------- | ------------- | --------------- | ------------------------------------------------- |
| @std/assert | 1.0.9         | Test assertions | Unit tests, integration tests                     |
| fzf         | 1+ (external) | Fuzzy finder    | Interactive selection when multiple options exist |

### Alternatives Considered

| Instead of | Could Use             | Tradeoff                                                                    |
| ---------- | --------------------- | --------------------------------------------------------------------------- |
| fzf        | @cliffy/prompt Select | fzf offers better UX for large lists, already integrated                    |
| Deno       | Node.js + TypeScript  | Deno provides zero-config TS, security, stdlib - no benefit to Node.js here |

**Installation:**

```bash
# Core runtime
deno --version  # Should be 2.x

# External tool (optional but recommended)
# macOS: brew install fzf
# Linux: apt-get install fzf
# Windows: choco install fzf
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── api/              # API client layer
│   ├── client.ts     # ApiClient class with methods
│   ├── types.ts      # TypeScript interfaces matching API
│   └── config.ts     # API URL configuration
├── commands/         # CLI commands (one file per command group)
│   ├── attempt.ts    # Workspace commands (including follow-up)
│   └── ...
└── utils/            # Shared utilities
    ├── attempt-resolver.ts  # Auto-detect workspace/session from context
    ├── fzf.ts              # Interactive selection helpers
    └── ...
```

### Pattern 1: Session Resolution (Auto-detect with Fallback to fzf)

**What:** Transparently resolve session ID from workspace, falling back to
interactive selection when ambiguous.

**When to use:** Any command that needs a session but wants to accept workspace
ID for backward compatibility.

**Example:**

```typescript
// Source: Derived from existing pattern in attempt-resolver.ts lines 53-74

async function getSessionIdWithAutoDetect(
  client: ApiClient,
  providedWorkspaceId: string | undefined,
  projectId?: string,
): Promise<string> {
  // If explicit workspace provided, get sessions for it
  if (providedWorkspaceId) {
    const sessions = await client.listSessions(providedWorkspaceId);
    if (sessions.length === 0) {
      throw new Error("No sessions found for this workspace");
    }
    if (sessions.length === 1) {
      return sessions[0].id;
    }
    // Multiple sessions -> use fzf
    return selectSession(sessions);
  }

  // Auto-detect workspace from branch, then get session
  const workspace = await resolveWorkspaceFromBranch(client);
  if (workspace) {
    const sessions = await client.listSessions(workspace.id);
    if (sessions.length === 0) {
      throw new Error("No sessions found for this workspace");
    }
    if (sessions.length === 1) {
      return sessions[0].id;
    }
    return selectSession(sessions);
  }

  // No auto-detect worked -> fall back to manual selection
  const workspaceId = await getAttemptIdWithAutoDetect(
    client,
    undefined,
    projectId,
  );
  const sessions = await client.listSessions(workspaceId);
  if (sessions.length === 0) {
    throw new Error("No sessions found for this workspace");
  }
  if (sessions.length === 1) {
    return sessions[0].id;
  }
  return selectSession(sessions);
}
```

### Pattern 2: API Client Method Extension

**What:** Add new API methods following the established request pattern.

**When to use:** When integrating any new API endpoint.

**Example:**

```typescript
// Source: Existing pattern from client.ts lines 46-91

// In ApiClient class
listSessions(workspaceId: string): Promise<Session[]> {
  return this.request<Session[]>(`/sessions?workspace_id=${workspaceId}`);
}

getSession(id: string): Promise<Session> {
  return this.request<Session>(`/sessions/${id}`);
}

createSession(workspace_id: string, executor_profile_id: ExecutorProfileID): Promise<Session> {
  return this.request<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify({ workspace_id, executor_profile_id }),
  });
}

sessionFollowUp(sessionId: string, request: FollowUpRequest): Promise<void> {
  return this.request<void>(`/sessions/${sessionId}/follow-up`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
```

### Pattern 3: Type Definition Alignment

**What:** Define TypeScript interfaces matching API response schemas exactly,
using snake_case for field names.

**When to use:** When adding or updating any API entity types.

**Example:**

```typescript
// Source: Existing pattern from types.ts

// Session type - matches API response
export interface Session {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

// Request type - matches API request body
export interface FollowUpRequest {
  prompt: string; // NOT "message"
  executor_profile_id: ExecutorProfileID;
}
```

### Pattern 4: fzf Integration for Interactive Selection

**What:** Use fzf for selecting from multiple options with consistent
formatting.

**When to use:** When user needs to choose from a list (tasks, workspaces,
sessions, etc.).

**Example:**

```typescript
// Source: fzf.ts lines 156-166

export function formatSession(session: Session): string {
  return `${session.id}\t${session.created_at}\t${session.workspace_id}`;
}

export async function selectSession(sessions: Session[]): Promise<string> {
  if (sessions.length === 0) {
    throw new Error("No sessions available.");
  }
  const items = sessions.map(formatSession);
  const selected = await runFzf(items, "Select session:");
  return extractId(selected); // Gets first tab-separated field
}
```

### Anti-Patterns to Avoid

- **Hardcoding endpoint paths in commands:** Always use ApiClient methods.
  Commands should never construct URLs directly.
- **Ignoring multi-session scenarios:** Don't assume one workspace = one
  session. Always handle multiple sessions gracefully.
- **Breaking backward compatibility:** Users expect `vk attempt follow-up` to
  work with workspace ID. Preserve this UX through transparent resolution.
- **Mixing field naming conventions:** API uses `snake_case` (prompt,
  executor_profile_id), don't convert to camelCase in types.
- **Silent failures on no sessions:** Explicitly error with helpful message "No
  sessions found for this workspace" rather than silent fallback.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                  | Don't Build               | Use Instead                                         | Why                                                                      |
| ------------------------ | ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| Interactive selection UI | Custom terminal menu      | `fzf` via `src/utils/fzf.ts`                        | Already integrated, handles large lists well, users may already know fzf |
| Workspace auto-detection | Parse git branch manually | `attempt-resolver.ts::resolveWorkspaceFromBranch()` | Existing, tested, handles edge cases                                     |
| API request boilerplate  | Duplicate fetch logic     | `ApiClient.request<T>()` private method             | Centralized error handling, logging, type safety                         |
| Error messages for users | Generic error.message     | `error-handler.ts::handleCliError()`                | Consistent error formatting, exit codes                                  |

**Key insight:** The codebase already has strong patterns for resolution
(workspace from branch), selection (fzf), and API communication (ApiClient).
Extend these patterns rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Assuming One Session Per Workspace

**What goes wrong:** Code crashes or selects wrong session when workspace has
multiple sessions (e.g., user ran agent, stopped it, restarted with different
executor).

**Why it happens:** Mental model treats sessions as 1:1 with workspaces, but API
allows many sessions per workspace.

**How to avoid:**

1. Always use `listSessions(workspaceId)` and check array length
2. If length === 0, error explicitly
3. If length === 1, auto-select
4. If length > 1, use fzf selection

**Warning signs:**

- Accessing `sessions[0]` without length check
- Error message "session not found" when sessions exist but multiple

### Pitfall 2: Request Schema Mismatch (message vs prompt)

**What goes wrong:** API returns 400 error because CLI sends
`{ message: "..." }` but API expects
`{ prompt: "...", executor_profile_id: {...} }`.

**Why it happens:** Old CLI used simplified schema, API evolved to require
executor selection.

**How to avoid:**

1. Use `FollowUpRequest` type from types.ts (updated schema)
2. Always include `executor_profile_id` in request
3. Test against actual API, not assumptions

**Warning signs:**

- 400 Bad Request on follow-up calls
- API error mentioning "missing field: executor_profile_id"

### Pitfall 3: Breaking Existing User Workflows

**What goes wrong:** Users who run
`vk attempt follow-up <workspace-id> --message "..."` get errors because command
now requires session ID.

**Why it happens:** Direct session ID requirement breaks backward compatibility.

**How to avoid:**

1. Keep workspace ID as valid input
2. Auto-resolve to session transparently
3. Add optional `--session` flag for explicit session targeting
4. Document that workspace ID still works

**Warning signs:**

- User complaints about "command used to work"
- Documentation says "session ID required" without workspace fallback

### Pitfall 4: Incorrect Executor Handling in Follow-Up

**What goes wrong:** Follow-up uses wrong executor or requires manual executor
specification every time.

**Why it happens:** Unclear how to get executor from existing session.

**How to avoid:**

1. Default: Re-use executor from target session
2. Parse `executor_profile_id` from session's first execution process
3. Allow optional `--executor` flag to override
4. Defer complex executor switching to future phases

**Warning signs:**

- Follow-up always prompts for executor
- Follow-up uses different executor than original session

### Pitfall 5: Session Verification Missing

**What goes wrong:** User sends follow-up to stopped/completed session, message
is lost or errors.

**Why it happens:** No check that session is in running state.

**How to avoid:**

1. Check session has active ExecutionProcess before sending
2. Alternatively: Let API handle validation and return clear error
3. For Phase 1: Defer session state checks, rely on API validation

**Warning signs:**

- Follow-up "succeeds" but agent never receives message
- Silent failures on inactive sessions

## Code Examples

Verified patterns from official sources:

### Session Type Definition

```typescript
// Source: .planning/research/TYPES.md lines 22-35
// Add to: src/api/types.ts

export interface Session {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}
```

### Updated FollowUpRequest Schema

```typescript
// Source: .planning/research/ENDPOINTS.md lines 234-243
// Update in: src/api/types.ts

// OLD (REMOVE):
export interface FollowUpRequest {
  message: string;
}

// NEW (ADD):
export interface FollowUpRequest {
  prompt: string;
  executor_profile_id: ExecutorProfileID;
}
```

### Session API Client Methods

```typescript
// Source: .planning/research/SESSIONS.md lines 274-290
// Add to: src/api/client.ts (inside ApiClient class)

listSessions(workspaceId: string): Promise<Session[]> {
  return this.request<Session[]>(`/sessions?workspace_id=${workspaceId}`);
}

getSession(id: string): Promise<Session> {
  return this.request<Session>(`/sessions/${id}`);
}

createSession(
  workspace_id: string,
  executor_profile_id: ExecutorProfileID
): Promise<Session> {
  return this.request<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify({ workspace_id, executor_profile_id }),
  });
}

sessionFollowUp(sessionId: string, request: FollowUpRequest): Promise<void> {
  return this.request<void>(`/sessions/${sessionId}/follow-up`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
```

### fzf Session Selection

```typescript
// Source: Pattern from fzf.ts lines 156-166
// Add to: src/utils/fzf.ts

export function formatSession(session: Session): string {
  return `${session.id}\t${session.created_at}\t${session.workspace_id}`;
}

export async function selectSession(sessions: Session[]): Promise<string> {
  if (sessions.length === 0) {
    throw new Error("No sessions available.");
  }
  const items = sessions.map(formatSession);
  const selected = await runFzf(items, "Select session:");
  return extractId(selected);
}
```

### Fixed Follow-Up Command Implementation

```typescript
// Source: Pattern from attempt.ts follow-up command (lines 573-604)
// Update in: src/commands/attempt.ts

attemptCommand
  .command("follow-up")
  .description("Send a follow-up message to a running workspace")
  .arguments("[id:string]")
  .option("--project <id:string>", "Project ID (for fzf selection)")
  .option("--prompt <prompt:string>", "Message to send", { required: true })
  .option(
    "--executor <executor:string>",
    "Override executor (format: NAME:VARIANT)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();

      // Resolve workspace ID (from arg, auto-detect, or fzf)
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      // Get sessions for workspace
      const sessions = await client.listSessions(workspaceId);
      if (sessions.length === 0) {
        throw new Error("No sessions found for this workspace");
      }

      // Auto-select if single session, otherwise use fzf
      const sessionId = sessions.length === 1
        ? sessions[0].id
        : await selectSession(sessions);

      // Get session to extract executor
      const session = await client.getSession(sessionId);

      // Use provided executor or default to session's executor
      const executorProfileId = options.executor
        ? parseExecutorString(options.executor)
        : await getExecutorFromSession(client, session);

      const request: FollowUpRequest = {
        prompt: options.prompt,
        executor_profile_id: executorProfileId,
      };

      await client.sessionFollowUp(sessionId, request);
      console.log("Follow-up message sent successfully.");
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
```

### Executor Resolution Helper

```typescript
// Add to: src/utils/attempt-resolver.ts or new src/utils/session-resolver.ts

async function getExecutorFromSession(
  client: ApiClient,
  session: Session,
): Promise<ExecutorProfileID> {
  // For Phase 1: Simple approach - require --executor flag or use default
  // Future: Query execution processes to get executor from latest process

  // Temporary implementation for Phase 1:
  // If session has executor field, parse it
  if (session.executor) {
    return parseExecutorString(session.executor);
  }

  // Otherwise error - user must specify
  throw new Error(
    "Cannot determine executor for session. Please specify with --executor flag.",
  );
}
```

## State of the Art

| Old Approach                     | Current Approach                           | When Changed     | Impact                              |
| -------------------------------- | ------------------------------------------ | ---------------- | ----------------------------------- |
| Follow-up to workspace           | Follow-up to session                       | API v1.0+ (2025) | CLI must resolve workspace->session |
| `{ message }` schema             | `{ prompt, executor_profile_id }` schema   | API v1.0+ (2025) | Request body structure changed      |
| Single executor per workspace    | Multiple sessions with different executors | API v1.0+ (2025) | Need executor selection logic       |
| Auto-create session on workspace | Explicit session creation                  | API v1.0+ (2025) | CLI must handle session lifecycle   |

**Deprecated/outdated:**

- `/api/task-attempts/{id}/follow-up` endpoint: Removed in favor of
  `/api/sessions/{id}/follow-up`
- `FollowUpRequest.message` field: Renamed to `prompt` and made part of larger
  schema
- Single-session assumption: Workspaces now support multiple concurrent sessions

## Open Questions

Things that couldn't be fully resolved:

1. **Session Executor Field Population**
   - What we know: Session has optional `executor: string | null` field (from
     TYPES.md)
   - What's unclear: Is this field always populated? How is it formatted
     (name:variant or just name)?
   - Recommendation: For Phase 1, require `--executor` flag on follow-up. Phase
     2 can add smart executor detection.

2. **Session State/Status**
   - What we know: Sessions exist and have created_at/updated_at
   - What's unclear: Is there a status field (running/completed/failed)? How to
     check if session is active?
   - Recommendation: Skip session state validation in Phase 1. Let API return
     error if session is inactive.

3. **Multiple Sessions Ordering**
   - What we know: Multiple sessions can exist per workspace
   - What's unclear: Should we default to "most recent" or "currently running"?
   - Recommendation: For Phase 1, use fzf selection when multiple exist. Don't
     assume ordering.

4. **Executor Profile ID Structure**
   - What we know: `{ executor: BaseCodingAgent, variant: string | null }`
   - What's unclear: What are valid variant values? Is null always acceptable?
   - Recommendation: Re-use existing `parseExecutorString()` from
     executor-parser.ts. Accept format "NAME:VARIANT" or "NAME".

## Sources

### Primary (HIGH confidence)

- .planning/research/SESSIONS.md - Session architecture and follow-up mechanism
- .planning/research/ENDPOINTS.md - API endpoint specifications and schema
- .planning/research/TYPES.md - Type definitions and schema mismatches
- .planning/codebase/STACK.md - Technology stack (Deno, Cliffy)
- .planning/codebase/CONVENTIONS.md - Code style and patterns

### Secondary (MEDIUM confidence)

- Current CLI source code (types.ts, client.ts, attempt.ts, fzf.ts,
  attempt-resolver.ts)
- Existing resolver patterns (workspace auto-detection from branch)

### Tertiary (LOW confidence)

- Session executor field usage (inferred from type definition, needs API
  validation)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Verified from deno.json and codebase imports
- Architecture: HIGH - Patterns extracted from existing working code
- Pitfalls: MEDIUM - Based on analysis of schema mismatches and common
  resolution issues
- Session executor handling: LOW - Requires API testing to confirm behavior

**Research date:** 2026-01-30 **Valid until:** 2026-03-01 (30 days - stable API,
unlikely to change)
