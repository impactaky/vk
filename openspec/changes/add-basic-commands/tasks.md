# Tasks: Add Basic CLI Commands

## Phase 1: Project Setup
- [ ] Initialize Deno project with deno.json
- [ ] Add cliffy dependencies
- [ ] Create project structure (src/, src/commands/, src/api/)
- [ ] Set up basic entry point (main.ts)

## Phase 2: API Client
- [ ] Create HTTP client wrapper for API calls
- [ ] Implement configuration management (API base URL)
- [ ] Add response/error types matching vibe-kanban API

## Phase 3: Project Commands
- [ ] Implement `project list` command
- [ ] Implement `project show <id>` command
- [ ] Implement `project create` command with prompts
- [ ] Implement `project delete <id>` command

## Phase 4: Task Commands
- [ ] Implement `task list --project <id>` command
- [ ] Implement `task show <id>` command
- [ ] Implement `task create --project <id>` command
- [ ] Implement `task update <id>` command
- [ ] Implement `task delete <id>` command

## Phase 5: Output & Polish
- [ ] Add table formatting for list outputs
- [ ] Add JSON output option (--json flag)
- [ ] Implement proper error messages
- [ ] Add --help documentation for all commands

## Phase 6: Testing & CI
- [ ] Write unit tests for API client
- [ ] Write integration tests for commands
- [ ] Set up GitHub Actions workflow
- [ ] Add deno fmt/lint/check to CI

## Validation
- All commands execute without errors
- Commands interact correctly with vibe-kanban API
- Output is formatted and readable
- Tests pass in CI
