# vibe-kanban CLI

A command-line interface for
[vibe-kanban](https://github.com/BloopAI/vibe-kanban), similar to how `gh` works
for GitHub.

## QuickStart

Get started with `vk` in under 2 minutes:

### 1. Install vk

**From Deno:**

```bash
deno install -g --allow-net --allow-read --allow-write --allow-env --allow-run=git,fzf -n vk https://raw.githubusercontent.com/BloopAI/vk/main/src/main.ts
```

**From GitHub releases:** Download pre-built binaries from the
[releases page](https://github.com/BloopAI/vk/releases).

#### 1.1 Configure shell completion (optional)

```bash
# Bash
echo 'source <(vk completions bash)' >> ~/.bashrc

# Zsh
echo 'source <(vk completions zsh)' >> ~/.zshrc

# Fish
echo 'source (vk completions fish | psub)' >> ~/.config/fish/config.fish
```

### 2. Set API URL

```bash
vk config set api-url https://your-vibe-kanban-instance.com
```

### 3. Verify connection

```bash
vk project list
```

### 4. Create and run your first task

```bash
vk task create --run --message 'Your task description' --title 'My first task' --executor 'CLAUDE_CODE:DEFAULT'
```

## Installation

Requires [Deno](https://deno.land/) v2.x.

### Optional: Install fzf for interactive selection

For interactive project/task/attempt selection, install
[fzf](https://github.com/junegunn/fzf).

### Install from source

```bash
# Clone the repository
git clone https://github.com/BloopAI/vk.git
cd vk

# Install globally
deno install -g --allow-net --allow-read --allow-write --allow-env --allow-run=git,fzf -n vk --config deno.json src/main.ts
```

To uninstall:

```bash
deno uninstall -g vk
```

## Usage

### Configuration

Set the API endpoint (defaults to `http://localhost:3000`):

```bash
vk config set api-url http://localhost:3000
vk config set default-executor CLAUDE_CODE:DEFAULT
vk config show
```

### Project Commands

```bash
# List all projects
vk project list
vk project list --json

# Filter projects (multiple filters supported)
vk project list --name "Frontend" --archived false

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

# Filter tasks (multiple filters supported)
vk task list --status in_progress --priority 5

# Show task details
vk task show <task-id>
vk task show  # Interactive selection with fzf (if installed)

# Create a new task
vk task create --project <project-id>
vk task create --project <project-id> --title "Fix bug" --description "Details here"

# Update a task
vk task update <task-id> --title "New title"
vk task update <task-id> --status completed
vk task update --status completed  # Interactive selection with fzf (if installed)

# Delete a task
vk task delete <task-id>
vk task delete  # Interactive selection with fzf (if installed)
```

### Attempt Commands

```bash
# List attempts for a task
vk attempt list --task <task-id>

# Filter attempts (multiple filters supported)
vk attempt list --task <task-id> --executor CLAUDE_CODE:DEFAULT --target-branch main

# Show attempt details
vk attempt show <attempt-id>
vk attempt show  # Interactive selection with fzf (if installed)

# Create a new attempt (executor format: <name>:<variant>)
vk attempt create --task <task-id> --executor CLAUDE_CODE:DEFAULT

# Update attempt
vk attempt update <attempt-id> --target-branch develop

# Delete attempt
vk attempt delete <attempt-id>

# Merge attempt
vk attempt merge <attempt-id>

# Push attempt
vk attempt push <attempt-id>

# Rebase attempt
vk attempt rebase <attempt-id>

# Stop attempt
vk attempt stop <attempt-id>

# Create PR
vk attempt pr <attempt-id>

# Check branch status
vk attempt branch-status <attempt-id>
```

### Interactive Selection (with fzf)

When fzf is installed, you can omit IDs from commands to get an interactive
fuzzy-search selection:

- **Project selection**: Triggered when not in a git repository or when no
  matching project is found
- **Task selection**: Triggered when task ID is omitted from
  `task show/update/delete` commands
- **Attempt selection**: Triggered when attempt ID is omitted from `attempt`
  commands

Example workflow:

```bash
# Select project interactively, then select task, then show details
vk task show

# Select project and task interactively, then delete
vk task delete

# Select project, task, and attempt interactively, then create PR
vk attempt pr
```

## License

MIT
