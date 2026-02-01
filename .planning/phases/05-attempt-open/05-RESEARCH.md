# Phase 5: Attempt Open - Research

**Researched:** 2026-02-01
**Domain:** CLI browser integration, workspace URL construction
**Confidence:** HIGH

## Summary

This phase adds browser integration to the vibe-kanban CLI, allowing users to open workspace URLs directly from the command line. The implementation follows existing patterns established in `task open` command and leverages the project's existing workspace resolution infrastructure.

The research focused on three key areas: (1) browser launching behavior via `@opensrc/deno-open`, (2) workspace ID resolution patterns already established in the codebase, and (3) URL construction patterns from the API configuration system. All decisions have been locked by the user in CONTEXT.md.

The standard approach is straightforward: use the existing `@opensrc/deno-open` library (already installed for `task open`), leverage the mature `resolveWorkspaceFromBranch()` utility, and follow Unix philosophy with silent success. No new dependencies or complex patterns required.

**Primary recommendation:** Follow the exact pattern from `task open` command, substituting workspace resolution for task resolution and workspace URL for task URL.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @opensrc/deno-open | ^1.0.0 | Cross-platform URL/file opener | Already installed; Deno port of sindresorhus/open (de facto standard for Node.js); handles WSL, macOS, Windows, Linux |
| @cliffy/command | 1.0.0-rc.7 | CLI framework | Project standard for all commands |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ApiClient | n/a (internal) | HTTP client for vibe-kanban API | All API operations |
| getApiUrl() | n/a (internal) | Config resolution | Constructing URLs |
| resolveWorkspaceFromBranch() | n/a (internal) | Branch-based workspace detection | Auto-detecting current workspace |
| getAttemptIdWithAutoDetect() | n/a (internal) | Workspace ID resolution with fzf fallback | Standard pattern for all attempt commands |
| handleCliError() | n/a (internal) | Error handling | All command error paths |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @opensrc/deno-open | Manual platform detection + Deno.run() | Would require maintaining cross-platform logic (macOS `open`, Windows `start`, Linux `xdg-open`, WSL detection); already-solved problem |
| New workspace resolver | Existing getAttemptIdWithAutoDetect() | No tradeoff; existing solution is mature and tested |

**Installation:**
```bash
# Already installed in deno.json
# No new dependencies required
```

## Architecture Patterns

### Recommended Project Structure
```
src/commands/
├── attempt.ts           # Add open subcommand here
└── task.ts             # Reference implementation

src/utils/
├── attempt-resolver.ts  # Use resolveWorkspaceFromBranch()
└── error-handler.ts     # Use handleCliError()

src/api/
├── client.ts           # Use getWorkspace() for validation
└── config.ts           # Use getApiUrl() for URL construction
```

### Pattern 1: Command Structure (Cliffy)
**What:** Define subcommand with optional ID argument and standard options
**When to use:** All attempt subcommands
**Example:**
```typescript
// Source: Existing codebase pattern (src/commands/attempt.ts)
attemptCommand
  .command("open")
  .description("Open a workspace in the browser")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      // ... implementation
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
```

### Pattern 2: Workspace ID Resolution
**What:** Three-tier resolution strategy: explicit ID → branch auto-detect → fzf fallback
**When to use:** All attempt commands that need workspace ID
**Example:**
```typescript
// Source: src/utils/attempt-resolver.ts
// For commands with fzf fallback (standard):
const workspaceId = await getAttemptIdWithAutoDetect(
  client,
  providedId,
  options.project,
);

// For open command (NO fzf fallback per CONTEXT.md):
// 1. If explicit ID provided, use it
// 2. Else try branch auto-detect
// 3. Else throw error "Not in a workspace branch. Provide workspace ID."
```

### Pattern 3: URL Construction
**What:** Combine API base URL with workspace-specific path
**When to use:** Generating URLs for browser opening
**Example:**
```typescript
// Source: src/commands/task.ts (task open command)
const baseUrl = await getApiUrl();
const url = `${baseUrl}/workspaces/${workspace.id}`;

// Note: workspace.id ensures exact workspace ID in URL
// API base URL comes from config (VK_API_URL env var or ~/.config/vibe-kanban/vk-config.json)
```

### Pattern 4: Browser Launch (Fire-and-Forget)
**What:** Use open() with default options (fire-and-forget behavior)
**When to use:** Opening URLs in browser
**Example:**
```typescript
// Source: src/commands/task.ts, @opensrc/deno-open documentation
import { open } from "@opensrc/deno-open";

// Fire-and-forget (default behavior, wait: false)
await open(url);

// open() returns Promise<ChildProcess> but resolves immediately
// Browser launch is async; don't wait for browser to close
// Handles WSL, macOS, Windows, Linux automatically
```

