# Change: Fix project add-repo API request payload

## Why
The `vk project add-repo` command fails with a 422 error because the CLI was sending an incorrect API request payload. The backend expects `{ display_name: string, git_repo_path: string }` but the CLI was sending `{ repo_id, is_main }`.

Error message:
```
Error: API error (422): Failed to deserialize the JSON body into the target type: missing field `display_name` at line 1 column 42
```

## What Changes
- Update `CreateProjectRepo` type to match backend API contract: `{ display_name: string, git_repo_path: string }`
- Update `addProjectRepo` method in `src/api/client.ts` to accept `displayName` and `gitRepoPath` parameters
- Update `add-repo` command in `src/commands/project.ts` to use `--path` and `--display-name` options
- Update `project create` command to use `--repo-path` and `--repo-name` options instead of `--repo`
- Add integration tests for add-repo API

## Impact
- Affected specs: cli-commands (changes CLI options for `add-repo` and `project create` commands)
- Affected code: `src/api/client.ts`, `src/api/types.ts`, `src/commands/project.ts`, `tests/api_integration_test.ts`
