---
phase: quick
plan: 003
type: execute
wave: 1
depends_on: []
files_modified:
  - src/commands/attempt.ts
  - tests/cli_commands_integration_test.ts
autonomous: true

must_haves:
  truths:
    - "User can run `vk attempt spin-off --run --executor CLAUDE_CODE:DEFAULT` to create task and workspace in one command"
    - "Without --run flag, spin-off behaves exactly as before"
    - "--executor is required when --run is specified"
  artifacts:
    - path: "src/commands/attempt.ts"
      provides: "spin-off command with --run, --executor, --target-branch options"
      contains: "--run"
    - path: "tests/cli_commands_integration_test.ts"
      provides: "Integration test for spin-off --run"
      contains: "spin-off.*--run"
  key_links:
    - from: "src/commands/attempt.ts"
      to: "client.createWorkspace"
      via: "workspace creation after task creation when --run specified"
      pattern: "createWorkspace"
---

<objective>
Add `--run` option to `vk attempt spin-off` command.

Purpose: Allow users to create a child task AND immediately start a workspace in one command, matching the UX of `vk task create --run`.

Output: Updated spin-off command with --run, --executor, and --target-branch options.
</objective>

<execution_context>
@/home/impactaky/shelffiles/config/claude/get-shit-done/workflows/execute-plan.md
@/home/impactaky/shelffiles/config/claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/commands/attempt.ts (spin-off command at line 1054-1123)
@src/commands/task.ts (reference: task create --run at line 123-228)
@tests/cli_commands_integration_test.ts (existing spin-off test at line 59-184)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add --run option to spin-off command</name>
  <files>src/commands/attempt.ts</files>
  <action>
    Add three new options to the spin-off command (around line 1063):
    - `--run`: boolean flag to create workspace immediately after task
    - `--executor <executor:string>`: executor profile in format NAME:VARIANT (required when --run specified)
    - `--target-branch <branch:string>`: target branch for workspace repos

    Modify the action handler to:
    1. Add validation: if --run specified but not --executor, error and exit
    2. After task creation, if --run is specified:
       - Parse executor string using `parseExecutorString(options.executor)`
       - Get project repos using `client.listProjectRepos(parentTask.project_id)`
       - Build repos array with target branches (use options.targetBranch or repo.default_target_branch or "main")
       - Create workspace using `client.createWorkspace()`
       - Output workspace ID and branch after task ID

    Follow the exact pattern from task.ts lines 133-223 for the --run implementation.

    Update output format when --run is used:
    - Current: `{task.id} {task.title}`
    - With --run: `{task.id} {task.title}` followed by `Workspace: {workspace.id}` and `Branch: {workspace.branch}`
  </action>
  <verify>Run `deno check src/commands/attempt.ts` - should pass with no type errors</verify>
  <done>spin-off command accepts --run, --executor, and --target-branch options; validates --executor requirement; creates workspace when --run specified</done>
</task>

<task type="auto">
  <name>Task 2: Add integration test for spin-off --run</name>
  <files>tests/cli_commands_integration_test.ts</files>
  <action>
    Add a new test case after the existing "CLI: vk attempt spin-off creates task with parent_workspace_id" test (around line 184).

    Test: "CLI: vk attempt spin-off --run creates task and workspace"

    Test steps:
    1. Create project with repository (same setup as existing spin-off test)
    2. Create parent task and workspace
    3. Run spin-off with --run --executor CLAUDE_CODE:DEFAULT --title "Child task" --message "Test"
    4. Verify command exits with code 0
    5. Parse task ID from output
    6. Verify task was created with correct parent_workspace_id
    7. Verify a workspace exists for the new task (via API call to list workspaces)
    8. Cleanup: delete child workspace, child task, parent workspace, parent task, project, test directory

    Follow the pattern of the existing spin-off test but add workspace verification.
  </action>
  <verify>Run `deno test --allow-all tests/cli_commands_integration_test.ts --filter "spin-off"` - both tests should pass</verify>
  <done>Integration test verifies spin-off --run creates both task and workspace</done>
</task>

</tasks>

<verification>
```bash
# Type check
deno check src/commands/attempt.ts

# Run spin-off related tests
deno test --allow-all tests/cli_commands_integration_test.ts --filter "spin-off"

# Manual verification (if API available)
# vk attempt spin-off <workspace-id> --run --executor CLAUDE_CODE:DEFAULT --title "Test" --message "Test message"
```
</verification>

<success_criteria>
- `vk attempt spin-off --run --executor CLAUDE_CODE:DEFAULT` creates task and workspace
- `vk attempt spin-off` without --run works exactly as before
- `vk attempt spin-off --run` without --executor shows error message
- Integration tests pass for both spin-off and spin-off --run
</success_criteria>

<output>
After completion, create `.planning/quick/003-add-run-option-to-vk-attempt-spin-off/003-SUMMARY.md`
</output>
