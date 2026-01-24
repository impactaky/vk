# Change: Fix project repos command to handle API response correctly

## Why
The `vk project repos` command and project resolver fail because the CLI expects `ProjectRepo[]` with `repo_id`, `is_main`, `created_at` fields, but the vibe-kanban API returns `Repo[]` (full repository objects) from `GET /projects/{id}/repositories`.

## What Changes
- Update `listProjectRepos` in `src/api/client.ts` to return `Repo[]` instead of `ProjectRepo[]`
- Update `vk project repos` command in `src/commands/project.ts` to display Repo fields (id, name, path) instead of ProjectRepo fields
- Update project resolver in `src/utils/project-resolver.ts` to use `repo.id` directly instead of `pr.repo_id`
- Remove unnecessary `client.getRepo()` call in project resolver since we already get full Repo objects

## Impact
- Affected specs: cli-commands
- Affected code: `src/api/client.ts`, `src/commands/project.ts`, `src/utils/project-resolver.ts`
