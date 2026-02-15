# Phase 2: Schema Corrections - Research

**Researched:** 2026-01-31 **Domain:** Multi-Repository Workspace Schema / REST
API Response Handling / CLI Parameter Design **Confidence:** HIGH

## Summary

Phase 2 fixes schema mismatches in the vk CLI for multi-repository workspace
operations. The current implementation of `branch-status` and `pr-comments`
commands assumes single-repository workspaces, but the vibe-kanban API supports
multi-repo workspaces and returns arrays or requires repo-specific parameters.
Three specific issues must be addressed: (1) `branch-status` returns an array of
`RepoBranchStatus[]` but CLI expects a single object, (2) `pr-comments` requires
a `repo_id` query parameter for multi-repo workspaces, and (3) multi-repo git
operations (merge, push, rebase) already support `--repo` flag but
`branch-status` and `pr-comments` don't expose it.

The work spans two technical areas: (1) updating TypeScript types to include
`RepoBranchStatus` and properly handling array responses, and (2) adding
`--repo` flag support to commands that operate on specific repositories. The
existing codebase already has the pattern established in merge/push/rebase
commands with the `getRepoIdForWorkspace()` helper function that auto-detects
single-repo workspaces and prompts for multi-repo cases.

**Primary recommendation:** Follow the established pattern from
merge/push/rebase commands—add optional `--repo` flag with auto-detection for
single-repo workspaces, display results in table format for multi-repo cases,
and filter to single repo when `--repo` is specified.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library         | Version    | Purpose            | Why Standard                                                       |
| --------------- | ---------- | ------------------ | ------------------------------------------------------------------ |
| Deno            | 2.x        | TypeScript runtime | Zero-config TypeScript, built-in tools, security model             |
| @cliffy/command | 1.0.0-rc.7 | CLI framework      | Type-safe arg parsing, subcommands, standard in Deno CLI ecosystem |
| @cliffy/table   | 1.0.0-rc.7 | Formatted output   | Consistent table rendering, used throughout CLI for multi-row data |

### Supporting

| Library     | Version | Purpose         | When to Use                   |
| ----------- | ------- | --------------- | ----------------------------- |
| @std/assert | 1.0.9   | Test assertions | Unit tests, integration tests |

### Alternatives Considered

| Instead of       | Could Use                | Tradeoff                                                        |
| ---------------- | ------------------------ | --------------------------------------------------------------- |
| Table formatting | Manual string formatting | @cliffy/table handles alignment, borders, headers automatically |
| Array handling   | Custom iteration         | Native TypeScript array methods are idiomatic and type-safe     |

**Installation:**

```bash
# Already installed - no new dependencies needed
# See deno.json for version lock
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── api/              # API client layer
│   ├── client.ts     # ApiClient class with methods
│   └── types.ts      # TypeScript interfaces matching API
└── commands/         # CLI commands (one file per command group)
    └── attempt.ts    # Workspace commands (branch-status, pr-comments, etc.)
```

### Pattern 1: Multi-Repo Repository Resolution with Auto-Detection

**What:** Transparently resolve repo ID from workspace, auto-detecting for
single-repo workspaces and prompting for multi-repo cases.

**When to use:** Any command that needs a repo_id but wants to provide good UX
for the common single-repo case.

**Example:**

```typescript
// Source: Existing pattern from attempt.ts lines 321-340

// Helper function to get repo_id with auto-detection for single-repo workspaces
async function getRepoIdForWorkspace(
  client: ApiClient,
  workspaceId: string,
  explicitRepoId?: string,
): Promise<string> {
  if (explicitRepoId) {
    return explicitRepoId;
  }

  const repos = await client.getWorkspaceRepos(workspaceId);
  if (repos.length === 0) {
    throw new Error("Workspace has no repositories");
  }
  if (repos.length === 1) {
    return repos[0].repo_id;
  }
  throw new Error(
    `Workspace has ${repos.length} repositories. Please specify --repo <repo-id>`,
  );
}
```

**Key insight:** This pattern is already established in merge/push/rebase
commands. Reuse it for branch-status and pr-comments.

### Pattern 2: Array Response Handling with Optional Filtering

**What:** Handle API array responses that may contain multiple items, display
all in table format by default, filter to single item when flag is provided.

