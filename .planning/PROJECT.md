# vibe-kanban CLI (vk)

## What This Is

A command-line interface for [vibe-kanban](https://github.com/BloopAI/vibe-kanban), similar to how `gh` works for GitHub. Enables developers to manage projects, tasks, workspaces (attempts), and repositories from the terminal with interactive fzf selection and git-based auto-detection.

## Core Value

Developers can efficiently manage vibe-kanban workflows from the command line without switching to the web UI.

## Current Milestone: v1.1 Attempt Workflow Enhancements

**Goal:** Add convenience commands for working with attempts — open in browser, cd into workdir, and spin-off to new task.

**Target features:**
- `vk attempt open` — Open workspace in browser
- `vk attempt cd` — SSH (if remote) and cd to workspace workdir
- `vk attempt spin-off` — Create new task from current workspace branch

## Requirements

### Validated

<!-- Shipped and confirmed working -->

- ✓ Project CRUD operations (list, show, create, update, delete)
- ✓ Task CRUD operations (list, show, create, update, delete, open)
- ✓ Workspace/Attempt management (list, show, create, update, delete)
- ✓ Git operations (merge, push, rebase, branch-status, rename-branch)
- ✓ PR operations (create, attach, get comments)
- ✓ Repository management (list, show, register, init)
- ✓ Interactive fzf selection for projects/tasks/attempts
- ✓ Git-based project auto-detection
- ✓ Configuration management (api-url)
- ✓ Shell completions (bash, zsh, fish)
- ✓ Verbose logging mode
- ✓ Sessions API integration (list, show, follow-up)
- ✓ Session-based follow-up endpoint (`/api/sessions/{id}/follow-up`)
- ✓ Multi-repo workspace support (`repos[]` array in createWorkspace)
- ✓ CLI types aligned with vibe-kanban API schema
- ✓ CLI client integration tests for API schema validation

### Active

<!-- Current scope. Building toward these. -->

- `vk attempt open` — Open workspace URL in browser
- `vk attempt cd` — SSH + cd to agent_working_dir (configurable shell, default bash)
- `vk attempt spin-off` — Create task with parent_workspace_id, spawns workspace from parent branch

### Out of Scope

<!-- Explicit boundaries -->

- WebSocket streaming — CLI is request/response focused
- Real-time log tailing — Would require terminal UI library
- Authentication — API currently doesn't require it

## Context

**Technical environment:**
- Deno 2.x runtime
- Cliffy for CLI framework
- vibe-kanban backend API (Rust/Axum)
- Optional fzf integration for interactive selection

**API structure:**
- Workspaces contain Sessions
- Sessions track conversation threads with AI agents
- Follow-ups target sessions, not workspaces directly

## Constraints

- **Runtime**: Deno 2.x — Established, no migration
- **Dependencies**: Cliffy CLI framework — Established pattern
- **API compatibility**: Must work with current vibe-kanban backend

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use "attempt" as CLI term for "workspace" | User familiarity, matches mental model | ✓ Good |
| Client-side filtering | Reduces API complexity, acceptable perf | ✓ Good |
| Optional fzf dependency | Graceful degradation, power user feature | ✓ Good |
| Use prompt field (not message) in FollowUpRequest | Match API schema | ✓ v1.0 |
| CLAUDE_CODE as default executor for follow-up | Most common use case | ✓ v1.0 |
| Single session auto-selects, multiple triggers fzf | Optimize common case | ✓ v1.0 |
| Keep --message flag, map to prompt internally | Backward compatibility | ✓ v1.0 |

---
*Last updated: 2026-02-01 — v1.1 milestone started*