### Pattern 5: Silent Success Output
**What:** Print nothing on successful browser launch
**When to use:** Per CONTEXT.md Unix philosophy decision
**Example:**
```typescript
// CORRECT (per CONTEXT.md):
await open(url);
// No console.log() on success

// INCORRECT (what task open does, but NOT for attempt open):
console.log(`Opening: ${url}`);
await open(url);
```

### Anti-Patterns to Avoid
- **Printing URL before opening:** Task open prints "Opening: {url}" but CONTEXT.md specifies silent-on-success for attempt open (Unix philosophy)
- **Waiting for browser to close:** Don't use `wait: true` option; fire-and-forget is correct behavior
- **Custom platform detection:** open() handles all platforms; don't reinvent
- **Including fzf fallback:** CONTEXT.md explicitly states "No fzf fallback for open command"
- **Prefix matching on workspace ID:** CONTEXT.md requires exact match only

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-platform browser opening | Custom platform detection with Deno.run() | @opensrc/deno-open | Already handles WSL detection, macOS `open`, Windows `start`, Linux `xdg-open`; battle-tested in Node.js ecosystem |
| Workspace ID resolution | Parse branch names manually | resolveWorkspaceFromBranch() | Already handles API search, branch format validation, null handling |
| Workspace ID with fallback | Custom fzf logic | getAttemptIdWithAutoDetect() | Mature utility used by all other attempt commands; handles explicit ID → branch → fzf flow |
| API URL construction | Hardcode localhost:3000 | getApiUrl() from config.ts | Respects VK_API_URL env var and config file; consistent with all other commands |
| Error handling | Try-catch with console.error | handleCliError() | Standard error formatting; handles ProjectResolverError, FzfNotInstalledError, etc. |

**Key insight:** This command is 90% existing infrastructure. The only new logic is (1) constructing workspace URL instead of task URL, and (2) modified ID resolution to skip fzf fallback and error early.

## Common Pitfalls

### Pitfall 1: Using fzf Fallback
**What goes wrong:** Command falls back to fzf when user provides no ID and isn't on workspace branch
**Why it happens:** All other attempt commands use `getAttemptIdWithAutoDetect()` which includes fzf fallback
**How to avoid:** Use custom resolution logic that errors after branch auto-detect fails
**Warning signs:** User is prompted with fzf instead of receiving error message

**Correct implementation:**
```typescript
// DON'T use standard pattern:
const workspaceId = await getAttemptIdWithAutoDetect(client, id, options.project);

// DO implement custom logic per CONTEXT.md:
if (id) {
  workspaceId = id;
} else {
  const workspace = await resolveWorkspaceFromBranch(client);
  if (!workspace) {
    throw new Error("Not in a workspace branch. Provide workspace ID.");
  }
  workspaceId = workspace.id;
}
```

### Pitfall 2: Printing URL on Success
**What goes wrong:** Command prints "Opening: {url}" before launching browser
**Why it happens:** Copy-pasting from `task open` which does print URL
**How to avoid:** Follow CONTEXT.md decision: silent on success, only print on error
**Warning signs:** Console output when browser opens successfully

**Correct behavior:**
- Success: No output, browser opens
- Error (browser launch fails): Print URL as fallback (per CONTEXT.md: "URL is printed only if browser fails to launch")

### Pitfall 3: Workspace Validation Before API Call
**What goes wrong:** Calling `getWorkspace(workspaceId)` just to validate it exists before opening URL
**Why it happens:** Defensive programming instinct; wanting to fail early with better error
**How to avoid:** Trust workspace ID; API will return 404 if invalid
**Warning signs:** Extra API call that slows down command

**Analysis:**
- `task open` calls `getTask()` to get `project_id` for URL construction
- `attempt open` URL is `{baseUrl}/workspaces/{id}` - no other fields needed
- API validation happens naturally when user clicks URL in browser
- No UX benefit to validating; only adds latency

### Pitfall 4: Hardcoding API Base URL
**What goes wrong:** Using `http://localhost:3000` directly instead of `getApiUrl()`
**Why it happens:** Forgetting about VK_API_URL env var and config file
**How to avoid:** Always use `getApiUrl()` for base URL
**Warning signs:** URL is wrong when VK_API_URL is set

### Pitfall 5: Not Using Exact Match
**What goes wrong:** Accepting prefix matches like "abc" for workspace ID "abc123"
**Why it happens:** Convenience features from other CLI tools
**How to avoid:** Pass ID exactly as provided; API will handle exact matching
**Warning signs:** User surprised when wrong workspace opens

## Code Examples

Verified patterns from official sources:

### Workspace ID Resolution (Modified for No-Fzf)
```typescript
// Source: Derived from src/utils/attempt-resolver.ts pattern
// Modified per CONTEXT.md: no fzf fallback for open command

let workspaceId: string;

if (id) {
  // Explicit ID provided - use it directly (exact match)
  workspaceId = id;
} else {
  // Try branch auto-detection
  const workspace = await resolveWorkspaceFromBranch(client);
  if (workspace) {
    workspaceId = workspace.id;
  } else {
    throw new Error("Not in a workspace branch. Provide workspace ID.");
  }
}
```

