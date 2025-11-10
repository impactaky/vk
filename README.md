# vk - CLI for vibe-kanban

A command-line interface for managing [vibe-kanban](https://github.com/BloopAI/vibe-kanban) through its API. Similar to how `gh` provides CLI access to GitHub, `vk` provides CLI access to vibe-kanban.

## Installation

### Prerequisites

- [Deno](https://deno.land/) runtime installed

### Install from source

```bash
git clone https://github.com/impactaky/vk.git
cd vk
deno install --allow-net --allow-read --allow-write --allow-env -n vk main.ts
```

## Usage

### Authentication

Before using the CLI, authenticate with GitHub:

```bash
vk auth login
```

This will start the GitHub OAuth device flow. Follow the instructions to authenticate.

Check your authentication status:

```bash
vk auth status
```

Log out:

```bash
vk auth logout
```

### Configuration

Set the API URL (default is `http://localhost:3000`):

```bash
vk config set api_url http://localhost:3000
```

Get a configuration value:

```bash
vk config get api_url
```

List all configuration:

```bash
vk config list
```

### Project Management

List all projects:

```bash
vk project list
```

View project details:

```bash
vk project view <project-id>
```

Create a new project:

```bash
vk project create --name "My Project" --path /path/to/repo
```

With optional scripts:

```bash
vk project create \
  --name "My Project" \
  --path /path/to/repo \
  --setup-script "npm install" \
  --dev-script "npm run dev" \
  --cleanup-script "npm run clean"
```

Delete a project:

```bash
vk project delete <project-id>
```

### Task Management

List tasks for a project:

```bash
vk task list <project-id>
```

View task details:

```bash
vk task view <task-id>
```

Create a new task:

```bash
vk task create --project-id <project-id> --title "Task title" --description "Task description"
```

Update a task:

```bash
vk task update <task-id> --title "New title" --status DONE
```

Delete a task:

```bash
vk task delete <task-id>
```

### Task Attempt Management

List attempts for a task:

```bash
vk attempt list <task-id>
```

View attempt details:

```bash
vk attempt view <attempt-id>
```

Create a new task attempt:

```bash
vk attempt create <task-id> --executor claude-code --base-branch main
```

Send a follow-up message:

```bash
vk attempt follow-up <attempt-id> --prompt "Please fix the linting errors"
```

### Git Operations

Manage git operations for task attempts:

Merge a task attempt branch:

```bash
vk git merge <attempt-id>
```

Push branch to remote:

```bash
vk git push <attempt-id>
```

Create a GitHub pull request:

```bash
vk git create-pr <attempt-id> --title "PR title" --body "PR description" --target main
```

Rebase a task attempt:

```bash
vk git rebase <attempt-id> --new-base feature-branch
```

Change target branch:

```bash
vk git change-target <attempt-id> --target new-branch
```

Rename task attempt branch:

```bash
vk git rename-branch <attempt-id> --name new-branch-name
```

Check branch status:

```bash
vk git branch-status <attempt-id>
```

### Output Formats

Most list and view commands support JSON output:

```bash
vk project list --json
vk task view <task-id> --json
```

## Development

### Run locally

```bash
deno run --allow-net --allow-read --allow-write --allow-env main.ts <command>
```

### Lint and format

```bash
deno task lint
deno task fmt
```

### Type check

```bash
deno task check
```

## OpenSpec Development

This project follows the OpenSpec development methodology. See the `openspec/` directory for specifications and change proposals.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or pull request on GitHub.
