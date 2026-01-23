# Tasks

## Implementation

1. [ ] Add imports to `project-resolver.ts` for `getRepoBasenameFromPath` and `Repo` type
2. [ ] Add `isPathWithinRepo` helper function to `project-resolver.ts`
3. [ ] Add `tryResolveRepository` helper function that attempts repository resolution without fzf fallback
4. [ ] Modify `resolveProjectFromGit` to use 3-tier strategy:
   - Strategy 1: Repository-based matching (NEW)
   - Strategy 2: Direct git basename matching (existing)
   - Strategy 3: fzf selection (existing)
5. [ ] Add unit tests for `isPathWithinRepo` and `tryResolveRepository`
6. [ ] Add integration tests for cross-machine project resolution

## Validation

7. [ ] Run `deno lint` and fix any issues
8. [ ] Run `deno task test` and verify all tests pass
