# Project Context

## Purpose
Provide cli for [vibe-kanban](https://github.com/BloopAI/vibe-kanban).
It is something like gh command for vibe-kanban.
This project also provides comamnds for using [openspec](https://github.com/Fission-AI/OpenSpec) to manage the project.

## Tech Stack
- Deno
- Typescript
- Use [deno-cliffy](https://github.com/c4spar/deno-cliffy) to make cli.

## Project Conventions

### Code Style
Use deno fmt for formatting.
Use deno lint for linting.
Use deno check for type checking.

### Architecture Patterns
Clean architecture.

### Testing Strategy
Use deno test for testing.
Use github actions for CI/CD.

### Git Workflow
github flow

## Domain Context
[vibe-kanban](https://github.com/BloopAI/vibe-kanban) has api.
openspec has flow, but basic feature doesn't have the feature to management tasks and orchestration.
For example, manage tasks dependencies, or switch agent feature are not supported.

## Important Constraints
Please make simple implementation first.

## External Dependencies
- [vibe-kanban](https://github.com/BloopAI/vibe-kanban)
- [openspec](https://github.com/Fission-AI/OpenSpec)
- [deno-cliffy](https://github.com/c4spar/deno-cliffy)