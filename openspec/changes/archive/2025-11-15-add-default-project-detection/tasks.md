# Implementation Tasks

## 1. Git Utility Functions

- [x] 1.1 Create `src/utils/git.ts` module
- [x] 1.2 Implement `getGitRemoteUrl()` to execute `git remote get-url origin`
- [x] 1.3 Implement `extractRepoBasename()` to parse repository name from URL
- [x] 1.4 Add error handling for non-git directories

## 2. Project Detection Logic

- [x] 2.1 Create `getDefaultProjectId()` utility function
- [x] 2.2 Fetch all projects from the API
- [x] 2.3 Match git repo basename against project names or git_repo_path
- [x] 2.4 Return matched project ID or throw descriptive error

## 3. Update Task Commands

- [x] 3.1 Modify `taskList()` to accept optional `projectId` parameter
- [x] 3.2 Call `getDefaultProjectId()` when `projectId` is not provided
- [x] 3.3 Update `taskCreate()` to support auto-detection for `--project-id`
- [x] 3.4 Add clear error messages for detection failures

## 4. Update CLI Interface

- [x] 4.1 Make `<project-id>` optional in `task list` command (main.ts:149)
- [x] 4.2 Make `--project-id` optional in `task create` command (main.ts:167)
- [x] 4.3 Update help text to indicate auto-detection capability

## 5. Testing & Validation

- [x] 5.1 Test in a git repository with matching project
- [x] 5.2 Test explicit `--project-id` override
- [x] 5.3 Test error handling for non-git directories
- [x] 5.4 Test error handling when no matching project is found
- [x] 5.5 Ensure backward compatibility with existing scripts
