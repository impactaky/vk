---
phase: quick
plan: 006
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/codebase/CONVENTIONS.md
  - .planning/codebase/STRUCTURE.md
  - .planning/codebase/TESTING.md
  - .planning/STATE.md
autonomous: true

must_haves:
  truths:
    - "Future Claude sessions reading CONVENTIONS.md see a prominent pre-commit checklist requiring deno fmt, deno lint, and deno check before any commit"
    - "Future Claude sessions reading STRUCTURE.md see lint/fmt/check as the final step in every 'Where to Add New Code' checklist"
    - "Future Claude sessions reading TESTING.md understand that static analysis (lint/fmt/check) is part of the quality workflow"
  artifacts:
    - path: ".planning/codebase/CONVENTIONS.md"
      provides: "Pre-commit quality checklist section"
      contains: "Pre-Commit Checklist"
    - path: ".planning/codebase/STRUCTURE.md"
      provides: "Lint/fmt/check step in every new-code checklist"
      contains: "deno lint"
    - path: ".planning/codebase/TESTING.md"
      provides: "Static analysis quality section"
      contains: "deno lint"
    - path: ".planning/STATE.md"
      provides: "Decision record for lint-before-finish convention"
      contains: "lint"
  key_links:
    - from: ".planning/codebase/CONVENTIONS.md"
      to: "deno.json tasks"
      via: "References deno task fmt, deno task lint, deno task check"
      pattern: "deno (fmt|lint|check)"
---

<objective>
Update planning/codebase documentation to make lint, format, and type-check a mandatory pre-commit step in all workflows.

Purpose: Currently CONVENTIONS.md has a brief one-liner "Run these checks before
committing" that is easy to overlook. The "Where to Add New Code" checklists in
STRUCTURE.md and the testing workflow in TESTING.md omit static analysis
entirely. This plan promotes lint/fmt/check from an afterthought to a required
gate that future Claude sessions and human developers will see prominently in
every relevant document.

Output: Updated CONVENTIONS.md, STRUCTURE.md, TESTING.md, and STATE.md with
mandatory pre-commit quality checks.
</objective>

<execution_context>
@/home/impactaky/shelffiles/config/claude/get-shit-done/workflows/execute-plan.md
@/home/impactaky/shelffiles/config/claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/codebase/CONVENTIONS.md
@.planning/codebase/STRUCTURE.md
@.planning/codebase/TESTING.md
@deno.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add mandatory pre-commit checklist to CONVENTIONS.md</name>
  <files>.planning/codebase/CONVENTIONS.md</files>
  <action>
  Make two targeted edits to CONVENTIONS.md:

1. **Replace the Quick Reference Commands section (lines 45-60).** The current
   section has a code block of commands followed by a one-liner "Run these
   checks before committing to ensure code quality." This is too easy to skip.
   Replace the entire section (from `**Quick Reference Commands:**` through the
   one-liner after the code block) with a new section titled
   `## Pre-Commit Quality Checklist` that is structured as follows:

   ````markdown
   ## Pre-Commit Quality Checklist

   **REQUIRED before every commit.** Run all three checks and fix any issues before
   committing code changes.

   | Step | Command                  | Purpose                             |
   | ---- | ------------------------ | ----------------------------------- |
   | 1    | `deno fmt --check`       | Verify formatting (fix: `deno fmt`) |
   | 2    | `deno lint`              | Check for lint errors               |
   | 3    | `deno check src/main.ts` | Type-check the codebase             |
   | 4    | `deno doc src/mod.ts`    | Verify documentation builds         |

   **Quick run all checks:**

   ```bash
   deno fmt --check && deno lint && deno check src/main.ts && deno doc src/mod.ts
   ```
   ````

   If any check fails, fix the issue before committing. Do NOT suppress lint
   rules with `// deno-lint-ignore` unless there is a documented reason in the
   code comment explaining why the suppression is necessary.
   ```
   ```

This section should remain under `## Code Style` (keep it positioned between the
Formatting/Linting subsections above and the `## Import Organization` section
below). Specifically:

- The Formatting subsection (lines 33-37) stays as-is
- The Linting subsection (lines 39-43) stays as-is
- Replace the Quick Reference Commands block (lines 45-60) with the new
  Pre-Commit Quality Checklist
- The `## Import Organization` section (line 62 onward) continues unchanged

2. **Update the analysis date** at the top of the file (line 3) to `2026-02-08`.

Do NOT change any other sections of the file.
</action>
<verify> Read the updated CONVENTIONS.md and confirm:

- A "Pre-Commit Quality Checklist" section exists with a table of 4 steps
- The table includes deno fmt, deno lint, deno check, and deno doc
- The word "REQUIRED" appears prominently
- A combined one-liner command is provided for quick execution
- The old "Quick Reference Commands" heading is gone
- Analysis date is 2026-02-08
- Import Organization section still follows immediately after
  </verify>
  <done>CONVENTIONS.md has a prominent, hard-to-miss pre-commit checklist
  requiring lint/fmt/check/doc before every commit</done>
  </task>

