# Change: Add vk CLI for vibe-kanban API manipulation

## Why

Users need a command-line interface to interact with vibe-kanban without using the web UI. This enables automation, scripting, and integration with other tools. Similar to how `gh` provides CLI access to GitHub, `vk` will provide CLI access to vibe-kanban.

## What Changes

- Create a Deno-based CLI tool named `vk`
- Implement authentication via GitHub OAuth (device flow)
- Add commands for task management (list, create, update, delete)
- Add commands for project management (list, create, update, delete)
- Add commands for task attempt management (list, create, follow-up)
- Add configuration management (set/get API endpoint, tokens)
- Provide help documentation and usage examples

## Impact

- Affected specs: CLI (new capability)
- Affected code: All new code in the vk repository
- New dependencies: Deno runtime, Deno standard library modules
