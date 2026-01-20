# Tasks: Add Repository Command

## 1. Types
- [x] 1.1 Add `Repo` interface to `src/api/types.ts`
- [x] 1.2 Add `UpdateRepo` interface
- [x] 1.3 Add `RegisterRepoRequest` interface
- [x] 1.4 Add `InitRepoRequest` interface
- [x] 1.5 Add `GitBranch` interface

## 2. API Client
- [x] 2.1 Add `listRepos()` method to ApiClient
- [x] 2.2 Add `getRepo(id)` method
- [x] 2.3 Add `updateRepo(id, update)` method
- [x] 2.4 Add `registerRepo(request)` method
- [x] 2.5 Add `initRepo(request)` method
- [x] 2.6 Add `getRepoBranches(id)` method

## 3. Repository Command
- [x] 3.1 Create `src/commands/repository.ts` with base command
- [x] 3.2 Implement `list` subcommand with --name, --path, --json options
- [x] 3.3 Implement `show` subcommand with --json option
- [x] 3.4 Implement `register` subcommand with --path, --display-name options
- [x] 3.5 Implement `init` subcommand with --parent-path, --folder-name options
- [x] 3.6 Implement `update` subcommand with script and config options
- [x] 3.7 Implement `branches` subcommand with --remote, --local, --json options

## 4. Integration
- [x] 4.1 Register `repositoryCommand` in `src/main.ts`

## 5. Verification
- [x] 5.1 Run `deno lint`
- [x] 5.2 Run `deno fmt --check`
- [ ] 5.3 Test commands manually against running vibe-kanban instance
