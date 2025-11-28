# Implementation Tasks

## 1. Git Utility Enhancement
- [ ] 1.1 Add `getCurrentBranchName()` function to `src/utils/git.ts` to get current git branch
- [ ] 1.2 Add `extractTaskIdFromBranch(branchName: string)` function to parse task ID from branch names
- [ ] 1.3 Add `getCurrentTaskId()` function that combines the above two functions for convenience
- [ ] 1.4 Add unit tests or validation for task ID extraction logic

## 2. Task Commands Integration
- [ ] 2.1 Update `vk task show` to accept optional task ID and auto-detect from branch when omitted
- [ ] 2.2 Update `vk task update` to accept optional task ID and auto-detect from branch when omitted
- [ ] 2.3 Update `vk task delete` to accept optional task ID and auto-detect from branch when omitted
- [ ] 2.4 Add clear error messages when auto-detection fails (not in a git repo, invalid branch format, etc.)

## 3. Attempt Commands Integration
- [ ] 3.1 Update `vk attempt list` to make --task flag optional and auto-detect from branch when omitted
- [ ] 3.2 Update `vk attempt create` to make --task flag optional and auto-detect from branch when omitted
- [ ] 3.3 Add clear error messages when auto-detection fails
- [ ] 3.4 Update help text to indicate --task is optional when in a task branch

## 4. Testing & Documentation
- [ ] 4.1 Test all commands with explicit task IDs (ensure backwards compatibility)
- [ ] 4.2 Test all commands without task IDs in valid task branches
- [ ] 4.3 Test error scenarios (invalid branch format, not in git repo, etc.)
- [ ] 4.4 Update command help text to reflect optional task ID behavior
