# Change: Accept repository name in repository command

## Why
Users must currently know the repository UUID to reference a specific repository explicitly. Repository names (like "vibe-kanban") are more memorable and user-friendly than UUIDs (like "abc-123-def-456").

## What Changes
- Repository commands that accept `[id]` argument now also accept repository name
- When an explicit value is provided, the CLI first tries to match by ID, then by name
- If multiple repositories share the same name, an error is shown with disambiguation options

## Impact
- Affected specs: cli-commands (Repository Show, Update, Branches commands)
- Affected code: `src/utils/repository-resolver.ts`
