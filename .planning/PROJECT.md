# vibe-kanban CLI (vk)

## What This Is

A command-line interface for [vibe-kanban](https://github.com/BloopAI/vibe-kanban), similar to how `gh` works for GitHub. Enables developers to manage projects, tasks, workspaces (attempts), and repositories from the terminal with interactive fzf selection and git-based auto-detection.

## Core Value

Developers can efficiently manage vibe-kanban workflows from the command line without switching to the web UI.

## Current Milestone: v1.0 Align with vibe-kanban API

**Goal:** Update CLI to match the current vibe-kanban backend API, fixing broken commands and adding missing endpoints.

**Target features:**
- Fix `attempt follow-up` to use sessions API
- Add session-related commands/functionality
- Verify and fix any other API mismatches

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Sessions API integration (follow-up endpoint fix)
- [ ] Verify all endpoints match current API

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

**Current issue:**
The vibe-kanban API introduced a Sessions abstraction. Follow-up messages now go to `/api/sessions/{id}/follow-up` instead of the old `/api/task-attempts/{id}/follow-up`. The CLI needs to adapt to this change.

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

---
*Last updated: 2026-01-30 after milestone v1.0 initialization*
