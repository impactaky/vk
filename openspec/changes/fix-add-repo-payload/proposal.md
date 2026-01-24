# Change: Fix project add-repo API request payload

## Why
The `vk project add-repo` command fails with a 422 error because the API request payload is missing the required `display_name` field. The backend expects `{ repo_id, is_main, display_name }` but the CLI only sends `{ repo_id, is_main }`.

Error message:
```
Error: API error (422): Failed to deserialize the JSON body into the target type: missing field `display_name` at line 1 column 42
```

## What Changes
- Update `addProjectRepo` method in `src/api/client.ts` to include `display_name: null` in the request payload
- This is a bug fix that aligns the CLI with the backend API contract

## Impact
- Affected specs: cli-commands (no functional change, just a bug fix to existing behavior)
- Affected code: `src/api/client.ts`
