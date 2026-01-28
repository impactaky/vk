# Tasks: Add Verbose Option

## Implementation Tasks

### 1. Create verbose state module
- [x] Create `src/utils/verbose.ts` with:
  - [x] `setVerbose(enabled: boolean)` function
  - [x] `isVerbose()` function
  - [x] `verboseLog(message: string)` function that logs to stderr
- **Verification**: Module exports correctly, functions work as expected

### 2. Add verbose flag to CLI entry point
- [x] Modify `src/main.ts`:
  - [x] Add `-v, --verbose` option to CLI definition
  - [x] Check for flag before parsing and call `setVerbose(true)`
- **Verification**: `vk --help` shows verbose option

### 3. Instrument API client for verbose logging
- [x] Modify `src/api/client.ts`:
  - [x] Import verbose module
  - [x] Update `request<T>()` method to log request details (method, URL, body)
  - [x] Log response details (status, body) using `response.clone()`
- **Verification**: `vk project list -v` shows API request/response details

### 4. Test verbose output format
- [ ] Manual testing:
  - [ ] Verify verbose output goes to stderr
  - [ ] Verify `vk project list -v --json | jq .` produces valid JSON
  - [ ] Verify POST requests show request body
- **Verification**: All scenarios from spec pass

## Dependencies
- Task 1 must complete before Tasks 2 and 3
- Tasks 2 and 3 can be done in parallel
- Task 4 depends on Tasks 2 and 3
