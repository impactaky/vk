# Codebase Concerns

**Analysis Date:** 2026-01-30

## Tech Debt

**Cliffy Type System Workaround:**
- Issue: Using `no-explicit-any` linter ignore to work around Cliffy's complex generic types
- Files: `src/utils/ai-help.ts`
- Impact: Reduces type safety for command introspection; makes generic parameter extraction brittle
- Fix approach: Either update to a newer Cliffy version with better types, or create a type-safe wrapper around Command introspection

**Workspace Search Client-Side Filtering:**
- Issue: `searchWorkspacesByBranch()` in `src/api/client.ts` fetches all workspaces and filters client-side instead of using API filtering
- Files: `src/api/client.ts` (line 191-196), used by `src/utils/attempt-resolver.ts`
- Impact: Performance degrades as workspace count grows; unnecessary bandwidth for filtering branch name
- Fix approach: Update API client to request filtered results from backend endpoint if available; implement pagination for large datasets

**Warning Suppression without Context:**
- Issue: Empty catch blocks with continue statements in project resolution loop
- Files: `src/utils/project-resolver.ts` (line 84-87)
- Impact: Silent failures when fetching repository lists for projects; makes debugging difficult
- Fix approach: Log skipped projects or raise specific error types instead of silently continuing

## Known Bugs

**Multiple Project Match Warning Issue:**
- Symptoms: Warning printed to stderr when multiple projects match current repository
- Files: `src/utils/project-resolver.ts` (line 98-102)
- Trigger: Working in a repository that's registered in multiple projects
- Workaround: Use explicit `--project` flag to bypass auto-detection
- Fix approach: Implement smarter matching strategy (e.g., by namespace or store user preference)

**Repository Resolver Warning Duplication:**
- Symptoms: Similar warning for multiple repository matches
- Files: `src/utils/repository-resolver.ts` (line 121-125)
- Trigger: Same repository registered multiple times with different paths or names
- Workaround: Use explicit `--repo` flag
- Fix approach: Implement preference storage or better deduplication logic

## Security Considerations

**API Response Parsing Without Validation:**
- Risk: `JSON.parse()` on API responses with minimal validation; could fail silently if API returns unexpected format
- Files: `src/api/client.ts` (line 85-88)
- Current mitigation: Basic success flag check; error thrown if `success` is false
- Recommendations:
  - Add schema validation (e.g., using Zod or equivalent) for API responses
  - Add detailed error context including response structure for debugging
  - Log unparseable responses before throwing

**Environment Variable Overrides Without Validation:**
- Risk: `VK_API_URL` env var directly used without URL validation
- Files: `src/api/config.ts` (line 27-30)
- Current mitigation: None; assumes valid URL
- Recommendations:
  - Validate URL format and protocol (must be HTTPS in production)
  - Add warning if connecting to non-localhost HTTP endpoint
  - Validate baseUrl in ApiClient constructor

**Shell Command Execution (git, fzf):**
- Risk: Deno.Command spawns `git` and `fzf` without explicit argument validation
- Files: `src/utils/git.ts`, `src/utils/fzf.ts`
- Current mitigation: Commands use fixed arguments; no user input in command args
- Recommendations:
  - Document which commands are spawned and why
  - Add timeout to fzf and git operations to prevent hanging

## Performance Bottlenecks

**Repository Basename Lookup with Promise.all:**
- Problem: `resolveRepositoryFromPath()` makes parallel API calls to get git remote for all registered repositories
- Files: `src/utils/repository-resolver.ts` (line 89-102)
- Cause: Fetches git remote URL from each repo path sequentially in Promise.all; each call spawns a subprocess
- Improvement path:
  - Cache repo basenames at startup instead of computing per-command
  - Add timeout to git subprocess calls
  - Implement caching strategy with TTL for git metadata

**Workspace-to-Task Resolution Waterfall:**
- Problem: `getAttemptIdWithAutoDetect()` chains multiple API calls and user prompts
- Files: `src/utils/attempt-resolver.ts` (line 53-74)
- Cause: Tries workspace resolution, then interactive task selection, then workspace listing
- Improvement path: Cache task/workspace relationships; reduce round-trips

**Attempt Command Size:**
- Problem: `attempt.ts` is 767 lines with many similar command implementations
- Files: `src/commands/attempt.ts`
- Cause: Repetitive CLI command boilerplate for each operation (merge, push, rebase, etc.)
- Improvement path: Extract common patterns into command factory; reduce duplication

## Fragile Areas

**FZF Dependency Chain:**
- Files: `src/utils/fzf.ts`, `src/utils/project-resolver.ts`, `src/utils/attempt-resolver.ts`
- Why fragile:
  - fzf not installed results in cascading errors across multiple resolution paths
  - Fallback logic could mask incomplete configurations
  - Users may not understand why selection fails without clear error message
