# Change Proposal: set-default-project-from-git

## Summary
Automatically set the default project ID based on the current git repository's URL basename, removing the need to specify `--project` for every task command.

## Motivation
Currently, users must specify `--project <id>` for every task-related command, which is tedious when working within a git repository that corresponds to a vibe-kanban project. By detecting the current git repo's remote URL basename and matching it against registered projects' `git_repo_path` basenames, the CLI can automatically determine the project context.

## Scope
- Add utility to get current git remote URL
- Add utility to extract basename from git URL (handles various formats: SSH, HTTPS, with/without .git)
- Modify task commands to use detected project when `--project` is not specified
- Match by comparing basenames of `git_repo_path` from projects

## Approach
1. Get current directory's git remote origin URL via `git remote get-url origin`
2. Extract basename (e.g., `vibe-kanban` from `https://github.com/BloopAI/vibe-kanban.git`)
3. List all projects and find one whose `git_repo_path` basename matches
4. Use that project's ID as the default when `--project` is omitted

## Dependencies
- Existing project list API
- Git CLI availability

## Risks
- Multiple projects may share the same repo basename (use first match, warn if multiple)
- User may not be in a git repository (graceful fallback to requiring --project)
