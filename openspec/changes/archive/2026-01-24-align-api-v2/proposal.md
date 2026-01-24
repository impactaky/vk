# Proposal: Align vk CLI with Latest vibekanban API v2

## Summary

Update the vk CLI to match the latest vibekanban API structure. The API has undergone significant changes:
- Projects are now multi-repository (no longer have `git_repo_path`)
- Many fields removed from Project, Task types
- TaskAttempt renamed to Workspace with new fields
- New endpoints for project-repository management

## Motivation

The current CLI implementation uses outdated type definitions and API contracts that no longer match the vibekanban server. This causes:
- API calls to fail due to missing/extra fields
- CLI displaying non-existent properties
- Inability to use new features like multi-repository projects

## Scope

### In Scope
- Update all type definitions (Project, Task, Workspace)
- Update API client methods
- Update CLI commands to remove obsolete options and add new ones
- Update project resolver for multi-repository projects
- Update specs to reflect new API structure

### Out of Scope
- New commands beyond repository management
- UI changes beyond field updates

## Key Changes

### Type Changes

**Project**:
- Remove: `git_repo_path`, `description`, `hex_color`, `is_archived`, `setup_script`, `dev_script`, `cleanup_script`, `copy_files`
- Add: `default_agent_working_dir`

**Task**:
- Remove: `priority`, `due_date`, `labels`, `percent_done`, `hex_color`, `is_favorite`
- Rename: `parent_task_attempt` → `parent_workspace_id`

**TaskAttempt → Workspace**:
- Remove: `target_branch`, `executor`, `worktree_deleted`
- Add: `agent_working_dir`, `archived`, `pinned`, `name`

### CLI Option Removals
- `project list --archived`, `--color`
- `project create --path`, `--use-existing`, `--description`, `--color`
- `project update --description`, `--color`, `--archived`
- `task list --priority`, `--executor`, `--label`, `--favorite`, `--color`
- `task create/update` various removed fields
- `attempt update --target-branch`

### New Features
- Project repository management subcommands (`repos`, `add-repo`, `remove-repo`)
- Workspace update with `--name`, `--archived`, `--pinned`
- Workspace repos subcommand

## Dependencies

None - this is an API alignment change.

## Risks

- Breaking change for existing CLI users
- Need to update documentation and specs