**When to use:** Commands where API returns array but user may want to see all
items or filter to one.

**Example:**

```typescript
// Pattern for branch-status command

// Get array response from API
const statuses = await client.getBranchStatus(workspaceId);

// If --repo flag provided, filter to single repo
if (options.repo) {
  const filtered = statuses.filter((s) => s.repo_id === options.repo);
  if (filtered.length === 0) {
    throw new Error(`No status found for repo ${options.repo}`);
  }
  // Display single repo status
  displaySingleRepoStatus(filtered[0]);
} else {
  // Display all repos in table
  const table = new Table()
    .header(["Repo", "Ahead", "Behind", "Conflicts"])
    .body(statuses.map((s) => [
      s.repo_name || s.repo_id,
      s.commits_ahead,
      s.commits_behind,
      s.has_uncommitted_changes ? "Yes" : "No",
    ]));
  table.render();
}
```

### Pattern 3: Query Parameter Handling for Multi-Repo Commands

**What:** Pass repo_id as query parameter when required by API, using
auto-detection to provide good UX.

**When to use:** API endpoints that require repo_id parameter for multi-repo
workspaces.

**Example:**

```typescript
// Pattern for pr-comments command

// Resolve repo_id (auto-detect or from --repo flag)
const repoId = await getRepoIdForWorkspace(
  client,
  workspaceId,
  options.repo,
);

// Pass as query parameter
const comments = await client.getPRComments(workspaceId, repoId);
```

### Pattern 4: Type Alignment with API Schema

**What:** Define TypeScript interfaces matching API response schemas exactly,
including array types.

**When to use:** When adding or updating any API entity types, especially for
array responses.

**Example:**

```typescript
// Source: .planning/research/TYPES.md lines 529-551

// Add to types.ts
export interface RepoBranchStatus {
  repo_id: string;
  repo_name: string;
  commits_behind: number;
  commits_ahead: number;
  has_uncommitted_changes: boolean;
  head_oid: string;
  uncommitted_count: number;
  untracked_count: number;
  target_branch_name: string;
  remote_commits_behind: number;
  remote_commits_ahead: number;
  merges: Merge[];
  is_rebase_in_progress: boolean;
  conflict_op: ConflictOp | null;
  conflicted_files: string[];
  is_target_remote: boolean;
}

type ConflictOp = "rebase" | "merge" | "cherry_pick" | "revert";

interface Merge {
  // Define based on API schema
  oid: string;
  message: string;
}
```

### Anti-Patterns to Avoid

- **Hardcoding single-repo assumptions:** Don't assume `array[0]` without
  checking length or handling multi-repo case.
- **Ignoring existing patterns:** The CLI already has `getRepoIdForWorkspace()`
  helper. Don't create a different pattern.
- **Breaking backward compatibility:** Single-repo workspaces are common.
  Commands must work without `--repo` flag for these cases.
- **Silent failures on array responses:** When API returns array but CLI expects
  object, error explicitly rather than accessing undefined properties.
- **Inconsistent flag names:** Use `--repo` (already established in
  merge/push/rebase) not `--repository` or `--repo-id`.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem            | Don't Build              | Use Instead                               | Why                                                         |
| ------------------ | ------------------------ | ----------------------------------------- | ----------------------------------------------------------- |
| Repo ID resolution | Manual repo selection UI | `getRepoIdForWorkspace()` from attempt.ts | Already implemented, tested, consistent with other commands |
| Table display      | String concatenation     | `@cliffy/table`                           | Handles column alignment, headers, borders automatically    |
| Array filtering    | Manual loops             | `.filter()`, `.find()`, `.map()`          | Idiomatic TypeScript, type-safe, readable                   |
| Error messages     | Generic throw            | Descriptive errors with repo count        | Helps users understand multi-repo context                   |

**Key insight:** The codebase already handles multi-repo operations correctly in
merge/push/rebase commands. Extend the same pattern to branch-status and
pr-comments rather than inventing new approaches.

## Common Pitfalls

### Pitfall 1: Assuming Single Repository Per Workspace

**What goes wrong:** Code crashes with "Cannot read property 'ahead' of
undefined" when accessing array response as object.

**Why it happens:** Mental model treats workspaces as single-repo, but API
supports multi-repo and returns arrays.

