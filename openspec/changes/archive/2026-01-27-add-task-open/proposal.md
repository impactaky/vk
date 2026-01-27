# Change: Add Task Open Command

## Why
Users need a quick way to open a task in the Vibe Kanban web UI directly from the CLI. Currently, users must manually construct and navigate to the URL, which is tedious and error-prone.

## What Changes
- Add `vk task open` subcommand that opens task URL in the default browser
- Use `@opensrc/deno-open` JSR library for cross-platform browser opening
- Support task ID auto-detection from current branch (same as other task commands)

## Impact
- Affected specs: cli-commands
- Affected code: `src/commands/task.ts`, `deno.json`
