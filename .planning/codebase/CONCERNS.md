# Codebase Concerns

**Analysis Date:** 2026-03-17

## Tech Debt

**Workspace command is a monolith:**
- Issue: `src/commands/task-attempts.ts` concentrates prompt validation, repository resolution, executor parsing, API orchestration, formatting, and pull-request subcommands in a single ~600-line file.
- Files: `src/commands/task-attempts.ts`
- Impact: Small behavior changes in workspace flows have a wide regression surface, and adding a new workspace operation means editing a high-churn file instead of extending a stable abstraction.
- Fix approach: Split `src/commands/task-attempts.ts` into focused modules by subcommand family (`create`, `spin-off`, lifecycle ops, PR ops) and move shared argument validation/output helpers into `src/utils/` or a command helper layer.

**API client mixes transport, compatibility shims, and response normalization:**
- Issue: `src/api/client.ts` owns raw fetch logic, verbose logging, response parsing, endpoint shape normalization, and all endpoint definitions in one class.
- Files: `src/api/client.ts`
- Impact: Any API contract drift requires editing a central file, and transport-level changes such as auth headers, timeouts, retries, or pagination will touch nearly every method.
- Fix approach: Extract the generic request transport from endpoint methods, then isolate response adapters for endpoints that still accept multiple shapes.

**Process-exiting utilities reduce reusability:**
- Issue: `src/utils/error-handler.ts`, `src/commands/config.ts`, and `src/commands/notify.ts` call `Deno.exit()` directly from helpers and command bodies.
- Files: `src/utils/error-handler.ts`, `src/commands/config.ts`, `src/commands/notify.ts`, `src/main.ts`
- Impact: Reusing commands as library code is harder, tests need subprocess execution instead of direct invocation, and error paths cannot be composed cleanly.
- Fix approach: Return typed failures from command handlers and let `src/main.ts` own final process exit behavior.

**Configuration loading silently discards malformed config:**
- Issue: `loadConfig()` in `src/api/config.ts` catches any read or parse failure and falls back to defaults without surfacing that the config file is invalid.
- Files: `src/api/config.ts`, `tests/cli_commands_integration_test.ts`
- Impact: Broken JSON or filesystem issues look like "default config" instead of a user-visible configuration error, which can hide misconfiguration during support and debugging.
- Fix approach: Differentiate missing-file handling from parse errors, and fail with a targeted error when `vk-config.json` exists but is invalid.

## Known Bugs

**CLI has no authentication path even though the target API may require auth:**
- Symptoms: Integration tests accept `401` as an expected outcome and often skip assertions when the server requires authentication instead of exercising authenticated flows.
- Files: `tests/organization_integration_test.ts`, `tests/task_attempts_integration_test.ts`, `README.md`, `src/api/client.ts`, `src/api/config.ts`
- Trigger: Running against a protected `vibe-kanban` instance.
- Workaround: Use an unauthenticated local instance or a server configuration that does not require auth.

**Repository resolver test mutates global server state:**
- Symptoms: The test named `getRepositoryId: throws when no repos and no explicit ID` deletes every repository on the shared test server before trying to restore them.
- Files: `tests/repository_resolver_integration_test.ts`
- Trigger: Running the integration suite against any server that contains non-ephemeral repositories.
- Workaround: Run tests only against an isolated disposable server/database.

**Integration tests intentionally mask backend `500` errors:**
- Symptoms: Multiple task-attempt tests return early when stderr contains `API error (500):`, so a server-side regression can still leave the suite green.
- Files: `tests/task_attempts_integration_test.ts`
- Trigger: Any backend instability in workspace creation or spin-off flows.
- Workaround: Review test logs manually or tighten the suite to fail on `500` responses.

## Security Considerations