**How to avoid:**

1. Always check if response is array or object
2. Update TypeScript types to reflect API schema (array not object)
3. Handle both single-repo and multi-repo cases explicitly

**Warning signs:**

- Accessing `status.ahead` directly when `status` is actually `status[0]`
- Type errors about "Property does not exist on type array"

### Pitfall 2: Missing repo_id Parameter on PR Comments

**What goes wrong:** API returns 400 error or wrong comments when `repo_id`
parameter is missing for multi-repo workspaces.

**Why it happens:** API requires `repo_id` to identify which repository's PR to
fetch comments from.

**How to avoid:**

1. Add `repo_id` parameter to `getPRComments()` API client method
2. Use `getRepoIdForWorkspace()` to auto-detect for single-repo case
3. Require `--repo` flag for multi-repo workspaces (error if not provided)

**Warning signs:**

- 400 Bad Request errors on pr-comments for multi-repo workspaces
- Getting comments from wrong repository

### Pitfall 3: Inconsistent Multi-Repo Flag Behavior

**What goes wrong:** User confusion when `merge` has `--repo` flag but
`branch-status` doesn't, or when flags work differently across commands.

**Why it happens:** Implementing commands independently without following
established patterns.

**How to avoid:**

1. Use exact same `--repo` flag name and description across all multi-repo
   commands
2. Use same auto-detection logic (single-repo works without flag)
3. Use same error message format for multi-repo cases

**Warning signs:**

- User asks "why does merge need --repo but branch-status doesn't?"
- Different error messages for same scenario across commands

### Pitfall 4: Poor UX for Common Case (Single-Repo)

**What goes wrong:** Users with single-repo workspaces (majority) forced to
always specify `--repo` flag.

**Why it happens:** Implementing multi-repo support without considering
single-repo convenience.

**How to avoid:**

1. Auto-detect repo_id when workspace has exactly one repository
2. Only require `--repo` flag when workspace has multiple repos
3. Provide clear error message explaining multi-repo situation

**Warning signs:**

- Every command example requires `--repo` flag
- User complaints about "too verbose" commands

### Pitfall 5: Inadequate Display for Multi-Repo Results

**What goes wrong:** Multi-repo branch status displays only first repo or shows
confusing single-line output.

**Why it happens:** Not adapting display format for array responses.

**How to avoid:**

1. Use table format when displaying multiple items
2. Include repo name/ID in table for clarity
3. When `--repo` specified, show detailed single-repo view

**Warning signs:**

- Output doesn't show which repo the status is for
- User can't distinguish between repos in output

## Code Examples

Verified patterns from official sources:

### RepoBranchStatus Type Definition

```typescript
// Source: .planning/research/TYPES.md lines 529-551
// Add to: src/api/types.ts

export interface RepoBranchStatus {
  repo_id: string;
  repo_name: string;
  commits_behind: number;
  commits_ahead: number;
  has_uncommitted_changes: boolean;
  head_oid: string;
  uncommitted_count: number;
  untracked_count: number;
  target_branch_name: string;
  remote_commits_behind: number;
  remote_commits_ahead: number;
  merges: Merge[];
  is_rebase_in_progress: boolean;
  conflict_op: ConflictOp | null;
  conflicted_files: string[];
  is_target_remote: boolean;
}

export type ConflictOp = "rebase" | "merge" | "cherry_pick" | "revert";

export interface Merge {
  oid: string;
  message: string;
}

// Note: Keep legacy BranchStatus for backward compatibility
// But deprecate in favor of RepoBranchStatus
export interface BranchStatus {
  ahead: number;
  behind: number;
  has_conflicts: boolean;
}
```

### Updated API Client Method - getBranchStatus

```typescript
// Source: Pattern from client.ts lines 269-271
// Update in: src/api/client.ts

// OLD (single object):
getBranchStatus(id: string): Promise<BranchStatus> {
  return this.request<BranchStatus>(`/task-attempts/${id}/branch-status`);
}

// NEW (array of repo statuses):
getBranchStatus(id: string): Promise<RepoBranchStatus[]> {
  return this.request<RepoBranchStatus[]>(`/task-attempts/${id}/branch-status`);
}
```

### Updated API Client Method - getPRComments

