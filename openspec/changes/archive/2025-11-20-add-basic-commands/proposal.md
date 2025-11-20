# Proposal: Add Basic CLI Commands

## Summary
Implement basic CLI commands for interacting with the vibe-kanban API, similar to how `gh` works for GitHub. This provides a command-line interface for managing projects and tasks.

## Motivation
Users need a CLI tool to interact with vibe-kanban without using the web UI. This enables:
- Automation and scripting of vibe-kanban workflows
- Quick task management from the terminal
- Integration with other CLI tools and workflows

## Scope

### In Scope
- Project commands: list, show, create, delete
- Task commands: list, show, create, update, delete
- Configuration for API endpoint
- Basic error handling and output formatting

### Out of Scope
- Task attempt management (future enhancement)
- Execution process control (future enhancement)
- Real-time streaming/websocket features
- Authentication/OAuth flows

## Approach
Use deno-cliffy to build a hierarchical command structure:
- `vk project list` - List all projects
- `vk project show <id>` - Show project details
- `vk project create` - Create a new project
- `vk project delete <id>` - Delete a project
- `vk task list --project <id>` - List tasks for a project
- `vk task show <id>` - Show task details
- `vk task create --project <id>` - Create a new task
- `vk task update <id>` - Update a task
- `vk task delete <id>` - Delete a task

## Dependencies
- deno-cliffy for CLI framework
- vibe-kanban API (local or remote)
