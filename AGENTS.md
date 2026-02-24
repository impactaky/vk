# Agent Teams for VK

Use this team setup for OPSX flow in this repository. Keep work small and
test-driven.

## Skill Source Requirement

- Before acting, each OPSX agent must read the assigned skill markdown file(s)
  from `.codex/skills/**/SKILL.md` for its action (OpenSpec and project skills).
- Treat those `SKILL.md` files as source of truth for workflow details and
  guardrails.

## Team Roles

1. OPSX Triage Agent

- Owns change selection and next-action triage.
- Uses `openspec list --json` and `openspec status --change "<name>" --json`.
- Picks the smallest next action (artifact, apply step, sync, verify, or
  archive).

2. OPSX Artifact Agent

- Owns planning artifacts under `openspec/changes/*`.
- Focuses on `proposal.md`, `design.md`, and `tasks.md`.
- Uses `/opsx:new`, `/opsx:continue`, and `/opsx:ff` behavior.

3. OPSX Spec Delta Agent

- Owns delta specs in `openspec/changes/*/specs/**/spec.md`.
- Owns source-of-truth specs in `openspec/specs/**/spec.md`.
- Keeps requirement and scenario text aligned with final behavior.

4. OPSX Apply Agent

- Owns implementation in `src/**` and related tests for the active change.
- Implements one task checkbox at a time with minimal diffs.
- Updates task checkboxes in `tasks.md` immediately after each completed task.
- Runs CI-aligned checks by calling `/lint` then `/test`.

5. OPSX Verify and Archive Agent

- Owns change verification and archival.
- Confirms task/spec/design coherence before archive.
- Handles `/opsx:verify`, `/opsx:sync`, and `/opsx:archive` decisions.
- Re-runs `/lint` then `/test` before archive decisions.

## Default Workflow

1. Select or create the change: `openspec list --json`
   `openspec new change "<name>"` (if no active change exists)
2. Check artifact state and pick the smallest ready step:
   `openspec status --change "<name>" --json`
3. Build planning artifacts until apply-ready: `/opsx:continue` or `/opsx:ff`
4. Implement tasks incrementally: `/opsx:apply`
5. Run project checks after each meaningful step:
   `/lint` then `/test`
   (see `.codex/skills/lint/SKILL.md` and
   `.codex/skills/test/SKILL.md`).
6. Keep delta specs current and sync when ready: `/opsx:sync`
7. Verify implementation against artifacts: `/opsx:verify`
8. Archive completed change: `/opsx:archive`

## Done Criteria

- All tasks for the active change are complete (`- [x]`).
- Format, lint, and tests pass with no new regressions.
- Delta specs reflect shipped behavior, with sync status made explicit.
- The change is verified and archived.
