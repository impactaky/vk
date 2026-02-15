---
phase: quick
plan: 005
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/codebase/CONVENTIONS.md
  - .planning/codebase/STRUCTURE.md
  - .planning/codebase/STACK.md
autonomous: true

must_haves:
  truths:
    - "Future Claude sessions reading CONVENTIONS.md learn JSDoc is required on all public exports"
    - "Future Claude sessions reading STRUCTURE.md know about mod.ts and the requirement to add new public APIs to it"
    - "The outdated statement 'Barrel files not used' is corrected"
  artifacts:
    - path: ".planning/codebase/CONVENTIONS.md"
      provides: "JSDoc and mod.ts conventions for public API"
      contains: "deno doc"
    - path: ".planning/codebase/STRUCTURE.md"
      provides: "Updated directory layout with mod.ts and new-code checklist"
      contains: "mod.ts"
    - path: ".planning/codebase/STACK.md"
      provides: "deno doc listed as build/dev tool"
      contains: "deno doc"
---

<objective>
Update planning/codebase documentation to codify JSDoc docstring and mod.ts barrel file conventions established in quick task 004.

Purpose: Ensure all future development work (by Claude or human) maintains JSDoc
comments on public APIs, adds new exports to src/mod.ts, and preserves deno doc
compatibility.

Output: Updated CONVENTIONS.md, STRUCTURE.md, and STACK.md reflecting the new
standards.
</objective>

<execution_context>
@/home/impactaky/shelffiles/config/claude/get-shit-done/workflows/execute-plan.md
@/home/impactaky/shelffiles/config/claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/quick/004-support-deno-doc/004-SUMMARY.md
@.planning/codebase/CONVENTIONS.md
@.planning/codebase/STRUCTURE.md
@.planning/codebase/STACK.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update CONVENTIONS.md with JSDoc and barrel file standards</name>
  <files>.planning/codebase/CONVENTIONS.md</files>
  <action>
  Make three targeted edits to CONVENTIONS.md:

1. **Comments section (around lines 148-161):** Replace the existing JSDoc
   guidance. The current text says "No auto-generated JSDoc templates; only when
   genuinely useful" -- this is now outdated. Update to state:
   - JSDoc comments are REQUIRED on all exported symbols (interfaces, types,
     classes, functions, constants)
   - Use `@module` tag at top of files that form the public API surface
     (src/api/types.ts, src/api/client.ts, src/api/config.ts)
   - Document non-obvious fields and parameters; self-documenting fields (e.g.,
     `id: string`, `name: string`) can use brief or no per-field JSDoc
   - All JSDoc must be compatible with `deno doc` output
   - Add a quick reference command: `deno doc src/mod.ts` to check
     documentation, `deno doc --html --output=docs src/mod.ts` for HTML
     generation

2. **Module Design section (around lines 222-234):** The line "Barrel files not
   used; direct imports from specific files required" and "Barrel Files: Not
   used in this codebase; imports are explicit file paths" are now WRONG.
   Replace with:
   - `src/mod.ts` is the public library entry point (barrel file) re-exporting
     the full public API
   - Internal imports between source files still use direct relative paths
     (barrel file is for external consumers only)
   - When adding new public exports, they MUST be re-exported from `src/mod.ts`
   - CLI entry point (`src/main.ts`) is separate from library entry point
     (`src/mod.ts`)

3. **Quick Reference Commands section (around lines 46-57):** Add
   `deno doc src/mod.ts` as a check command alongside fmt, lint, and check:
   ```bash
   # Verify documentation
   deno doc src/mod.ts
   ```

Update the analysis date at the top to 2026-02-08. Keep all other sections
unchanged.
</action>
<verify> Read the updated CONVENTIONS.md and confirm:

- The Comments section requires JSDoc on all exports
- The Module Design section references src/mod.ts barrel file
- "Barrel files not used" text is gone
- Quick Reference Commands includes deno doc
- Analysis date is 2026-02-08
  </verify>
  <done>CONVENTIONS.md accurately reflects the JSDoc-on-all-exports and mod.ts
  barrel file standards</done>
  </task>

<task type="auto">
  <name>Task 2: Update STRUCTURE.md with mod.ts and new-code checklists</name>
  <files>.planning/codebase/STRUCTURE.md, .planning/codebase/STACK.md</files>
  <action>
  Make edits to STRUCTURE.md:

1. **Directory Layout (around lines 7-51):** Add `src/mod.ts` to the tree
   diagram right after `src/main.ts`:
   ```
   src/
   ├── main.ts                       # CLI entry point with Cliffy Command setup
   ├── mod.ts                        # Public library entry point (barrel file for deno doc / JSR)
   ├── api/                          # API client layer
   ```

2. **Where to Add New Code sections (lines 122-148):** For each "New X"
   checklist (New Command, New Utility, New API Method, New Configuration), add
   a step about JSDoc and mod.ts where applicable:

   **New Command** (after step 6): Add step: 7. Add JSDoc comments to all
   exported functions and types

   **New Utility** (after step 5): Add step: 6. Add JSDoc comments to all
   exported functions and classes 7. If the utility is part of the public API,
   re-export from `src/mod.ts`

   **New API Method** (after step 4): Add steps: 5. Add JSDoc comment to the new
   method with `@param` and `@returns` tags 6. If adding new types to
   `src/api/types.ts`, add JSDoc to each exported type

   **New Configuration** (after step 4): Add step: 5. Add JSDoc to new Config
   fields and any new exported functions

Update the analysis date at the top to 2026-02-08.

Then make a small edit to STACK.md:

3. **STACK.md Build/Dev section (around lines 33-38):** Add `deno doc` to the
   list of Deno built-in tools:
   ```
   - `deno doc` - API documentation generation (text and HTML)
   ```
   Place it after `deno check` and before `deno compile`.

Update STACK.md analysis date to 2026-02-08.
</action>
<verify> Read updated STRUCTURE.md and confirm:

- mod.ts appears in directory layout
- Each "Where to Add New Code" section includes JSDoc and/or mod.ts guidance
- Analysis date is 2026-02-08

Read updated STACK.md and confirm:

- deno doc listed under Build/Dev tools
- Analysis date is 2026-02-08
  </verify>
  <done>STRUCTURE.md directory layout includes mod.ts, all new-code checklists
  include JSDoc/mod.ts steps, STACK.md lists deno doc as a tool</done>
  </task>

</tasks>

<verification>
After both tasks complete:
1. Grep CONVENTIONS.md for "deno doc" -- must find matches
2. Grep CONVENTIONS.md for "Barrel files not used" or "Barrel Files: Not used" -- must find NO matches
3. Grep STRUCTURE.md for "mod.ts" -- must find matches in directory layout and new-code sections
4. Grep STACK.md for "deno doc" -- must find match
5. All three files have analysis date 2026-02-08
</verification>

<success_criteria>

- CONVENTIONS.md requires JSDoc on all public exports and references mod.ts
  barrel file
- STRUCTURE.md shows mod.ts in directory tree and includes JSDoc/mod.ts in all
  new-code checklists
- STACK.md lists deno doc as a build/dev tool
- No outdated "barrel files not used" statements remain
- Future Claude sessions reading these files will naturally maintain JSDoc and
  mod.ts </success_criteria>

<output>
After completion, create `.planning/quick/005-update-planning-files-to-make-sure-consi/005-SUMMARY.md`
</output>
