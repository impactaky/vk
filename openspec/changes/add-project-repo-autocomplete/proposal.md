# Proposal: Add Project Auto-Detection via Repository

## Summary
Enhance the project auto-detection logic to first resolve the current repository using the existing repository resolver, then find projects that match that repository. This enables cross-machine compatibility by leveraging the repository's git URL-based matching.

## Motivation
The current project resolver uses direct git basename matching against `project.git_repo_path`. However, this does not take advantage of the more sophisticated repository resolution logic that:
1. Uses git URL-based matching for cross-machine compatibility
2. Falls back to path-based matching
3. Uses the registered repository's `name` field when the path is not accessible

By first resolving the repository, we can use the repository's `name` (git basename) to find matching projects, improving cross-machine compatibility.

## Scope
- Modify `project-resolver.ts` to use repository-based resolution as the primary strategy
- Add new scenarios to the "Default Project Resolution" requirement spec
- Maintain backwards compatibility with existing git basename matching

## Approach
1. Attempt to resolve repository ID using existing repository resolver logic (without fzf fallback)
2. If repository found, use its `name` to find projects with matching `git_repo_path` basename
3. If exactly one project matches, use it automatically
4. If multiple projects match, warn and use the first one
5. Fall back to existing git basename matching if repository resolution fails
6. Fall back to fzf selection as last resort
