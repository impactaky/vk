---
id: quick-001
type: quick
wave: 1
depends_on: []
files_modified:
  - .planning/codebase/TESTING.md
  - .planning/codebase/CONVENTIONS.md
autonomous: true

must_haves:
  truths:
    - "Developer can find Docker test command in TESTING.md"
    - "Developer can find lint/format/typecheck commands in CONVENTIONS.md"
    - "Commands match the authoritative skill definitions"
  artifacts:
    - path: ".planning/codebase/TESTING.md"
      provides: "Docker test workflow from test skill"
      contains: "docker compose run --rm vk"
    - path: ".planning/codebase/CONVENTIONS.md"
      provides: "Quick reference lint commands from lint skill"
      contains: "deno fmt --check"
  key_links: []
---

<objective>
Update GSD planning documents to incorporate skill instructions from `.claude/skills/` directory.

Purpose: Make `.planning/` the authoritative reference for development workflows
by integrating Docker test workflow and lint command quick reference from skill
files. Output: Updated TESTING.md and CONVENTIONS.md with complete, actionable
command references.
</objective>

<context>
@.planning/codebase/TESTING.md
@.planning/codebase/CONVENTIONS.md
@.claude/skills/test/SKILL.md
@.claude/skills/lint/SKILL.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Docker test workflow to TESTING.md</name>
  <files>.planning/codebase/TESTING.md</files>
  <action>
Add a "Quick Start" section at the top of the Test Framework section (after the header, before "Runner:") with the Docker-based test workflow:

````markdown
**Quick Start (Recommended):**

```bash
docker compose run --rm vk
```
````

This starts the vibe-kanban server with health checks and runs all tests. Use
this for the complete test experience matching CI.

````
This provides the simple, recommended approach before diving into framework details.
  </action>
  <verify>
- TESTING.md contains "docker compose run --rm vk" command
- Quick Start section appears before the Runner subsection
- Original content preserved below the new section
  </verify>
  <done>Docker test command from test skill is documented in TESTING.md as the recommended quick start approach</done>
</task>

<task type="auto">
  <name>Task 2: Add lint command quick reference to CONVENTIONS.md</name>
  <files>.planning/codebase/CONVENTIONS.md</files>
  <action>
Expand the Linting section in CONVENTIONS.md to include a quick reference command block. After "Deno's built-in linter via `deno lint`" line, add:

```markdown
**Quick Reference Commands:**
```bash
# Check formatting (fix with: deno fmt)
deno fmt --check

# Run linter
deno lint

# Type check
deno check src/main.ts
````

Run these checks before committing to ensure code quality.

```
This provides copy-pasteable commands that match the lint skill workflow.
  </action>
  <verify>
- CONVENTIONS.md contains all three commands: deno fmt --check, deno lint, deno check src/main.ts
- Commands appear in the Linting section under Code Style
- Fix hint for deno fmt is included
  </verify>
  <done>Lint skill commands are documented in CONVENTIONS.md as quick reference for pre-commit checks</done>
</task>

</tasks>

<verification>
1. `grep -q "docker compose run --rm vk" .planning/codebase/TESTING.md && echo "Docker command present"`
2. `grep -q "deno fmt --check" .planning/codebase/CONVENTIONS.md && echo "Format check present"`
3. `grep -q "deno check src/main.ts" .planning/codebase/CONVENTIONS.md && echo "Type check present"`
</verification>

<success_criteria>
- TESTING.md has Docker test command as quick start
- CONVENTIONS.md has lint/format/typecheck quick reference
- Commands exactly match skill file definitions
- Original document structure and content preserved
</success_criteria>

<output>
After completion, create `.planning/quick/001-update-gsd-docs-skills-migration/001-SUMMARY.md`
</output>
```
