# Codebase Concerns

**Analysis Date:** 2026-03-19

## Tech Debt

**Workspace command implementation is monolithic:**
- Issue: The workspace CLI surface is implemented in one large file with repeated command patterns, argument validation, output formatting, and API wiring.
- Files: `src/commands/task-attempts.ts`
- Impact: Small changes to one workspace subcommand risk regressions in others, review scope stays large, and targeted unit testing is harder than it needs to be.
- Fix approach: Split `src/commands/task-attempts.ts` into subcommand modules such as create/update/pr/repo operations, then extract shared helpers for prompt resolution, JSON-vs-table output, and common option validation.

**Error handling exits from utility code instead of command boundaries:**
- Issue: `handleCliError` calls `Deno.exit(1)` directly, and command handlers also rethrow after invoking it.
- Files: `src/utils/error-handler.ts`, `src/commands/task-attempts.ts`, `src/commands/repository.ts`, `src/commands/organization.ts`, `src/commands/config.ts`, `src/commands/notify.ts`, `src/commands/wait.ts`
- Impact: Control flow is harder to test and reuse, and future non-CLI consumers cannot share the same helpers safely.
- Fix approach: Return typed errors from utilities and centralize process exit handling in `src/main.ts` or a command wrapper.

**Legacy API compatibility is embedded ad hoc:**
- Issue: Workspace endpoints use fallback logic between `/task-attempts` and `/workspaces`, but the compatibility strategy is only partially centralized and only lightly tested.
- Files: `src/api/client.ts`, `tests/api_client_test.ts`
- Impact: API evolution can create subtle breakage where some commands keep working and others drift, especially if more workspace endpoints rename independently.
- Fix approach: Define endpoint compatibility in one mapping layer in `src/api/client.ts` and add explicit tests for every fallback-backed route, not just `listWorkspaces`.

## Known Bugs

**Workspace auto-detection can pick the wrong workspace when branches collide:**
- Symptoms: Commands without an explicit workspace ID can operate on the first workspace returned for a branch name, even if multiple workspaces share that branch.
- Files: `src/utils/attempt-resolver.ts`, `src/api/client.ts`
- Trigger: Running commands like `vk workspace show`, `update`, `repos`, `branch-status`, or `stop` from a repository whose current branch matches more than one workspace on the server.
- Workaround: Pass the workspace ID explicitly instead of relying on branch auto-detection.

**Repository auto-detection can silently choose the first basename match:**
- Symptoms: Repository resolution warns on stderr and proceeds with the first match when multiple registered repos share the same basename and no path match is available.
- Files: `src/utils/repository-resolver.ts`
- Trigger: Running repo-dependent commands from a directory whose git remote basename matches multiple registered repositories across machines or clones.
- Workaround: Pass `--repo <id>` explicitly.

## Security Considerations

**Verbose mode logs full request and response bodies:**
- Risk: Prompts, PR metadata, API error bodies, and any server-returned sensitive text are emitted to stderr when `--verbose` is used.
- Files: `src/api/client.ts`, `src/utils/verbose.ts`
- Current mitigation: Logging is opt-in via `-v` or `--verbose`.
- Recommendations: Redact known sensitive fields before logging, cap body size, and avoid printing full response bodies for non-debug-safe endpoints.

**Config and API responses are trusted without schema validation:**
- Risk: Malformed local config JSON or unexpected API payload shapes can cause runtime failures or incorrect fallback behavior after deploys.
- Files: `src/api/config.ts`, `src/api/client.ts`, `src/api/types.ts`
- Current mitigation: TypeScript types document expected shapes, and some methods normalize alternate response wrappers.
- Recommendations: Add runtime validation for config reads and critical API responses before using parsed data.

## Performance Bottlenecks

**Workspace lookup scans the full workspace list client-side:**
- Problem: `searchWorkspacesByBranch` fetches every workspace and filters in memory for branch matching.
- Files: `src/api/client.ts`, `src/utils/attempt-resolver.ts`
- Cause: The client assumes the API cannot filter by branch.
- Improvement path: Add a server-side branch filter or a dedicated lookup endpoint and update auto-detection to use that narrower query.

