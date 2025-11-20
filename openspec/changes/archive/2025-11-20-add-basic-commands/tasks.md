# Tasks: Add Basic CLI Commands

## Phase 1: Project Setup
- [x] Initialize Deno project with deno.json
- [x] Add cliffy dependencies
- [x] Create project structure (src/, src/commands/, src/api/)
- [x] Set up basic entry point (main.ts)

## Phase 2: API Client
- [x] Create HTTP client wrapper for API calls
- [x] Implement configuration management (API base URL)
- [x] Add response/error types matching vibe-kanban API

## Phase 3: Project Commands
- [x] Implement `project list` command
- [x] Implement `project show <id>` command
- [x] Implement `project create` command with prompts
- [x] Implement `project delete <id>` command

## Phase 4: Task Commands
- [x] Implement `task list --project <id>` command
- [x] Implement `task show <id>` command
- [x] Implement `task create --project <id>` command
- [x] Implement `task update <id>` command
- [x] Implement `task delete <id>` command

## Phase 5: Output & Polish
- [x] Add table formatting for list outputs
- [x] Add JSON output option (--json flag)
- [x] Implement proper error messages
- [x] Add --help documentation for all commands

## Phase 6: Testing & CI
- [x] Write unit tests for API client
- [x] Write integration tests for commands
- [x] Set up GitHub Actions workflow
- [x] Add deno fmt/lint/check to CI

## Validation
- All commands execute without errors
- Commands interact correctly with vibe-kanban API
- Output is formatted and readable
- Tests pass in CI