<task type="auto">
  <name>Task 2: Add lint/fmt/check step to STRUCTURE.md checklists and static analysis section to TESTING.md</name>
  <files>.planning/codebase/STRUCTURE.md, .planning/codebase/TESTING.md</files>
  <action>
  **STRUCTURE.md edits:**

In the "Where to Add New Code" section (lines 121-154), each "New X" checklist
currently ends with JSDoc/mod.ts steps (added by quick-005). Add a FINAL step to
each checklist that reads:

For **New Command** (currently ends at step 7 about JSDoc), add step 8:
`8. Run pre-commit checks: \`deno fmt --check && deno lint && deno check
src/main.ts\``

For **New Utility** (currently ends at step 7 about mod.ts re-export), add step
8: `8. Run pre-commit checks: \`deno fmt --check && deno lint && deno check
src/main.ts\``

For **New API Method** (currently ends at step 6 about JSDoc on types), add step
7: `7. Run pre-commit checks: \`deno fmt --check && deno lint && deno check
src/main.ts\``

For **New Configuration** (currently ends at step 5 about JSDoc on config
fields), add step 6: `6. Run pre-commit checks: \`deno fmt --check && deno lint
&& deno check src/main.ts\``

Update STRUCTURE.md analysis date to 2026-02-08.

**TESTING.md edits:**

Add a new section `## Static Analysis` right before the final `---` separator at
the end of the file (before line 356). Content:

````markdown
## Static Analysis

**Required before committing any code changes.** Static analysis catches issues
that tests do not cover (formatting, lint rules, type errors in non-test code).

```bash
# Run all static analysis checks
deno fmt --check && deno lint && deno check src/main.ts
```
````

These checks are separate from `deno test` and must pass independently. The
CI-equivalent workflow is:

1. `deno fmt --check` -- formatting
2. `deno lint` -- lint rules
3. `deno check src/main.ts` -- type checking
4. `deno test ...` -- unit and integration tests

See CONVENTIONS.md Pre-Commit Quality Checklist for full details.

```
Update TESTING.md analysis date to 2026-02-08.
</action>
<verify>
Read updated STRUCTURE.md and confirm:
- Each "Where to Add New Code" checklist (New Command, New Utility, New API Method, New Configuration) ends with a "Run pre-commit checks" step
- The step includes the combined command `deno fmt --check && deno lint && deno check src/main.ts`
- Analysis date is 2026-02-08

Read updated TESTING.md and confirm:
- A "Static Analysis" section exists near the end of the file
- It includes the combined lint/fmt/check command
- It references CONVENTIONS.md for full details
- Analysis date is 2026-02-08
</verify>
<done>Every new-code checklist in STRUCTURE.md ends with a lint/fmt/check step, and TESTING.md documents static analysis as part of the quality workflow</done>
</task>

<task type="auto">
<name>Task 3: Record decision in STATE.md</name>
<files>.planning/STATE.md</files>
<action>
Add a new decision entry to the decisions list in STATE.md under the "v1.1 decisions (Phases 5-8):" block (after the last decision about deno doc verification, around line 68). Add:

`- Pre-commit quality checks (deno fmt, deno lint, deno check) required before every commit (quick-006)`

Also add an entry to the Quick Tasks Completed table (after quick-005, around line 86):

`| 006 | Update planning docs with lint-before-finish convention | 2026-02-08 | TBD | [006-update-planning-files-to-lint-before-fin](./quick/006-update-planning-files-to-lint-before-fin/) |`

Update the "Last session" and "Stopped at" fields in Session Continuity to reflect this task.

Update the "Last updated" line at the bottom of the file.
</action>
<verify>
Read STATE.md and confirm:
- The new decision about pre-commit checks appears in the decisions list with (quick-006) tag
- Quick task 006 appears in the Quick Tasks Completed table
- Session Continuity reflects this task
</verify>
<done>STATE.md records the lint-before-finish convention as a project decision and logs quick task 006</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. Grep CONVENTIONS.md for "Pre-Commit Quality Checklist" -- must find a match
2. Grep CONVENTIONS.md for "REQUIRED" -- must find a match in the checklist context
3. Grep STRUCTURE.md for "pre-commit checks" -- must find 4 matches (one per new-code checklist)
4. Grep TESTING.md for "Static Analysis" -- must find a match
5. Grep STATE.md for "quick-006" -- must find a match
6. Run `deno fmt --check && deno lint && deno check src/main.ts` to confirm these commands actually work (they should, this task only modifies .md files)
</verification>

<success_criteria>
- CONVENTIONS.md has a prominent Pre-Commit Quality Checklist with a table of required steps
- STRUCTURE.md every "Where to Add New Code" checklist ends with lint/fmt/check
- TESTING.md documents static analysis as a required quality step
- STATE.md records the decision and logs the quick task
- Future Claude sessions reading any of these files will naturally run lint/fmt/check before committing
</success_criteria>

<output>
After completion, create `.planning/quick/006-update-planning-files-to-lint-before-fin/006-SUMMARY.md`
</output>
```
