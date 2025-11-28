# Implementation Tasks

## 1. Git Utilities Enhancement
- [x] 1.1 Add `getCurrentBranch()` function to `src/utils/git.ts` that executes `git branch --show-current`
- [x] 1.2 Add `parseBranchName(branchName: string)` function to extract hash prefix from branch pattern `{username}/{hash}-{description}`
- [x] 1.3 Add tests for branch name parsing (handles various formats, returns null for non-matching patterns)

## 2. API Client Enhancement
- [x] 2.1 Add `searchAttemptsByBranch(branchName: string)` method to `src/api/client.ts`
- [x] 2.2 Handle API response and return matching attempts (may be multiple or none)

## 3. Attempt Resolver Module
- [x] 3.1 Create `src/utils/attempt-resolver.ts` module
- [x] 3.2 Implement `resolveAttemptFromBranch()` function that:
  - Gets current branch using `getCurrentBranch()`
  - Parses branch name to extract identifier
  - Searches for attempts matching the branch name via API
  - Returns the matching attempt or null if not found
- [x] 3.3 Implement `getAttemptIdWithAutoDetect(providedId?: string)` helper that:
  - Returns provided ID if given
  - Otherwise attempts auto-detection from branch
  - Falls back to interactive selection via fzf if auto-detection fails

## 4. Update Task Commands
- [x] 4.1 Update `task show` command to auto-detect task ID from current attempt's task_id when ID omitted
- [x] 4.2 Update `task update` command to auto-detect task ID from current attempt's task_id when ID omitted
- [x] 4.3 Update `task delete` command to auto-detect task ID from current attempt's task_id when ID omitted

## 5. Update Attempt Commands
- [x] 5.1 Update `attempt show` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.2 Update `attempt delete` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.3 Update `attempt update` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.4 Update `attempt merge` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.5 Update `attempt push` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.6 Update `attempt rebase` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.7 Update `attempt stop` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.8 Update `attempt pr` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.9 Update `attempt branch-status` to use `getAttemptIdWithAutoDetect()` when ID omitted
- [x] 5.10 Update `attempt list` to auto-detect task ID from current attempt when --task omitted

## 6. Testing and Validation
- [x] 6.1 Test auto-detection works when in an attempt branch
- [x] 6.2 Test fallback to interactive selection when not in an attempt branch
- [x] 6.3 Test explicit ID argument takes precedence over auto-detection
- [x] 6.4 Test error handling when API is unavailable or branch doesn't match any attempt
- [x] 6.5 Run `deno check` to verify type correctness
- [x] 6.6 Run `deno lint` to ensure code quality
- [x] 6.7 Run `deno test` to verify all tests pass

## 7. Documentation
- [x] 7.1 Update command help text to mention auto-detection behavior
- [x] 7.2 Add examples to README showing auto-detection usage