**Repository auto-detection fans out git commands across every registered repo:**
- Problem: Resolving a repo from the current path can invoke git remote inspection for all registered repos.
- Files: `src/utils/repository-resolver.ts`, `src/utils/git.ts`
- Cause: The preferred basename strategy uses `Promise.all` over every repo before falling back to path matching.
- Improvement path: Check direct path matches first for local usage, cache basename metadata, or fetch remote metadata lazily.

## Fragile Areas

**Integration tests depend on shared external state and often self-skip:**
- Files: `tests/task_attempts_integration_test.ts`, `tests/organization_integration_test.ts`, `tests/helpers/test-server.ts`
- Why fragile: Many tests return early on `401`, missing repos, missing workspaces, absent git, or API `500` responses, which turns environment problems into passing test runs instead of actionable failures.
- Safe modification: Keep CLI behavior changes paired with deterministic fixtures or a dedicated seeded test server instead of relying on whatever data the external environment exposes.
- Test coverage: The suite is broad, but confidence is lower than the test count suggests because many scenarios are conditional.

**Repository resolver tests mutate global server data:**
- Files: `tests/repository_resolver_integration_test.ts`
- Why fragile: One test deletes all existing repos from the server and then attempts best-effort restoration, which can interfere with concurrent runs and can leave the environment partially restored if re-registration fails.
- Safe modification: Replace destructive global setup with isolated fixture repos and server-side namespacing for test-owned data.
- Test coverage: Core path matching is covered, but isolation guarantees are weak.

**Interactive fallback paths rely on local tools and environment shape:**
- Files: `src/utils/fzf.ts`, `src/utils/repository-resolver.ts`, `src/utils/attempt-resolver.ts`
- Why fragile: Behavior changes depending on whether `fzf`, git metadata, current branch context, and local repo paths are available.
- Safe modification: Preserve explicit-ID code paths, keep dependency injection in resolver tests, and add non-interactive fallback behavior before expanding CLI workflows.
- Test coverage: Formatter and resolver branches are tested, but full interactive flows are not exercised end-to-end.

## Scaling Limits

**CLI responsiveness degrades as server-side workspace and repo counts grow:**
- Current capacity: The current implementation assumes repo and workspace lists are small enough to fetch entirely and search locally.
- Limit: Large installations will make auto-detection and interactive selection slower because commands request full collections before acting.
- Scaling path: Add filtered/paginated API endpoints and update CLI resolvers to request only the relevant records.

## Dependencies at Risk

**`fzf` is an undeclared runtime dependency for interactive resolution:**
- Risk: Commands that omit explicit IDs fail on machines without `fzf`.
- Impact: Users can hit hard failures in normal workflows even when the API is healthy.
- Migration plan: Treat `fzf` as optional only when a non-interactive fallback exists; otherwise document and preflight it as a required dependency.

## Missing Critical Features

**No network timeout or retry policy for API requests:**
- Problem: CLI commands can hang indefinitely on stalled network requests because `fetch` calls are issued without `AbortSignal`, timeout logic, or retries.
- Blocks: Reliable automation and predictable failure behavior for CI or scripting around `vk`.

**No stable mockable boundary around command output formatting:**
- Problem: Most command logic mixes API calls, business rules, and console output in the same action handlers.
- Blocks: Fine-grained unit tests for CLI behavior and low-risk refactors of the workspace command set.

## Test Coverage Gaps

**API client write operations have minimal direct tests:**
- What's not tested: Fallback behavior and response-shape handling for operations beyond `listWorkspaces`, plus failure cases for create/update/delete/PR flows at the client layer.
- Files: `src/api/client.ts`, `tests/api_client_test.ts`
- Risk: Endpoint drift can surface as command failures without a focused failing test to localize the problem.
- Priority: High

**Wait command integration paths are not covered against a real NATS session:**
- What's not tested: `vk wait` connection setup, timeout handling, and message subscription behavior with real transport wiring.
- Files: `src/commands/wait.ts`, `src/commands/wait_test.ts`
- Risk: Transport or subscription regressions can ship even though the pure async iterator helper still passes.
- Priority: Medium

**Workspace command behavior lacks isolated unit coverage:**
- What's not tested: Shared validation and branching logic inside `src/commands/task-attempts.ts` outside full CLI integration runs.
- Files: `src/commands/task-attempts.ts`, `tests/task_attempts_integration_test.ts`
- Risk: Refactors inside the 595-line command file require broad end-to-end retesting and can miss branch-specific regressions.
- Priority: High

---

*Concerns audit: 2026-03-19*
