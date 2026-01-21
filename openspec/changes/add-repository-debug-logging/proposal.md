# Change: Add Debug Logging for Repository Resolution

## Why
Repository auto-detection using git URL matching sometimes falls back to fzf selection unexpectedly. Users need diagnostic output to understand why matching fails, especially when:
- The registered repository path is on a different machine
- Working in a git worktree with a different path than the registered repo
- SSH vs HTTPS URL format differences

## What Changes
- Add `--debug` flag to `repository show`, `repository update`, and `repository branches` commands
- When debug mode is enabled, output diagnostic information showing:
  - Current directory's git remote URL and extracted basename
  - Each registered repo's path, git URL retrieval result, fallback to repo.name, and final basename
  - Match results at each stage (git URL matching, path matching, fzf fallback)

## Impact
- Affected specs: `cli-commands`
- Affected code: `src/utils/repository-resolver.ts`, `src/commands/repository.ts`
