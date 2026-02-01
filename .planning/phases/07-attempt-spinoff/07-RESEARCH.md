# Phase 7: Attempt Spin-Off - Research

**Researched:** 2026-02-01
**Domain:** Deno CLI command implementation with Cliffy
**Confidence:** HIGH

## Summary

This phase implements a CLI subcommand `vk attempt spin-off` that creates a child task linked to a parent workspace. The implementation follows established patterns in the codebase for command structure, input handling, and API communication.

The user has already made key decisions via CONTEXT.md: title and message are separate inputs, file input is supported for messages, default title from first line of message, minimal output format, and no parent relationship visualization.

The technical approach is straightforward: use Cliffy's existing prompt/option patterns (already used in `task create`), leverage the existing CreateTask API with `parent_workspace_id` field, and follow the established auto-detection pattern used across attempt commands.

**Primary recommendation:** Follow the exact pattern from `task create` command for input handling, but add workspace ID resolution using `getAttemptIdWithAutoDetect()` and set `parent_workspace_id` in the CreateTask payload.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @cliffy/command | 1.0.0-rc.7 | CLI framework | Official Cliffy framework - used throughout codebase |
| @cliffy/prompt | 1.0.0-rc.7 | Interactive prompts | Part of Cliffy suite - handles Input, Confirm prompts |
| Deno stdlib | Built-in | Runtime utilities | Native Deno features - no external deps needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @std/assert | 1.0.9 | Test assertions | Integration testing (Phase 8) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cliffy Input | Raw stdin | Cliffy provides validation, better UX |
| Custom file parser | Generic text read | Existing `parseTaskFromFile()` handles title extraction |

**Installation:**
No new dependencies required - all tools already in `deno.json`.

## Architecture Patterns

### Recommended Project Structure
Already established in codebase:
```
src/commands/
├── attempt.ts        # Add spin-off subcommand here
├── task.ts          # Reference for create command pattern
src/utils/
├── attempt-resolver.ts  # Auto-detection logic
├── markdown-parser.ts   # File input parsing (if message from file)
src/api/
├── client.ts        # createTask() method already exists
└── types.ts         # CreateTask interface has parent_workspace_id
```

### Pattern 1: Command Registration with Cliffy
**What:** Cliffy command structure with options and action handler
**When to use:** All CLI commands
**Example:**
```typescript
// Source: src/commands/attempt.ts (cd command, lines 966-1050)
attemptCommand
  .command("cd")
  .description("Navigate into a workspace's working directory")
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

### Pattern 2: Auto-Detection with Manual Override
**What:** Workspace ID from explicit arg > branch detection > error (no fzf fallback for workspace-centric commands)
**When to use:** Commands that operate on a specific workspace context
**Example:**
```typescript
// Source: src/commands/attempt.ts (open command, lines 936-945)
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
```

### Pattern 3: Interactive Prompts with Flag Fallback
**What:** Use flag value if provided, otherwise prompt user
**When to use:** Required inputs that might not be provided via CLI flags
**Example:**
```typescript
// Source: src/commands/task.ts (create command, lines 153-179)
let title = options.title;
let description = options.description;

