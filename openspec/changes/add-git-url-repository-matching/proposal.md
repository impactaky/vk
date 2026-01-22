# Change: Add Git URL-Based Repository Matching

## Why
Path-based repository auto-detection fails across different machines because the same repository may be cloned to different absolute paths (e.g., `/home/alice/projects/my-repo` vs `/home/bob/code/my-repo`). This makes the CLI unusable when working on the same repository from different environments.

## What Changes
- Repository auto-detection now uses git URL basename matching as the primary strategy
- Compares the current directory's git remote URL basename against registered repositories
- Falls back to path-based matching when git URL matching fails (e.g., no git remote configured)
- Falls back to repo.name when registered repo's path is not accessible on current machine

## Impact
- Affected specs: cli-commands (Repository Auto-Detection from Path)
- Affected code: src/utils/repository-resolver.ts, src/utils/git.ts
