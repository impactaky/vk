# Proposal: Add repositories field to Project

## Summary
Replace `git_repo_path` with `repositories` array in the Project type to align with the updated vibe-kanban API that now manages projects with multiple associated repositories.

## Motivation
The vibe-kanban API has evolved to support multiple repositories per project instead of a single `git_repo_path`. The CLI needs to be updated to:
1. Send `repositories` array when creating projects
2. Display repositories information when listing/showing projects
3. Match projects based on repository paths for auto-detection

## Scope
- Update `Project` interface to replace `git_repo_path: string` with `repositories: Repo[]`
- Update `CreateProject` interface to use `repositories: string[]` (repository IDs)
- Update CLI commands (list, show, create) to work with repositories
- Update project-resolver to match against repository paths
- Update fzf display format for projects
- Update tests and specs

## Design Decisions
1. **Replace vs Add**: Replace `git_repo_path` entirely since the old API is no longer supported
2. **Repository matching**: Use first repository's path when matching projects to current git directory
3. **Display format**: Show repository count in list view, full repository details in show view

## Related
- `cli-commands` spec needs MODIFIED requirements for project commands