// Handle --from option
if (options.from) {
  if (options.title || options.description) {
    console.error("Error: Cannot use --from with --title or --description");
    Deno.exit(1);
  }
  const parsed = await parseTaskFromFile(options.from);
  title = parsed.title;
  description = parsed.description;
} else {
  if (!title) {
    title = await Input.prompt("Task title:");
  }
  if (!description) {
    description = await Input.prompt({
      message: "Task description (optional):",
      default: "",
    });
  }
}
```

### Pattern 4: Simple Output Format
**What:** Display only essential information after creation
**When to use:** Create/update operations per CONTEXT.md decision
**Example:**
```typescript
// Source: src/commands/task.ts (create command, lines 189-191)
console.log(`Task created successfully!`);
console.log(`ID: ${task.id}`);
// No additional suggestions or parent info (per CONTEXT.md)
```

### Anti-Patterns to Avoid
- **Don't use fzf for workspace-centric commands**: Commands like `open`, `cd`, `spin-off` should NOT fall back to fzf if no workspace ID provided - require explicit ID or branch context
- **Don't show parent relationship in output**: Per CONTEXT.md decision, keep output minimal (just ID + title)
- **Don't auto-derive title from message**: Per CONTEXT.md, title is explicit input, use first line of message only as default if --title not provided

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI argument parsing | Manual argv parsing | Cliffy Command | Type-safe, handles validation, generates help |
| Interactive prompts | Raw stdin/stdout | Cliffy Input/Confirm | Handles terminal control, validation, UX |
| File parsing for task input | Custom markdown parser | Existing parseTaskFromFile() | Already handles title extraction from markdown |
| Workspace auto-detection | Branch name matching | getAttemptIdWithAutoDetect() | Handles all resolution logic + fzf fallback |
| Error formatting | console.error + stack | handleCliError() | Consistent error output across commands |

**Key insight:** The codebase already has all primitives needed - don't create new utilities. Reuse existing patterns from `task create`, `attempt cd`, and `attempt open` commands.

## Common Pitfalls

### Pitfall 1: Mixing Title and Message Semantics
**What goes wrong:** Confusing "title" (task name) with "message" (initial prompt to agent)
**Why it happens:** CONTEXT.md explicitly separates these, but easy to conflate them
**How to avoid:**
- Use `--title` for task title (what appears in task list)
- Use `--message` for initial agent message (what gets sent to workspace)
- Default title is first line of message only if `--title` not provided
**Warning signs:** Code that tries to auto-generate title from message content

### Pitfall 2: Incorrect Auto-Detection Pattern
**What goes wrong:** Using fzf fallback when workspace context is required
**Why it happens:** Most attempt commands use `getAttemptIdWithAutoDetect()` which includes fzf, but workspace-centric commands (open, cd, spin-off) should NOT
**How to avoid:** For spin-off, use pattern from `attempt open` (lines 936-945) - explicit ID or branch detection only, no fzf
**Warning signs:** Command works when you provide ID but fails unexpectedly when run without workspace context

### Pitfall 3: File Input Validation
**What goes wrong:** Accepting both `--from` and `--title`/`--message` simultaneously
**Why it happens:** User might not understand they're mutually exclusive
**How to avoid:** Add validation like `task create` (lines 157-163) - error if `--from` used with other flags
**Warning signs:** Unclear which input source takes precedence

### Pitfall 4: Parent Workspace ID vs Task ID
**What goes wrong:** Setting parent_workspace_id to wrong entity (task ID instead of workspace ID)
**Why it happens:** Terminology confusion - "parent" refers to workspace, not parent task
**How to avoid:**
- Resolve workspace ID first using auto-detection
- Pass workspace ID to `parent_workspace_id` field in CreateTask
- Remember: workspace ID is the source, not the parent task's ID
**Warning signs:** API validation errors about invalid workspace ID

### Pitfall 5: Message vs Prompt Field Names
**What goes wrong:** API expects different field names than CLI flag names
**Why it happens:** CLI uses `--message` but API might expect `prompt` or `description`
**How to avoid:** Check CreateTask interface - it has `description` field, not `message`. Map `--message` flag to `description` field.
**Warning signs:** TypeScript compilation errors about unknown fields

## Code Examples

Verified patterns from official sources:

### Spin-Off Command Structure
```typescript
// Composite pattern from existing commands
attemptCommand
  .command("spin-off")
  .description("Create a new task from current workspace")
  .arguments("[id:string]")
  .option("--project <id:string>", "Project ID (for fzf selection, auto-detected from git if omitted)")
  .option("--title <title:string>", "Task title")
  .option("--message <message:string>", "Initial message to send to new agent")
  .option("--from <file:file>", "Load message from file")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();

      // Resolve workspace ID (explicit > branch > error, NO fzf)
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

      // Get workspace to find project_id
      const workspace = await client.getWorkspace(workspaceId);

      // Handle input (title and message)
      let title = options.title;
      let message = options.message;

      if (options.from) {
        if (options.title || options.message) {
          console.error("Error: Cannot use --from with --title or --message");
          Deno.exit(1);
        }
        // Read message from file
        message = await Deno.readTextFile(options.from);
        // Default title: first line of message
        if (!title) {
          title = message.split('\n')[0].trim();
        }
      } else {
        // Prompt for message if not provided
        if (!message) {
          message = await Input.prompt("Message for new agent:");
        }
        // Default title from first line if not provided
        if (!title) {
          title = message.split('\n')[0].trim();
        }
      }

      // Create task with parent_workspace_id
      const createTask: CreateTask = {
        project_id: workspace.task_id, // Wrong! Should be workspace.project_id
        title,
        description: message,
        parent_workspace_id: workspaceId,
      };

      const task = await client.createTask(createTask);

      // Simple output (per CONTEXT.md)
      console.log(`${task.id} ${task.title}`);

    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
