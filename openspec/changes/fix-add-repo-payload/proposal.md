# Change: Fix project add-repo API request payload

## Why
The `vk project add-repo` command fails with a 422 error because the API request payload is missing the required `display_name` field. The backend expects `{ repo_id, is_main, display_name }` but the CLI only sends `{ repo_id, is_main }`.

Error message:
```
Error: API error (422): Failed to deserialize the JSON body into the target type: missing field `display_name` at line 1 column 42
```

## What Changes
- Update `addProjectRepo` method in `src/api/client.ts` to accept optional `displayName` parameter (defaults to `null`)
- Add `--display-name` option to `add-repo` command in `src/commands/project.ts`
- This fixes the bug and allows users to optionally specify a custom display name when adding a repository to a project

## Impact
- Affected specs: cli-commands (adds `--display-name` option to `add-repo` command)
- Affected code: `src/api/client.ts`, `src/commands/project.ts`
