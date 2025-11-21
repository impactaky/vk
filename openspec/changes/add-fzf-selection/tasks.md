# Tasks: add-fzf-selection

## Implementation Tasks

1. [ ] Create fzf utility module with check and spawn functions
   - Check if fzf is installed
   - Display error message if not installed
   - Generic function to spawn fzf with items

2. [ ] Add fzf project selection
   - Integrate into project-resolver when auto-detect fails
   - Display projects with name and path in fzf
   - Return selected project ID

3. [ ] Add fzf task selection
   - Add to task commands (show, update, delete) when task ID omitted
   - Display tasks with title and status in fzf
   - Return selected task ID

4. [ ] Add fzf attempt selection
   - Add to attempt commands (show, update, delete, merge, push, rebase, stop, pr, branch-status) when attempt ID omitted
   - Display attempts with branch and executor in fzf
   - Return selected attempt ID

5. [ ] Add tests for fzf utility module
   - Test fzf availability check
   - Test item formatting

6. [ ] Update shell completions to work alongside fzf selection
