# Change: Add Repository Auto-Detection from Current Path

## Why
The repository commands (`show`, `update`, `branches`) currently require an explicit repository ID, while project, task, and attempt commands support auto-detection. This creates an inconsistent user experience. Users should be able to run repository commands without specifying the ID when they're inside a registered repository directory.

## What Changes
- Add repository auto-detection based on current working directory
- Make repository ID optional for `show`, `update`, and `branches` subcommands
- Add fzf interactive selection fallback when auto-detection fails
- Add new utility module `repository-resolver.ts`

## Impact
- Affected specs: cli-commands
- Affected code:
  - `src/commands/repository.ts` - Updated show, update, branches to accept optional ID
  - `src/utils/repository-resolver.ts` - New file for resolution logic
  - `src/utils/fzf.ts` - Added formatRepository and selectRepository functions
