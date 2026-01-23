# Tasks: Align vk CLI with Latest vibekanban API v2

## Implementation Order

Tasks are ordered by dependency - complete earlier tasks before later ones.

### Phase 1: Type Definitions

- [x] **T1**: Update `src/api/types.ts` - Project type
  - Remove: `git_repo_path`, `description`, `hex_color`, `is_archived`, scripts
  - Add: `default_agent_working_dir: string | null`
  - Update: `remote_project_id: string | null`

- [x] **T2**: Update `src/api/types.ts` - CreateProject type
  - Replace fields with `repositories: CreateProjectRepo[]`
  - Add `CreateProjectRepo` interface

- [x] **T3**: Update `src/api/types.ts` - UpdateProject type
  - Keep only `name?: string | null`

- [x] **T4**: Update `src/api/types.ts` - Task type
  - Remove: `priority`, `due_date`, `labels`, `percent_done`, `hex_color`, `is_favorite`
  - Rename: `parent_task_attempt` → `parent_workspace_id`

- [x] **T5**: Update `src/api/types.ts` - CreateTask/UpdateTask types
  - Remove obsolete fields

- [x] **T6**: Rename TaskAttempt to Workspace in `src/api/types.ts`
  - Remove: `target_branch`, `executor`, `worktree_deleted`
  - Add: `agent_working_dir`, `archived`, `pinned`, `name`
  - Add `UpdateWorkspace` interface

- [x] **T7**: Add new types: `ProjectRepo`, `WorkspaceRepo`, `CreateProjectRepo`

### Phase 2: API Client

- [x] **T8**: Update `src/api/client.ts` imports for renamed types

- [x] **T9**: Rename attempt methods to workspace methods (keep `/task-attempts` endpoint)

- [x] **T10**: Add `updateWorkspace()` method

- [x] **T11**: Add project repository methods: `listProjectRepos()`, `addProjectRepo()`, `removeProjectRepo()`

- [x] **T12**: Add `getWorkspaceRepos()` method

- [x] **T13**: Remove `changeTargetBranch()` method

### Phase 3: Utilities

- [x] **T14**: Update `src/utils/fzf.ts` - formatProject, formatWorkspace

- [x] **T15**: Update `src/utils/project-resolver.ts` for multi-repository projects

- [x] **T16**: Update `src/utils/attempt-resolver.ts` type references

### Phase 4: Commands

- [x] **T17**: Update `src/commands/project.ts`
  - Remove obsolete options from list, create, update
  - Update display fields
  - Add repository subcommands

- [x] **T18**: Update `src/commands/task.ts`
  - Remove obsolete options and filters
  - Update display fields

- [x] **T19**: Update `src/commands/attempt.ts`
  - Rename TaskAttempt references to Workspace
  - Update options and display fields
  - Add repos subcommand

### Phase 5: Tests

- [x] **T20**: Update test files for new type schemas

### Phase 6: Specs

- [x] **T21**: Update cli-commands spec to reflect removed fields and new structure

## Validation

- Run `deno check src/main.ts` after each phase
- Run `deno test` after all phases
- Run `docker compose run --rm vk` for integration test