- Safe modification: Update error messages to include installation link; add --no-interactive flag across all commands
- Test coverage: FzfNotInstalledError is tested but integration scenarios with cascading failures are not

**Workspace Search by Branch:**
- Files: `src/api/client.ts` (line 191-196), `src/utils/attempt-resolver.ts` (line 15-29)
- Why fragile: Assumes single workspace per branch; fetching all then filtering client-side creates race conditions if workspaces are created during operation
- Safe modification: Add timeout to workspace list operations; add workspace count validation
- Test coverage: No tests for behavior with large workspace counts or concurrent operations

**Error Handler Exit Pattern:**
- Files: `src/utils/error-handler.ts` (line 35-46)
- Why fragile: `withErrorHandling` always throws after calling `handleCliError`, making return type misleading; unused in most code
- Safe modification: Remove `withErrorHandling` or refactor to actually return/recover in some cases
- Test coverage: Function exists but is not used by command handlers

## Scaling Limits

**In-Memory Repository List:**
- Current capacity: Works with hundreds of repositories; degrades when listing/filtering thousands
- Limit: Client-side filtering with no pagination; all repos loaded in memory
- Scaling path: Implement server-side filtering and pagination in API client

**Workspace Search:**
- Current capacity: Reasonable up to thousands of workspaces
- Limit: `searchWorkspacesByBranch()` fetches all workspaces for branch matching; scales O(n)
- Scaling path: Use backend-side filtering once API supports it

**FZF Selection Performance:**
- Current capacity: Works smoothly with ~500 items
- Limit: Passing large item lists via stdin to fzf; affects rendering performance
- Scaling path: Implement search query pre-filtering before passing to fzf

## Dependencies at Risk

**Cliffy Version Lock:**
- Risk: Tight coupling to Cliffy's current API for command introspection (see Tech Debt)
- Impact: Major version updates require rewriting ai-help.ts and error handling
- Migration plan: Monitor Cliffy releases; consider pinning minor version; evaluate alternatives like deno-cliffy forks

**OpenSrc deno-open:**
- Risk: Unmaintained dependency; opens URLs with system defaults (no fallback)
- Impact: Task open command fails silently if no browser available
- Migration plan: Evaluate Deno standard library alternatives or implement manual URL printing

## Missing Critical Features

**Retry Logic:**
- Problem: No retry mechanism for network failures; single failed API call aborts operation
- Blocks: Reliable CLI operation in unstable networks; CI/CD integration
- Recommendation: Implement exponential backoff with configurable retries for API calls

**Timeout Configuration:**
- Problem: Git and fzf subprocess calls have no timeout; can hang indefinitely
- Blocks: Reliable automated usage; wrapper scripts
- Recommendation: Add --timeout flag and implement global timeout defaults

**Offline Mode:**
- Problem: No caching mechanism; all operations require API connectivity
- Blocks: Viewing cached data when network unavailable
- Recommendation: Implement optional caching layer with TTL

**Transaction Rollback:**
- Problem: Multi-step operations (create task + create workspace) have no rollback if second step fails
- Blocks: Clean recovery from partial failures
- Recommendation: Add --dry-run preview mode; implement rollback helpers

## Test Coverage Gaps

**API Client Error Handling:**
- What's not tested: How client handles various HTTP status codes (4xx, 5xx), malformed JSON responses, timeout scenarios
- Files: `tests/api_client_test.ts`
- Risk: API contract violations silently fail or crash unexpectedly
- Priority: High

**Resolution Fallback Chains:**
- What's not tested: Behavior when multiple resolution strategies fail in sequence (e.g., git fails, no projects exist, fzf not installed)
- Files: `src/utils/project-resolver.ts`, `src/utils/attempt-resolver.ts`, `tests/project_resolver_integration_test.ts`
- Risk: Confusing cascading error messages; incorrect fallback selection
- Priority: High

**Workspace Auto-Detection Edge Cases:**
- What's not tested: Branch name extraction when workspace is deleted, when multiple workspaces on same branch, when on detached HEAD
- Files: `src/utils/attempt-resolver.ts`, `src/utils/git.ts`
- Risk: Commands fail mysteriously or select wrong workspace
- Priority: Medium

**Filter Matching Logic:**
- What's not tested: Partial string matches, case sensitivity, special characters in filter values
- Files: `src/utils/filter.ts`, `tests/filter_integration_test.ts`
- Risk: Users surprised by filter behavior; queries that should work don't
- Priority: Medium

**Repository Resolver Path Matching:**
- What's not tested: Symlink handling, Windows path separators, relative path handling
- Files: `src/utils/repository-resolver.ts`
- Risk: Resolver fails on non-standard paths or symlinked repositories
- Priority: Medium

---

*Concerns audit: 2026-01-30*
