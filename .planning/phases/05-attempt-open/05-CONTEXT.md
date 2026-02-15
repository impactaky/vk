# Phase 5: Attempt Open — Context

## Browser Launch Behavior

**Decision:** Use `@opensrc/deno-open` (same as `task open`)

- Fire-and-forget — don't wait for browser to close
- URL is printed only if browser fails to launch (fallback for copy/paste)
- WSL/remote: best effort via deno-open; printed URL serves as fallback

## ID Resolution

**Decision:** Exact match only

- Require full workspace ID (no prefix matching)
- Case-sensitive exact match
- Error message: simple "not found" (no suggestions)

## Branch Auto-Detection

**Decision:** Use existing infrastructure

- Use `resolveWorkspaceFromBranch()` from `src/utils/attempt-resolver.ts`
- Branch pattern: `{username}/{4-char-hash}-{description}`
- Explicit ID takes precedence over auto-detection
- If no ID provided and not on workspace branch: error "Not in a workspace
  branch. Provide workspace ID."
- No fzf fallback for `open` command

## Output and Feedback

**Decision:** Unix philosophy — silent on success

- Print nothing on success
- No `--quiet` flag (already silent by default)
- No special handling for "already open" — just open again
- No fancy formatting or colors

## URL Format

```
{API_URL}/workspaces/{workspace_id}
```

## Deferred Ideas

(None captured)