**Verbose mode logs full request and response bodies:**
- Risk: `ApiClient.request()` prints complete request payloads and response bodies when `--verbose` is set, which can expose prompt content, repository paths, PR metadata, or future auth material to stderr logs.
- Files: `src/api/client.ts`, `src/utils/verbose.ts`
- Current mitigation: Logging is opt-in via `-v` / `--verbose`.
- Recommendations: Redact sensitive fields before logging, cap body sizes, and avoid logging full responses by default.

**NATS messaging is unauthenticated and unencrypted at the CLI layer:**
- Risk: `vk notify` and `vk wait` connect with plain `nats://host:port` URLs and no support for credentials or TLS options.
- Files: `src/commands/notify.ts`, `src/commands/wait.ts`, `src/api/config.ts`
- Current mitigation: Host, port, and subject are configurable.
- Recommendations: Add credentials/TLS configuration and document that current usage assumes a trusted network.

**Release and integration environments are not pinned to a stable upstream app/tool image:**
- Risk: CI starts the backend with `npx -y vibe-kanban` and runs tests in `denoland/deno:latest`, while GitHub Actions uses broad `v2.x` Deno setup.
- Files: `docker-compose.yml`, `Dockerfile.vibe-kanban-ci`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Current mitigation: None beyond basic CI execution.
- Recommendations: Pin backend package versions, pin the Deno container tag, and periodically update intentionally instead of absorbing upstream changes implicitly.

## Performance Bottlenecks

**Workspace auto-detection performs full-list scans:**
- Problem: Branch-based workspace resolution fetches every workspace from `/api/task-attempts` and filters client-side.
- Files: `src/api/client.ts`, `src/utils/attempt-resolver.ts`, `src/commands/task-attempts.ts`
- Cause: `searchWorkspacesByBranch()` has no server-side branch query and is used by `getAttemptIdWithAutoDetect()` for many commands.
- Improvement path: Add a server-side branch lookup endpoint or indexed query and change the resolver to request a single candidate instead of the full collection.

**Repository auto-detection scales linearly with registered repos and spawns git repeatedly:**
- Problem: `resolveRepositoryFromPath()` lists all repos, then runs git remote detection across all registered repository paths with `Promise.all`.
- Files: `src/utils/repository-resolver.ts`, `src/utils/git.ts`, `src/commands/repository.ts`, `src/commands/task-attempts.ts`
- Cause: Cross-machine matching is implemented by probing each repo path at runtime.
- Improvement path: Cache resolved metadata, prefer an API-side lookup, and avoid probing inaccessible paths on every command invocation.

**Verbose request handling doubles response-body work:**
- Problem: `ApiClient.request()` reads the full body as text for every response and clones the response before parsing.
- Files: `src/api/client.ts`
- Cause: Logging and JSON parsing both consume the same payload.
- Improvement path: Parse once, log only selected fields, and add streaming or bounded logging for large payloads.

## Fragile Areas

**Integration suite depends on live server behavior instead of hermetic fixtures:**
- Files: `tests/task_attempts_integration_test.ts`, `tests/organization_integration_test.ts`, `tests/repository_resolver_integration_test.ts`, `tests/helpers/test-server.ts`, `docker-compose.yml`
- Why fragile: Tests depend on a running external app, shared mutable state, auth mode, and whatever version `npx -y vibe-kanban` resolves at runtime.
- Safe modification: Change integration flows only alongside explicit fixture/setup updates and keep test data isolated per test run.
- Test coverage: Coverage breadth is high, but many paths are soft-skipped on `401`, inaccessible endpoints, missing git, or backend `500`s.

**Repository and workspace auto-resolution logic depends on local machine state:**
- Files: `src/utils/repository-resolver.ts`, `src/utils/attempt-resolver.ts`, `src/utils/git.ts`, `src/utils/fzf.ts`
- Why fragile: Resolution depends on current working directory, git metadata, registered server paths, and optional `fzf` availability.
- Safe modification: Preserve the explicit-ID code path as the stable fallback and add deterministic tests for each resolver branch before refactoring.
- Test coverage: `src/utils/attempt-resolver_test.ts`, `src/utils/git_test.ts`, and `tests/repository_resolver_integration_test.ts` cover slices of behavior, but only the repository resolver gets live server coverage.

