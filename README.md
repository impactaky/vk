# vibe-kanban CLI

A command-line interface for [vibe-kanban](https://github.com/BloopAI/vibe-kanban), similar to how `gh` works for GitHub.

## Installation

Requires [Deno](https://deno.land/) v2.x.

### Install as `vk` command

```bash
# Install globally (run from the project directory)
deno install -g --allow-net --allow-read --allow-write --allow-env --allow-run=git -n vk --config deno.json src/main.ts

# Now you can use it anywhere
vk --help
vk project list
```

To uninstall:

```bash
deno uninstall -g vk
```

### Run without installing

```bash
# Run directly
deno run --allow-net --allow-read --allow-write --allow-env --allow-run=git src/main.ts --help

# Or use the dev task
deno task dev --help
```

## Usage

### Configuration

Set the API endpoint (defaults to `http://localhost:3000`):

```bash
vk config set api-url http://localhost:3000
vk config show
```

### Project Commands

```bash
# List all projects
vk project list
vk project list --json

# Show project details
vk project show <project-id>

# Create a new project
vk project create
vk project create --name "My Project" --path "/path/to/repo"

# Delete a project
vk project delete <project-id>
vk project delete <project-id> --force
```

### Task Commands

```bash
# List tasks for a project
vk task list --project <project-id>
vk task list --project <project-id> --json

# Show task details
vk task show <task-id>

# Create a new task
vk task create --project <project-id>
vk task create --project <project-id> --title "Fix bug" --description "Details here"

# Update a task
vk task update <task-id> --title "New title"
vk task update <task-id> --status completed

# Delete a task
vk task delete <task-id>
vk task delete <task-id> --force
```

## Development

```bash
# Format code
deno task fmt

# Lint
deno task lint

# Type check
deno task check

# Run tests
deno task test
```

## License

MIT
