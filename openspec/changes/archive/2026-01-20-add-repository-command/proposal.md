# Change: Add Repository Command

## Why
Vibekanban now provides a Repository API for managing git repositories independently from projects. The vk CLI needs a `repository` command to expose this functionality, allowing users to list, show, register, initialize, update, and view branches of repositories.

## What Changes
- Add new `repository` command with subcommands: `list`, `show`, `register`, `init`, `update`, `branches`
- Add Repository-related types to `src/api/types.ts`
- Add Repository API client methods to `src/api/client.ts`
- Create new `src/commands/repository.ts` command file
- Register the command in `src/main.ts`

## Impact
- Affected specs: `cli-commands`
- Affected code:
  - `src/api/types.ts` - Add Repo, UpdateRepo, RegisterRepoRequest, InitRepoRequest, GitBranch types
  - `src/api/client.ts` - Add listRepos, getRepo, updateRepo, registerRepo, initRepo, getRepoBranches methods
  - `src/commands/repository.ts` - New file
  - `src/main.ts` - Register repositoryCommand
