# Tasks: Add Repository Command

## 1. Types
- [ ] 1.1 Add `Repo` interface to `src/api/types.ts`
- [ ] 1.2 Add `UpdateRepo` interface
- [ ] 1.3 Add `RegisterRepoRequest` interface
- [ ] 1.4 Add `InitRepoRequest` interface
- [ ] 1.5 Add `GitBranch` interface

## 2. API Client
- [ ] 2.1 Add `listRepos()` method to ApiClient
- [ ] 2.2 Add `getRepo(id)` method
- [ ] 2.3 Add `updateRepo(id, update)` method
- [ ] 2.4 Add `registerRepo(request)` method
- [ ] 2.5 Add `initRepo(request)` method
- [ ] 2.6 Add `getRepoBranches(id)` method

## 3. Repository Command
- [ ] 3.1 Create `src/commands/repository.ts` with base command
- [ ] 3.2 Implement `list` subcommand with --name, --path, --json options
- [ ] 3.3 Implement `show` subcommand with --json option
- [ ] 3.4 Implement `register` subcommand with --path, --display-name options
- [ ] 3.5 Implement `init` subcommand with --parent-path, --folder-name options
- [ ] 3.6 Implement `update` subcommand with script and config options
- [ ] 3.7 Implement `branches` subcommand with --remote, --local, --json options

## 4. Integration
- [ ] 4.1 Register `repositoryCommand` in `src/main.ts`

## 5. Verification
- [ ] 5.1 Run `deno lint`
- [ ] 5.2 Run `deno fmt --check`
- [ ] 5.3 Test commands manually against running vibe-kanban instance