```typescript
// Source: Pattern from client.ts lines 297-299
// Update in: src/api/client.ts

// OLD (no repo_id parameter):
getPRComments(id: string): Promise<UnifiedPRComment[]> {
  return this.request<UnifiedPRComment[]>(`/task-attempts/${id}/pr/comments`);
}

// NEW (with required repo_id parameter):
getPRComments(id: string, repoId: string): Promise<UnifiedPRComment[]> {
  return this.request<UnifiedPRComment[]>(
    `/task-attempts/${id}/pr/comments?repo_id=${repoId}`
  );
}
```

### Updated branch-status Command

```typescript
// Source: Pattern from attempt.ts lines 540-572
// Update in: src/commands/attempt.ts

attemptCommand
  .command("branch-status")
  .description("Show branch status for a workspace")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option(
    "--repo <id:string>",
    "Repository ID (auto-detected if workspace has only one repo)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const statuses = await client.getBranchStatus(workspaceId);

      if (options.json) {
        console.log(JSON.stringify(statuses, null, 2));
        return;
      }

      // If --repo flag provided, filter to single repo
      if (options.repo) {
        const filtered = statuses.find((s) => s.repo_id === options.repo);
        if (!filtered) {
          throw new Error(`No status found for repo ${options.repo}`);
        }
        // Display detailed single-repo status
        console.log(
          `Repo:                ${filtered.repo_name || filtered.repo_id}`,
        );
        console.log(`Target Branch:       ${filtered.target_branch_name}`);
        console.log(`Ahead:               ${filtered.commits_ahead} commits`);
        console.log(`Behind:              ${filtered.commits_behind} commits`);
        console.log(
          `Remote Ahead:        ${filtered.remote_commits_ahead} commits`,
        );
        console.log(
          `Remote Behind:       ${filtered.remote_commits_behind} commits`,
        );
        console.log(`Uncommitted:         ${filtered.uncommitted_count} files`);
        console.log(`Untracked:           ${filtered.untracked_count} files`);
        console.log(
          `Has Changes:         ${
            filtered.has_uncommitted_changes ? "Yes" : "No"
          }`,
        );
        console.log(
          `Rebase In Progress:  ${
            filtered.is_rebase_in_progress ? "Yes" : "No"
          }`,
        );
        if (filtered.conflict_op) {
          console.log(`Conflict Operation:  ${filtered.conflict_op}`);
          console.log(
            `Conflicted Files:    ${filtered.conflicted_files.length}`,
          );
        }
      } else {
        // Display all repos in table format
        if (statuses.length === 0) {
          console.log("No repositories found.");
          return;
        }

        const table = new Table()
          .header([
            "Repo",
            "Target Branch",
            "Ahead",
            "Behind",
            "Changes",
            "Conflicts",
          ])
          .body(statuses.map((s) => [
            s.repo_name || s.repo_id,
            s.target_branch_name,
            s.commits_ahead.toString(),
            s.commits_behind.toString(),
            s.has_uncommitted_changes ? "Yes" : "No",
            s.conflict_op ? s.conflicted_files.length.toString() : "-",
          ]));

        table.render();

        if (statuses.length > 1) {
          console.log(
            `\nTip: Use --repo <id> to see detailed status for a specific repository`,
          );
        }
      }
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
```

### Updated pr-comments Command

```typescript
// Source: Pattern from attempt.ts lines 753-800
// Update in: src/commands/attempt.ts

attemptCommand
  .command("pr-comments")
  .description("View comments on the PR associated with a workspace")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option(
    "--repo <id:string>",
    "Repository ID (auto-detected if workspace has only one repo)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      // Resolve repo_id (auto-detect for single-repo, require flag for multi-repo)
      const repoId = await getRepoIdForWorkspace(
        client,
        workspaceId,
        options.repo,
      );

      const comments = await client.getPRComments(workspaceId, repoId);

      if (options.json) {
        console.log(JSON.stringify(comments, null, 2));
        return;
      }

      if (comments.length === 0) {
        console.log("No comments found.");
        return;
      }

      for (const comment of comments) {
        console.log("---");
        console.log(`Author: ${comment.user}`);
        console.log(`Type:   ${comment.comment_type}`);
        console.log(`Date:   ${comment.created_at}`);
        if (comment.path) {
          console.log(
            `File:   ${comment.path}${comment.line ? `:${comment.line}` : ""}`,
          );
        }
        console.log(`\n${comment.body}\n`);
      }
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
```

