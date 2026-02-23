## 1. Foundation and Resolver Baseline

- [ ] 1.1 Run `docker compose run --rm vk` and bucket current failures by API, CLI, resolver, and other (Owner: Test Triage Agent).
- [ ] 1.2 Add or update `specs/cli.md` entries for optional `[id]` auto-detect behavior before resolver implementation (Owner: Spec and Docs Agent).
- [ ] 1.3 Add failing tests for `resolveWorkspaceFromBranch()` branch-match behavior and no-match behavior (Owner: Resolver Agent).
- [ ] 1.4 Implement `resolveWorkspaceFromBranch()` in resolver utilities using current branch and workspace search APIs (Owner: Resolver Agent).
- [ ] 1.5 Add failing tests for `getAttemptIdWithAutoDetect()` resolution order: explicit id, branch match, interactive fallback, clear failure (Owner: Resolver Agent).
- [ ] 1.6 Implement `getAttemptIdWithAutoDetect()` and required fzf selection flow wiring in resolver utilities (Owner: Resolver Agent).
- [ ] 1.7 Add failing CLI test for `vk task-attempts show [id]` with omitted id auto-detection, then implement the command wiring change (Owner: CLI Behavior Agent).

## 2. Phase 1 CRUD Subcommands

- [ ] 2.1 Add spec text for `vk task-attempts create` inputs and success output in `specs/cli.md` (Owner: Spec and Docs Agent).
- [ ] 2.2 Add failing tests for `vk task-attempts create` argument parsing, repo resolution (id/name), and `--json` output (Owner: Test Triage Agent).
- [ ] 2.3 Implement `create` command behavior in `src/commands/task-attempts.ts` and client/type usage in `src/api/client.ts` and `src/api/types.ts` (Owner: CLI Behavior Agent + API Contract Agent).
- [ ] 2.4 Add spec text and failing tests for `vk task-attempts update [id]` flags (`--name`, archived toggle, pinned toggle) including omitted id auto-detect (Owner: Spec and Docs Agent + Test Triage Agent).
- [ ] 2.5 Implement `update [id]` command behavior and status output parity with existing update commands (Owner: CLI Behavior Agent).
- [ ] 2.6 Add spec text and failing tests for `vk task-attempts delete [id]` including omitted id auto-detect and error handling (Owner: Spec and Docs Agent + Test Triage Agent).
- [ ] 2.7 Implement `delete [id]` command behavior and success/error output conventions (Owner: CLI Behavior Agent).

## 3. Phase 2 Repo and Branch Status Subcommands

- [ ] 3.1 Add spec text and failing tests for `vk task-attempts repos [id]` output modes (table and `--json`) with optional id auto-detect (Owner: Spec and Docs Agent + Test Triage Agent).
- [ ] 3.2 Implement `repos [id]` command and response formatting integration with API client methods (Owner: CLI Behavior Agent + API Contract Agent).
- [ ] 3.3 Add spec text and failing tests for `vk task-attempts branch-status [id]` including branch status fields and optional id resolution (Owner: Spec and Docs Agent + Test Triage Agent).
- [ ] 3.4 Implement `branch-status [id]` command behavior and output formatting (Owner: CLI Behavior Agent).

## 4. Phase 3 Git Operation Subcommands

- [ ] 4.1 Finalize and document `rename-branch` command placement decision, then add corresponding failing tests (Owner: Spec and Docs Agent + CLI Behavior Agent).
- [ ] 4.2 Implement `rename-branch` command behavior (standalone or update flag path) and API wiring (Owner: CLI Behavior Agent + API Contract Agent).
- [ ] 4.3 Add failing tests and implement `merge [id]`, `push [id]`, `rebase [id]`, and `stop [id]` with optional id auto-detect and consistent success output (Owner: Test Triage Agent + CLI Behavior Agent).

## 5. Phase 4 Pull Request Subcommands

- [ ] 5.1 Add spec text and failing tests for nested `vk task-attempts pr` command grouping (create, attach, comments) with optional id auto-detect (Owner: Spec and Docs Agent + Test Triage Agent).
- [ ] 5.2 Implement `vk task-attempts pr [id]` create behavior and output (`--json` and default modes) (Owner: CLI Behavior Agent + API Contract Agent).
- [ ] 5.3 Implement `vk task-attempts pr attach [id]` behavior with request validation and success output (Owner: CLI Behavior Agent + API Contract Agent).
- [ ] 5.4 Implement `vk task-attempts pr comments [id]` behavior with list formatting and `--json` output (Owner: CLI Behavior Agent).

## 6. Verification, Regression Safety, and Docs Sync

- [ ] 6.1 Extend integration coverage for all new task-attempt subcommands in `tests` and ensure each command has at least one success and one failure-path test (Owner: Test Triage Agent).
- [ ] 6.2 Run `docker compose run --rm vk` after each PR slice and fix regressions before moving to the next slice (Owner: Test Triage Agent).
- [ ] 6.3 Keep `specs/cli.md` synchronized with implemented behavior in every slice and resolve wording drift before merge (Owner: Spec and Docs Agent).
- [ ] 6.4 Verify command help/output coherence for the expanded `task-attempts` tree and close open questions or record follow-up changes (Owner: CLI Behavior Agent + Spec and Docs Agent).
