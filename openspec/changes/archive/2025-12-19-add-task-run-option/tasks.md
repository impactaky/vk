# Tasks

## Implementation Tasks

1. [x] Add `--run` and `--executor` options to `task create` command
   - Add `--run` boolean flag to trigger immediate attempt creation
   - Add `--executor` option to specify executor profile (format: `<name>:<variant>`)
   - Add `--base-branch` option for attempt base branch (defaults to "main")
   - Add `--target-branch` option for attempt target branch (optional)

2. [x] Implement attempt creation logic in task create action
   - After task creation, if `--run` is specified, create an attempt
   - Validate that `--executor` is provided when `--run` is specified
   - Display attempt details (ID, branch) along with task creation confirmation

3. [x] Add validation for option combinations
   - Error if `--run` is specified without `--executor`
   - Move `parseExecutorString` utility to shared location for reuse

4. [x] Update cli-commands spec with new scenarios

5. [x] Manual testing
   - Test `vk task create --title "Test" --run --executor CLAUDE_CODE:DEFAULT`
   - Test error case: `vk task create --title "Test" --run` (missing executor)
   - Verify attempt is created and execution starts
