# Codebase Concerns

**Analysis Date:** 2026-01-30

## Tech Debt

**N-+1 API Calls in Project Resolution:**

- Issue: `resolveProjectFromGit()` in `src/utils/project-resolver.ts` fetches
  repositories for every project in a loop to match the current git basename.
  For a workspace with 100 projects, this results in 100+ API calls.
- Files: `src/utils/project-resolver.ts:74-88`
- Impact: Slow project resolution, excessive API load, poor user experience when
  many projects exist
- Fix approach: Cache project-to-repository mappings locally, batch fetch
  repository data where possible, or request backend to support filtering
  projects by repository basename

**Inefficient Client-Side Workspace Filtering:**

- Issue: `searchWorkspacesByBranch()` in `src/api/client.ts:191-196` fetches ALL
  workspaces then filters on the client side because the API doesn't support
  branch filtering
- Files: `src/api/client.ts:191-196`, `src/utils/attempt-resolver.ts:24`
- Impact: Scales poorly with number of workspaces; loads entire workspace
  dataset into memory
- Fix approach: Request API support for filtering workspaces by branch name;
  implement pagination for workspace queries

**Generic Error Handler Catches and Rethrows:**

- Issue: `withErrorHandling()` in `src/utils/error-handler.ts:35-46` catches
  errors, handles them, then rethrows the same error
- Files: `src/utils/error-handler.ts:35-46`
- Impact: Unreachable code after `handleCliError()` call since it always exits;
  misleading error handling flow
- Fix approach: Remove the rethrow or refactor to separate error handling from
  CLI exit logic

## Known Bugs

**Error Handler Unreachable Code:**

- Symptoms: Line 44 in `src/utils/error-handler.ts` is unreachable because
  `handleCliError()` calls `Deno.exit(1)` before returning
- Files: `src/utils/error-handler.ts:13-46`
- Trigger: Any error in a `withErrorHandling()` wrapped function
- Workaround: Currently the code works because `handleCliError()` exits the
  process, but it's semantically incorrect

**JSON Parse Without Validation:**

- Symptoms: Malformed JSON response from API could crash the CLI with unhelpful
  error message
- Files: `src/api/client.ts:85`, `src/api/config.ts:19`
- Trigger: Receive invalid JSON from API or corrupted config file
- Workaround: None; would result in parse error and exit

## Security Considerations

**Config File Permissions Not Set:**

- Risk: Configuration file containing API URL stored in
  `~/.config/vibe-kanban/vk-config.json` with default file permissions (may be
  world-readable depending on umask)
- Files: `src/api/config.ts:40-46`
- Current mitigation: None; API URL is not sensitive but pattern is bad practice
- Recommendations: Set explicit file permissions (0600) when writing config
  file; document that users should not store sensitive credentials in config

**No SSL Certificate Validation Control:**

- Risk: If user points CLI to HTTPS endpoint, there's no way to
  disable/customize certificate validation for testing/self-signed certs
- Files: `src/api/client.ts:62-68` (fetch configuration)
- Current mitigation: None in CLI; depends on Deno/TLS runtime defaults
- Recommendations: Add `--insecure` or `--ca-cert` option for development;
  document security implications

**Verbose Flag Logs All Request/Response Bodies:**

- Risk: `--verbose` flag logs full API request/response bodies including
  potentially sensitive data
- Files: `src/api/client.ts:54-79`, `src/utils/verbose.ts`
- Current mitigation: None; opt-in but no warnings
- Recommendations: Add warning in help text; filter sensitive fields (auth
  headers, user data) from verbose output

## Performance Bottlenecks

**Synchronous Directory Creation:**

- Problem: `Deno.mkdir()` for config directory is sequential and not critical
  path
- Files: `src/api/config.ts:40`
- Cause: Single-threaded, blocks until completion
- Improvement path: Non-critical; consider pre-creating config directory on
  first run to avoid repeated checks

**Multiple Sequential Project/Task Lookups:**

- Problem: Commands that auto-detect project→task→workspace make multiple
  sequential API calls
- Files: `src/commands/task.ts:87-95`, `src/commands/attempt.ts:103-110`
- Cause: Each resolution step waits for previous to complete
- Improvement path: Parallelize where possible; implement project/task caching
  at CLI session level

## Fragile Areas

**Repository Path Resolution:**

- Files: `src/utils/repository-resolver.ts:75-146`
- Why fragile: Tries three different strategies (git URL, path matching, fzf)
  with silent fallbacks; git commands can fail unpredictably; path comparisons
  are string-based and sensitive to symlinks/relative paths
- Safe modification: Add detailed logging when switching strategies; add tests
  for edge cases (symlinks, relative paths, missing remote); consider storing
  repository metadata to avoid repeated git lookups
- Test coverage: `tests/repository_resolver_integration_test.ts` exists but may
  not cover all edge cases like detached HEAD or missing remotes

**Project Resolution with Multiple Repositories:**

