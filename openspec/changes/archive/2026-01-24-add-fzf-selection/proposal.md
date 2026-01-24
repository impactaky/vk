# Proposal: add-fzf-selection

## Summary
Add interactive fzf-based selection for projects, tasks, and attempts when IDs are omitted from commands.

## Motivation
Currently, users must know and type exact IDs for projects, tasks, and attempts. This proposal enables interactive selection via fzf when:
- Project cannot be auto-detected from git remote
- Task or attempt IDs are not provided

This improves UX by allowing quick fuzzy-search selection instead of manual ID lookup.

## Scope
- Add fzf selection capability to all commands that require project, task, or attempt IDs
- Fallback to fzf only when auto-detection fails or ID is omitted
- Check for fzf installation and display helpful error if missing
- Selected item continues command execution automatically

## Non-Goals
- Bundling fzf (requires pre-installation)
- Multi-select operations
- Custom fzf themes or configurations

## Dependencies
- External: `fzf` command-line tool
