## Context

The CLI currently implements `vk task-attempts list` and `vk task-attempts show` only, while the API client already exposes additional task-attempt endpoints (CRUD, repo/branch status, git operations, and PR flows). Users need a consistent CLI path for these operations without dropping to direct API calls.

The change is cross-cutting across command wiring, resolver utilities, API usage, tests, and CLI docs. The team decision is to ship one subcommand per PR and keep each slice small and test-driven.

## Goals / Non-Goals

**Goals:**
- Provide complete `vk task-attempts` command coverage for the supported API surface.
- Standardize optional `[id]` auto-detection using a deterministic order: explicit ID, current branch match, then interactive selection.
- Keep behavior consistent with existing command patterns (`--json`, human-readable success lines, resolver ergonomics).
- Enable phased delivery where each subcommand can be merged independently without breaking the command tree.

**Non-Goals:**
- Redesigning the API contract or backend workspace lifecycle.
- Reworking unrelated command families (`organization`, `repository`, `config`).
- Bulk shipping all subcommands in a single PR.
- Finalizing unresolved product decisions beyond explicit scope (for example, if `rename-branch` stays standalone or moves under `update`).

## Decisions

1. Use phased, one-subcommand-per-PR delivery.
Rationale: reduces blast radius, keeps tests focused, and aligns with user direction.
Alternatives considered:
- Single large PR for all subcommands: rejected due to high review and regression risk.
- Phase-level PRs containing multiple subcommands: rejected because it weakens isolation and slows iteration.

2. Add a dedicated attempt ID auto-detect resolver path for optional `[id]`.
Rationale: this mirrors expected operator ergonomics and removes repetitive ID lookup steps.
Resolver order:
- explicit CLI argument
- current git branch lookup via workspace branch mapping
- interactive fallback selection
Alternatives considered:
- branch-only auto-detect with hard failure outside workspace branches: rejected because it blocks common flows.
- interactive-only resolution: rejected because it adds unnecessary friction when branch context is sufficient.

3. Keep PR operations nested under `vk task-attempts pr`.
Rationale: groups related actions (`create`, `attach`, `comments`) under a discoverable namespace and matches user decision.
Alternatives considered:
- top-level flat commands (`task-attempts pr-create`, etc.): rejected due to lower discoverability and noisier command surface.

4. Reuse existing command and output patterns from current CLI modules.
Rationale: consistent UX and lower implementation risk by following established style for update/delete and JSON output.
Alternatives considered:
- custom formatting per subcommand: rejected because it creates inconsistent behavior and higher maintenance cost.

5. Keep docs/spec updates coupled with each implementation slice.
Rationale: avoids drift between behavior, tests, and documentation in a staged rollout.
Alternatives considered:
- docs update at end of all phases: rejected because it leaves intermediate states undocumented.

## Risks / Trade-offs

- [Resolver ambiguity across similar branches or multiple matches] -> Mitigation: define deterministic match behavior and add tests for ambiguous cases with explicit error messaging.
- [Interactive fallback increases dependency on fzf helpers] -> Mitigation: keep resolver interfaces narrow and add integration tests around selection flow.
- [Incremental PR strategy may temporarily expose partial command surface] -> Mitigation: document shipped subcommands in `specs/cli.md` per PR and ensure help output remains coherent.
- [Copying patterns from legacy implementation can carry forward hidden assumptions] -> Mitigation: validate against current API types/client methods and prefer current tests over historical behavior when they conflict.
- [Unsettled `rename-branch` placement can cause refactor churn] -> Mitigation: isolate that command wiring so either placement requires minimal changes.

## Migration Plan

1. Land resolver foundation (auto-detect helpers and related fzf selectors) and wire optional `[id]` where immediately needed.
2. Deliver subcommands in agreed PR order with TDD for each slice.
3. Update `specs/cli.md` and tests in the same PR as each behavior change.
4. Validate full CLI test suite after each merge-ready slice.
5. If command placement decisions change (for example `rename-branch`), perform targeted command-tree refactor with compatibility checks before final phase completion.

Rollback strategy:
- Revert the most recent subcommand PR if regressions occur; one-subcommand boundaries keep rollback localized.
- Preserve resolver fallback behavior by keeping explicit ID path unchanged, so disabling auto-detect remains low risk if needed.

## Open Questions

- Should `rename-branch` remain a standalone subcommand or become `update --branch`?
- For branch-only operations, should interactive fallback always be allowed, or should some commands require branch context for safety?
- Do we need additional confirmation prompts for destructive actions like `delete` in non-interactive mode?
