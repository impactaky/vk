# Tasks

## Implementation

1. [x] Add imports to `project-resolver.ts` for `getRepoBasenameFromPath` and `Repo` type
2. [x] Add `isPathWithinRepo` helper function to `project-resolver.ts`
3. [x] Add `tryResolveRepository` helper function that attempts repository resolution without fzf fallback
4. [x] Modify `resolveProjectFromGit` to use 3-tier strategy:
   - Strategy 1: Repository-based matching (NEW)
   - Strategy 2: Direct git basename matching (existing)
   - Strategy 3: fzf selection (existing)
5. [x] Add unit tests for `isPathWithinRepo` and `tryResolveRepository`
6. [x] Add integration tests for cross-machine project resolution

## Validation

7. [x] Run `deno lint` and fix any issues
8. [x] Run `deno task test` and verify all tests pass
