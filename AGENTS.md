# About this project

Provide cli for vibe-kanban api

## Workflow

Workflow source of truth: `.agents/commands/workflow.md`

Follow `.agents/commands/workflow.md` strictly by default.

For Deno-based validation in this repository, do not run `deno test` on the host.
Use `docker compose run --rm vk ...` so validation runs inside the compose container.

If user says `workflow off`,
do not follow `.agents/commands/workflow.md`.
Treat it as an explicit override for the current request.
