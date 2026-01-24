# Change: Add project name resolution

## Why
Users must currently know the project UUID to reference a specific project explicitly. Project names (like "vibe-kanban") are more memorable and user-friendly than UUIDs. This mirrors the existing repository name resolution feature.

## What Changes
- Project commands that accept `--project` argument now also accept project name
- When an explicit value is provided, the CLI first tries to match by ID, then by name
- If multiple projects share the same name, an error is shown with disambiguation options

## Impact
- Affected specs: cli-commands
- Affected code: `src/utils/project-resolver.ts`
