## 1. API Client Extensions
- [x] 1.1 Add deleteAttempt method to ApiClient
- [x] 1.2 Add updateAttempt method (change-target-branch, rename-branch)
- [x] 1.3 Add mergeAttempt method
- [x] 1.4 Add pushAttempt method
- [x] 1.5 Add rebaseAttempt method
- [x] 1.6 Add stopAttempt method
- [x] 1.7 Add createPR method
- [x] 1.8 Add getBranchStatus method

## 2. Type Definitions
- [x] 2.1 Add UpdateAttempt type
- [x] 2.2 Add BranchStatus type
- [x] 2.3 Add CreatePRRequest type

## 3. CLI Commands
- [x] 3.1 Add attempt delete command
- [x] 3.2 Add attempt update command with --target-branch and --branch options
- [x] 3.3 Add attempt merge command
- [x] 3.4 Add attempt push command
- [x] 3.5 Add attempt rebase command
- [x] 3.6 Add attempt stop command
- [x] 3.7 Add attempt pr command
- [x] 3.8 Add attempt branch-status command
- [x] 3.9 Extend attempt create with --target-branch option

## 4. Testing & Validation
- [x] 4.1 Test all new commands
- [x] 4.2 Run deno check and deno lint
