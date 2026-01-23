# Tasks: Add repositories field to Project

## Implementation Tasks

- [ ] 1. Update type definitions in `src/api/types.ts`
  - [ ] 1.1 Replace `git_repo_path: string` with `repositories: Repo[]` in `Project` interface
  - [ ] 1.2 Replace `git_repo_path: string` with `repositories: string[]` in `CreateProject` interface
  - [ ] 1.3 Remove `use_existing_repo` field from `CreateProject` (deprecated with new API)

- [ ] 2. Update project commands in `src/commands/project.ts`
  - [ ] 2.1 Update `project list` table to show repositories count instead of git_repo_path
  - [ ] 2.2 Update `project show` to display repositories array details
  - [ ] 2.3 Update `project create` to accept `--repository` option (can be repeated)
  - [ ] 2.4 Remove `--path` and `--use-existing` options from create command

- [ ] 3. Update project resolver in `src/utils/project-resolver.ts`
  - [ ] 3.1 Update matching logic to compare against repositories[].path

- [ ] 4. Update fzf utilities in `src/utils/fzf.ts`
  - [ ] 4.1 Update `formatProject` to use repositories instead of git_repo_path

- [ ] 5. Update tests
  - [ ] 5.1 Update `tests/filter_integration_test.ts` mock project data
  - [ ] 5.2 Update `src/utils/fzf_test.ts` mock project data
  - [ ] 5.3 Verify `tests/api_integration_test.ts` still passes

- [ ] 6. Update specs
  - [ ] 6.1 Create spec delta for cli-commands project requirements
