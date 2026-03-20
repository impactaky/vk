# About this project

Provide cli for vibe-kanban api

## Workflow

Workflow source of truth: `.agents/commands/workflow.md`

Follow `.agents/commands/workflow.md` strictly.

Mandatory rules:

1. Do not inspect source files, search the repo, run implementation commands, or edit code until Step 1 and Step 2 from `.agents/commands/workflow.md` are completed.
2. Before every meaningful action, state the current workflow step being executed.
3. After completing each workflow step, report the result briefly and wait for user approval before continuing to the next step.
4. If any workflow step cannot be executed exactly in the current environment, stop immediately and report the blocker. Do not substitute a different workflow.
5. Do not treat the workflow as guidance. It is a required procedure.
6. The final output must include the DoD check report in Japanese, as required by `.agents/commands/workflow.md`.