**User-facing contract is split between `workspace` and legacy task-attempt naming:**
- Files: `src/commands/task-attempts.ts`, `src/api/client.ts`, `openspec/specs/task-attempts-subcommands/spec.md`, `README.md`
- Why fragile: The CLI exposes `workspace` commands while internal APIs, types, specs, and tests still mix `task-attempt` and `workspace` terminology.
- Safe modification: Update naming changes atomically across commands, API client aliases, specs, and docs.
- Test coverage: `tests/task_attempts_integration_test.ts` exercises many flows but remains anchored to the mixed naming model.

## Scaling Limits

**Command latency grows with organization data volume:**
- Current capacity: Practical for small collections of workspaces and repositories.
- Limit: Commands that auto-detect workspaces or repositories degrade as registered resources grow because they fetch full lists and do client-side matching.
- Scaling path: Add server-side search/filter endpoints and pagination, then have CLI resolvers consume narrow API queries.

**Integration runtime grows with breadth of task-attempt coverage:**
- Current capacity: A single large file, `tests/task_attempts_integration_test.ts`, already contains most workspace coverage.
- Limit: Adding more workspace scenarios to the existing file increases runtime, output volume, and maintenance cost disproportionately.
- Scaling path: Split the suite by concern and move repeated API/process helpers into shared test utilities with explicit fixtures.

## Dependencies at Risk

**Unpinned upstream `vibe-kanban` package in integration tests:**
- Risk: `npx -y vibe-kanban` can change behavior between runs without any repository diff.
- Impact: CI failures or silent behavior drift can come from the upstream package rather than this CLI codebase.
- Migration plan: Pin the backend version in `docker-compose.yml` or build from a known image/tag.

**Floating runtime versions in CI:**
- Risk: `denoland/deno:latest` and `deno-version: v2.x` allow toolchain changes to land without review.
- Impact: Formatting, linting, compile, or test behavior can shift unexpectedly.
- Migration plan: Pin exact Deno versions in `docker-compose.yml` and `.github/workflows/*.yml`, then update deliberately.

## Missing Critical Features

**Authenticated API support:**
- Problem: The CLI exposes no token/session/header configuration even though test code explicitly treats `401` as a normal deployment mode.
- Blocks: Reliable use against protected production instances and deterministic authenticated integration tests.

**Request timeouts and retry policy:**
- Problem: `ApiClient.request()` issues raw `fetch()` calls with no timeout, retry, or backoff strategy.
- Blocks: Predictable CLI behavior on slow or partially failing networks.

## Test Coverage Gaps

**API client error-handling paths are minimally tested:**
- What's not tested: Network failures, malformed JSON, non-JSON responses, timeout behavior, and verbose logging behavior in `ApiClient.request()`.
- Files: `src/api/client.ts`, `tests/api_client_test.ts`
- Risk: Transport regressions can ship without fast feedback because the direct tests only cover constructor normalization.
- Priority: High

**Notify/wait command integration is effectively uncovered:**
- What's not tested: Live NATS publish/subscribe flows, connection failures, and config-driven host/port/subject overrides.
- Files: `src/commands/notify.ts`, `src/commands/wait.ts`, `src/commands/wait_test.ts`
- Risk: Messaging commands can break in real environments while the current suite still passes.
- Priority: Medium

**Organization resolver behavior lacks full resolver-path tests:**
- What's not tested: Successful ID/name resolution and duplicate-name handling in `src/utils/organization-resolver.ts`.
- Files: `src/utils/organization-resolver.ts`, `src/utils/organization-resolver_test.ts`, `tests/organization_integration_test.ts`
- Risk: A regression in organization lookup logic would mainly be caught only through broader CLI integration behavior.
- Priority: Medium

---

*Concerns audit: 2026-03-17*
