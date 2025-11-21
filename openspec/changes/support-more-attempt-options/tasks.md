## 1. API Client Extensions
- [ ] 1.1 Add deleteAttempt method to ApiClient
- [ ] 1.2 Add updateAttempt method (change-target-branch, rename-branch)
- [ ] 1.3 Add mergeAttempt method
- [ ] 1.4 Add pushAttempt method
- [ ] 1.5 Add rebaseAttempt method
- [ ] 1.6 Add stopAttempt method
- [ ] 1.7 Add createPR method
- [ ] 1.8 Add getBranchStatus method

## 2. Type Definitions
- [ ] 2.1 Add UpdateAttempt type
- [ ] 2.2 Add BranchStatus type
- [ ] 2.3 Add CreatePRRequest type

## 3. CLI Commands
- [ ] 3.1 Add attempt delete command
- [ ] 3.2 Add attempt update command with --target-branch and --branch options
- [ ] 3.3 Add attempt merge command
- [ ] 3.4 Add attempt push command
- [ ] 3.5 Add attempt rebase command
- [ ] 3.6 Add attempt stop command
- [ ] 3.7 Add attempt pr command
- [ ] 3.8 Add attempt branch-status command
- [ ] 3.9 Extend attempt create with --target-branch option

## 4. Testing & Validation
- [ ] 4.1 Test all new commands
- [ ] 4.2 Run deno check and deno lint
