# Project Context

## Purpose

vk is a CLI tool for manipulating vibe-kanban (https://github.com/BloopAI/vibe-kanban) through its API. It's designed to be similar to the `gh` command for GitHub, providing a command-line interface for managing tasks, projects, and other vibe-kanban resources.

## Tech Stack

- Deno (TypeScript runtime)
- TypeScript
- vibe-kanban REST API

## Project Conventions

### Code Style

- Use Deno's built-in formatter (`deno fmt`)
- Follow Deno's standard library conventions
- Use TypeScript strict mode
- Prefer functional programming patterns where appropriate

### Architecture Patterns

- CLI command structure similar to `gh` (GitHub CLI)
- Modular command structure with subcommands
- Separate API client layer from CLI commands
- Configuration management for API endpoint and authentication

### Testing Strategy

- Use Deno's built-in test runner
- Unit tests for API client functions
- Integration tests for CLI commands (where feasible)

### Git Workflow

- Feature branches with descriptive names
- Conventional commit messages
- Pull requests for all changes

## Domain Context

vibe-kanban is a Kanban board application for managing AI coding agents. The CLI needs to interact with:

- Tasks (create, list, update, delete)
- Projects (list, view)
- Task attempts and execution processes
- Authentication (GitHub OAuth)
- Configuration settings

## Important Constraints

- Must work with vibe-kanban's existing REST API
- Authentication via GitHub OAuth (device flow or token)
- Configuration stored locally (similar to gh config)
- Must be installable and runnable via Deno

## External Dependencies

- vibe-kanban backend API (typically running on localhost:3000 or custom port)
- GitHub OAuth for authentication