- Files: `src/utils/project-resolver.ts:70-88`
- Why fragile: Silently skips projects where repo list fails; uses first match
  when multiple projects match the same repository basename; console.error
  warning may be missed
- Safe modification: Fail fast on API errors instead of silently continuing;
  prompt user when ambiguous instead of warning; add test coverage for
  multiple-match scenarios
- Test coverage: `tests/project_resolver_integration_test.ts` exists but lacks
  coverage for failure cases and multiple matches

**Filter Application with Flexible Typing:**

- Files: `src/utils/filter.ts:8-31`
- Why fragile: Uses `deno-lint-ignore no-explicit-any` and
  `Record<string, any>`; no validation of filter key/value types; assumes object
  properties exist and match types
- Safe modification: Add type-safe filter builders; validate filter keys against
  model schema; add runtime type checking; test with malformed filter objects
- Test coverage: `src/utils/filter_test.ts` and integration tests exist

## Scaling Limits

**API Client Doesn't Implement Pagination:**

- Current capacity: All list endpoints return entire result set; works fine up
  to hundreds of items
- Limit: Would fail or OOM with thousands of projects/tasks/workspaces
- Scaling path: Implement cursor-based or offset/limit pagination; update list
  commands to support `--limit` and `--offset`; cache results

**No Rate Limiting or Retry Logic:**

- Current capacity: Single requests processed immediately
- Limit: Network hiccup or temporary API unavailability causes immediate failure
- Scaling path: Implement exponential backoff retry for transient failures; add
  configurable rate limiting; document retry behavior

**String-Based Git Operations Without Error Recovery:**

- Current capacity: Works for normal git repositories
- Limit: If git command hangs or returns unexpected output, CLI hangs or crashes
- Scaling path: Add timeouts to all `Deno.Command` git calls; implement fallback
  strategies; validate git output format

## Dependencies at Risk

**Cliffy CLI Framework (RC Stage):**

- Risk: Using `@cliffy/command@1.0.0-rc.7` which is release candidate, not
  stable
- Impact: Minor breaking changes possible in final release; missing features or
  bugs in RC version
- Migration plan: Track Cliffy releases; plan migration to 1.0.0+ stable when
  released; consider locking to specific version if RC proves unstable

**Deno as Runtime (v2.x):**

- Risk: Deno 2.x is relatively new; no guarantee of long-term stability or
  Node.js compatibility
- Impact: Breaking changes in future Deno releases; limited ecosystem compared
  to Node
- Migration plan: Stay current with Deno releases; monitor deprecation warnings;
  document minimum Deno version requirement

## Missing Critical Features

**No Offline Support:**

- Problem: All commands require live API connection; no caching, no offline
  browsing of past results
- Blocks: Using CLI in disconnected environments; offline task planning

**No Configuration for Sensitive Fields:**

- Problem: No way to set or rotate API authentication tokens via CLI if backend
  supports it
- Blocks: Multi-user environments; credential rotation workflows

**No Shell Integration for Branch Context:**

- Problem: Despite auto-detection from git branch, no shell integration to set
  prompt/aliases based on current task/workspace
- Blocks: Enhanced developer workflow; quick context switching

## Test Coverage Gaps

**Attempt Auto-Detection Logic:**

- What's not tested: Error paths in `getAttemptIdWithAutoDetect()` when
  workspace resolution fails; interaction between branch-based detection and
  interactive selection
- Files: `src/utils/attempt-resolver.ts`, `tests/` (no dedicated test file)
- Risk: Silent failures if workspace resolution breaks; difficult to debug in
  production
- Priority: High

**Command Error Handling:**

- What's not tested: Error handling in command actions (try-catch blocks);
  behavior when API calls fail; interaction with `handleCliError()`
- Files: `src/commands/*.ts` (all commands), `src/utils/error-handler.ts`
- Risk: Uncaught exceptions in command execution; poor error messages to users;
  unexpected exit codes
- Priority: High

**Repository Resolver Error Paths:**

- What's not tested: Failures in `listProjectRepos()` calls; behavior when git
  commands fail; path matching with edge cases (symlinks, relative paths)
- Files: `src/utils/repository-resolver.ts`,
  `tests/repository_resolver_integration_test.ts` (incomplete)
- Risk: Silent errors; poor fallback behavior; unexpected fzf prompts
- Priority: Medium

**API Client Verbose Logging:**

- What's not tested: Verbose output with various response types (errors, empty
  bodies, large payloads); integration with error logging
- Files: `src/api/client.ts:54-79`, no test coverage
- Risk: Verbose mode could crash on certain responses or log sensitive data
- Priority: Medium

**Filter Integration with All Models:**

- What's not tested: Filter behavior with all model types (projects, tasks,
  workspaces, repos); edge cases like missing fields, null values, type coercion
- Files: `src/utils/filter.ts`, `src/utils/filter_test.ts` (basic tests only)
- Risk: Filters silently skip items or produce wrong results
- Priority: Medium

---

_Concerns audit: 2026-01-30_
