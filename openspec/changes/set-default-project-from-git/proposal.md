# Set Default Project from Git URL

## Summary
Automatically set the default vibe-kanban project ID based on the current git repository's remote URL basename.

## Problem
Users must manually specify the project ID for each CLI command, even when working within a git repository that corresponds to a specific vibe-kanban project.

## Solution
When a CLI command is executed without an explicit project ID:
1. Get the current directory's git remote URL
2. Extract the basename (e.g., "vk" from `https://github.com/impactaky/vk.git`)
3. Query vibe-kanban API for projects
4. Find a project whose git URL has the same basename
5. Use that project's ID as the default

## Scope
- Add git URL detection utility
- Add project lookup by git URL basename
- Integrate into CLI command execution flow

## Out of Scope
- Caching project lookups
- Multiple git remotes handling (use origin only)
- Manual project ID override (already exists)