### URL Construction
```typescript
// Source: src/commands/task.ts (lines 340-341)
// Modified for workspace URL format per CONTEXT.md

const baseUrl = await getApiUrl();
const url = `${baseUrl}/workspaces/${workspaceId}`;
```

### Browser Launch with Error Handling
```typescript
// Source: Derived from src/commands/task.ts + CONTEXT.md decisions

try {
  await open(url);
  // Silent on success (no console.log)
} catch (error) {
  // Print URL as fallback if browser launch fails
  console.log(`Could not open browser. Visit: ${url}`);
  throw error; // Let handleCliError() handle it
}
```

### Full Command Implementation
```typescript
// Source: Synthesized from existing patterns + CONTEXT.md decisions

attemptCommand
  .command("open")
  .description("Open a workspace in the browser")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();

      // Resolve workspace ID (explicit > branch > error)
      let workspaceId: string;
      if (id) {
        workspaceId = id;
      } else {
        const workspace = await resolveWorkspaceFromBranch(client);
        if (!workspace) {
          throw new Error("Not in a workspace branch. Provide workspace ID.");
        }
        workspaceId = workspace.id;
      }

      // Construct URL
      const baseUrl = await getApiUrl();
      const url = `${baseUrl}/workspaces/${workspaceId}`;

      // Open in browser (fire-and-forget)
      await open(url);

      // Silent on success (no output)
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual browser commands | @opensrc/deno-open library | Project inception (v0.1.0) | Cross-platform compatibility; used in task open |
| Custom workspace resolution | resolveWorkspaceFromBranch() | Project inception | Consistent branch pattern matching across all attempt commands |
| Hardcoded localhost | getApiUrl() with env var support | Project inception | Supports remote API deployments via VK_API_URL |

**Deprecated/outdated:**
- None identified; all patterns are current as of v0.1.0

**Future considerations:**
- WSL browser handling may evolve as Deno and deno-open mature
- URL format may change when frontend routes are implemented (currently backend API paths)

## Open Questions

Things that couldn't be fully resolved:

1. **Should URL validation happen before browser launch?**
   - What we know: `task open` calls API to get task details; `attempt open` could skip this
   - What's unclear: UX tradeoff between early validation vs. speed
   - Recommendation: Skip validation per Pitfall 3 analysis; URL validation happens naturally in browser

2. **How should browser launch errors be handled?**
   - What we know: open() returns Promise<ChildProcess>; fire-and-forget means immediate resolution
   - What's unclear: What actual errors can occur? Process spawn failure? Platform detection failure?
   - Recommendation: Wrap open() in try-catch; print URL as fallback per CONTEXT.md; let handleCliError() format

3. **Should --project option be kept for consistency?**
   - What we know: Option exists on all attempt commands for fzf fallback; no fzf for open command
   - What's unclear: Remove option entirely or keep for future-proofing?
   - Recommendation: KEEP option for CLI consistency; it becomes no-op when explicit ID or branch detection succeeds

## Sources

### Primary (HIGH confidence)
- Codebase: `src/commands/task.ts` (lines 319-349) - Reference implementation of `task open`
- Codebase: `src/commands/attempt.ts` - Existing attempt command patterns
- Codebase: `src/utils/attempt-resolver.ts` - Workspace resolution utilities
- Codebase: `src/api/config.ts` - API URL configuration
- Codebase: `deno.json` - @opensrc/deno-open version ^1.0.0
- Codebase: `.planning/phases/05-attempt-open/05-CONTEXT.md` - User decisions (all locked)
- GitHub: https://github.com/sindresorhus/open - Original open package documentation (deno-open is a port)

### Secondary (MEDIUM confidence)
- WebSearch: JSR documentation for @opensrc/deno-open (confirmed it's a Deno port of sindresorhus/open)
- WebSearch: npm open package behavior (fire-and-forget default, wait option, platform commands)

### Tertiary (LOW confidence)
- None required; all critical information verified from codebase and official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use; verified in deno.json and codebase
- Architecture: HIGH - Patterns extracted from existing code; CONTEXT.md decisions eliminate ambiguity
- Pitfalls: HIGH - Derived from careful analysis of CONTEXT.md vs. existing patterns (task open, attempt commands)

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain, no fast-moving dependencies)

**Key decisions locked by CONTEXT.md:**
- ✓ Use @opensrc/deno-open (same as task open)
- ✓ Exact match only for workspace ID
- ✓ Use existing resolveWorkspaceFromBranch()
- ✓ No fzf fallback for open command
- ✓ Silent on success (Unix philosophy)
- ✓ URL format: {API_URL}/workspaces/{workspace_id}
- ✓ Fire-and-forget browser launch
- ✓ Print URL only if browser launch fails
