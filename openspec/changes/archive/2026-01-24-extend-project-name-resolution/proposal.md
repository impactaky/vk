# Change: Extend project name resolution to all project subcommands

## Why
The existing "Project Resolution by Name" requirement covers `show`, `update`, and `delete` subcommands, but the `repos`, `add-repo`, and `remove-repo` subcommands were not included. This creates an inconsistent user experience where some project commands accept names while others do not.

## What Changes
- Extend project name resolution to `repos`, `add-repo`, and `remove-repo` subcommands
- All project subcommands now consistently use `getProjectId()` for name/ID resolution
- No new code patterns introduced; applies existing pattern uniformly

## Impact
- Affected specs: cli-commands (modify "Project Resolution by Name" requirement)
- Affected code: `src/commands/project.ts` (already implemented)