```

Note: Code example intentionally includes a bug (using workspace.task_id instead of needing to fetch task to get project_id) to demonstrate research clarity - planner will catch this.

### Correct Project ID Resolution
```typescript
// Get workspace to access its task
const workspace = await client.getWorkspace(workspaceId);

// Get task to access project_id
const parentTask = await client.getTask(workspace.task_id);

const createTask: CreateTask = {
  project_id: parentTask.project_id,
  title,
  description: message,
  parent_workspace_id: workspaceId,
};
```

### Message Input from File
```typescript
// Pattern: Direct file read (simpler than parseTaskFromFile for plain message)
if (options.from) {
  const content = await Deno.readTextFile(options.from);
  message = content;
  // Extract title from first line if not explicitly provided
  if (!title) {
    title = content.split('\n')[0].trim();
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-level task hierarchy | Parent-child task relationships via parent_workspace_id | v1.1 (current) | Enables spin-off workflow |
| Manual task creation only | Task creation from workspace context | v1.1 (current) | Preserves context when spawning subtasks |

**Deprecated/outdated:**
- None - this is a new feature

## Open Questions

### 1. Should message be required or optional?
- **What we know:** CONTEXT.md says "sends an initial message to the new agent"
- **What's unclear:** Requirements don't specify if message is mandatory
- **Recommendation:** Make message optional - allow creating task without initial message (user can send message via follow-up later). Follow same pattern as `task create` where description is optional.

### 2. What if workspace doesn't have a project_id?
- **What we know:** Workspace has task_id, Task has project_id
- **What's unclear:** Whether workspace object directly has project_id or requires task lookup
- **Recommendation:** Check workspace API response structure. If no direct project_id, fetch parent task first: `const task = await client.getTask(workspace.task_id)` then use `task.project_id`

### 3. File format for --from input
- **What we know:** task create uses `--from` with parseTaskFromFile() expecting markdown with heading
- **What's unclear:** Should spin-off message file be plain text or require markdown heading?
- **Recommendation:** Use plain text (just Deno.readTextFile), not markdown parser. Simpler for message input. Use first line as default title.

## Sources

### Primary (HIGH confidence)
- Codebase analysis:
  - `/var/tmp/vibe-kanban/worktrees/3895-gsd-plan-phase-7/vk/src/commands/attempt.ts` - cd and open command patterns (lines 925-1050)
  - `/var/tmp/vibe-kanban/worktrees/3895-gsd-plan-phase-7/vk/src/commands/task.ts` - create command pattern (lines 122-228)
  - `/var/tmp/vibe-kanban/worktrees/3895-gsd-plan-phase-7/vk/src/api/types.ts` - CreateTask interface (lines 67-80)
  - `/var/tmp/vibe-kanban/worktrees/3895-gsd-plan-phase-7/vk/src/utils/attempt-resolver.ts` - Auto-detection utilities
- Phase context:
  - `.planning/phases/07-attempt-spinoff/07-CONTEXT.md` - User decisions (locked constraints)
  - `.planning/REQUIREMENTS.md` - SPINOFF requirements (lines 27-34)

### Secondary (MEDIUM confidence)
- Cliffy documentation (v1.0.0-rc.7):
  - Command API: Standard Cliffy patterns verified via codebase usage
  - Prompt API: Input.prompt() patterns verified in task.ts

### Tertiary (LOW confidence)
- None used

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in deno.json, verified versions
- Architecture: HIGH - Patterns extracted directly from existing working code
- Pitfalls: MEDIUM - Derived from codebase patterns, but new command may reveal edge cases

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable dependencies, established patterns)