### Consistent --repo Flag Usage Pattern

```typescript
// Pattern used across merge, push, rebase, branch-status, pr-comments

.option(
  "--repo <id:string>",
  "Repository ID (auto-detected if workspace has only one repo)",
)
```

## State of the Art

| Old Approach             | Current Approach                         | When Changed     | Impact                                       |
| ------------------------ | ---------------------------------------- | ---------------- | -------------------------------------------- |
| Single-repo commands     | Multi-repo awareness with auto-detection | API v1.0+ (2025) | Commands must handle array responses         |
| `BranchStatus` object    | `RepoBranchStatus[]` array               | API v1.0+ (2025) | Response type changed from object to array   |
| PR comments without repo | PR comments require `repo_id`            | API v1.0+ (2025) | Query parameter now required                 |
| Implicit single repo     | Explicit repo selection for multi-repo   | API v1.0+ (2025) | Need `--repo` flag for multi-repo workspaces |

**Deprecated/outdated:**

- `BranchStatus` single object response: Now returns array of
  `RepoBranchStatus[]`
- PR comments without `repo_id` parameter: Now requires `?repo_id=` query param
- Assuming workspace has single repository: Workspaces can now have multiple
  repos

## Open Questions

Things that couldn't be fully resolved:

1. **RepoBranchStatus Merge Field Structure**
   - What we know: `merges: Merge[]` field exists in RepoBranchStatus
   - What's unclear: What is the exact structure of the Merge type?
   - Recommendation: Add basic `Merge` interface with `oid` and `message`
     fields. Expand if needed based on actual API responses.

2. **Backward Compatibility for BranchStatus Type**
   - What we know: API now returns `RepoBranchStatus[]` instead of
     `BranchStatus`
   - What's unclear: Should we keep `BranchStatus` type for backward
     compatibility or remove it?
   - Recommendation: Keep `BranchStatus` type but mark as deprecated, add
     comment pointing to `RepoBranchStatus`. This helps if any external code
     depends on the old type.

3. **Multi-Repo Display Format**
   - What we know: Table format works well for multiple repos
   - What's unclear: For single-repo workspaces, should we show table or
     detailed view?
   - Recommendation: For single-repo, show detailed view (like current
     behavior). For multi-repo without `--repo` flag, show table. With `--repo`
     flag, show detailed view.

4. **Repo Name vs Repo ID in Display**
   - What we know: `RepoBranchStatus` has both `repo_id` and `repo_name`
   - What's unclear: Is `repo_name` always populated or can it be null?
   - Recommendation: Display `repo_name` if present, fall back to `repo_id`.
     Pattern: `s.repo_name || s.repo_id`

## Sources

### Primary (HIGH confidence)

- .planning/research/ENDPOINTS.md - API endpoint specifications and schema
  differences
- .planning/research/TYPES.md - Type definitions and RepoBranchStatus structure
- .planning/research/COMMANDS.md - Command requirements and patterns
- .planning/REQUIREMENTS.md - Phase 2 requirements (SCHM-01, SCHM-02, SCHM-03,
  TYPE-01)
- src/commands/attempt.ts - Existing implementation of merge/push/rebase with
  --repo flag
- src/api/types.ts - Current type definitions

### Secondary (MEDIUM confidence)

- .planning/research/SUMMARY.md - Overall API alignment summary
- .planning/ROADMAP.md - Phase 2 context and dependencies

### Tertiary (LOW confidence)

- Merge type structure (inferred from RepoBranchStatus type, needs API
  validation)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - No new dependencies, using existing @cliffy/table and
  Deno
- Architecture patterns: HIGH - Extracted from existing working code
  (merge/push/rebase)
- RepoBranchStatus type fields: HIGH - Verified from TYPES.md research document
- Multi-repo display UX: MEDIUM - Design decision based on established patterns,
  needs user feedback
- Merge type structure: LOW - Inferred, needs API response validation

**Research date:** 2026-01-31 **Valid until:** 2026-03-02 (30 days - stable API,
unlikely to change)
