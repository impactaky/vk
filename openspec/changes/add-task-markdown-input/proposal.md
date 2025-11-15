# Change: Add Markdown Input Support for Task Creation

## Why

Users frequently want to create tasks with multi-line descriptions that include formatting, but the current `vk task create` command requires passing title and description as separate command-line flags. This becomes cumbersome for longer descriptions and doesn't support rich formatting. Accepting markdown input would allow users to draft task content in their editor with proper formatting, then pipe or provide it directly to the CLI.

## What Changes

- Add support for reading markdown input from stdin or file for `vk task create`
- Parse markdown to extract title from the first heading (H1)
- Use remaining content as the task description
- Maintain backward compatibility with existing `--title` and `--description` flags
- Prioritize explicit flags over markdown parsing when both are provided

## Impact

- Affected specs: CLI (task management capability)
- Affected code: `src/commands/task.ts` (task create function), `main.ts` (CLI argument parsing)
- No breaking changes - existing flag-based workflow continues to work
