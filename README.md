# vibe-kanban CLI

A command-line interface for [vibe-kanban](https://github.com/BloopAI/vibe-kanban), similar to how `gh` works for GitHub.

## Installation

Requires [Deno](https://deno.land/) v2.x.

### Optional: Install fzf for interactive selection

For interactive project/task/attempt selection, install [fzf](https://github.com/junegunn/fzf):

```bash
# macOS
brew install fzf

# Linux (most distros)
sudo apt install fzf  # Debian/Ubuntu
sudo dnf install fzf  # Fedora
sudo pacman -S fzf    # Arch

# Or install from source
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install
```

### Install as `vk` command

```bash
# Install globally (run from the project directory)
deno install -g --allow-net --allow-read --allow-write --allow-env --allow-run=git,fzf -n vk --config deno.json src/main.ts

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
deno run --allow-net --allow-read --allow-write --allow-env --allow-run=git,fzf src/main.ts --help

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

# Filter projects
vk project list --name "Frontend"
vk project list --archived false
vk project list --color "#3498db"
vk project list --archived false --name "Frontend"  # Multiple filters

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

# Filter tasks
vk task list --status completed
vk task list --priority 5
vk task list --executor CLAUDE_CODE:DEFAULT
vk task list --label bug
vk task list --favorite true
vk task list --color "#ff5733"
vk task list --status in_progress --priority 5  # Multiple filters
vk task list --status completed --json  # Filters work with JSON output

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
vk task delete <task-id> --force
vk task delete  # Interactive selection with fzf (if installed)
```

### Attempt Commands

```bash
# List attempts for a task
vk attempt list --task <task-id>
vk attempt list --task <task-id> --json

# Filter attempts
vk attempt list --task <task-id> --executor CLAUDE_CODE:DEFAULT
vk attempt list --task <task-id> --branch feature-branch
vk attempt list --task <task-id> --target-branch main
vk attempt list --task <task-id> --executor CLAUDE_CODE:DEFAULT --target-branch main  # Multiple filters

# Show attempt details
vk attempt show <attempt-id>
vk attempt show  # Interactive selection with fzf (if installed)

# Create a new attempt (executor format: <name>:<variant>)
vk attempt create --task <task-id> --executor CLAUDE_CODE:DEFAULT
vk attempt create --task <task-id> --executor CLAUDE_CODE:AGGRESSIVE

# Update attempt
vk attempt update <attempt-id> --target-branch develop
vk attempt update --target-branch develop  # Interactive selection with fzf (if installed)

# Delete attempt
vk attempt delete <attempt-id>
vk attempt delete  # Interactive selection with fzf (if installed)

# Merge attempt
vk attempt merge <attempt-id>
vk attempt merge  # Interactive selection with fzf (if installed)

# Push attempt
vk attempt push <attempt-id>
vk attempt push  # Interactive selection with fzf (if installed)

# Rebase attempt
vk attempt rebase <attempt-id>
vk attempt rebase  # Interactive selection with fzf (if installed)

# Stop attempt
vk attempt stop <attempt-id>
vk attempt stop  # Interactive selection with fzf (if installed)

# Create PR
vk attempt pr <attempt-id>
vk attempt pr  # Interactive selection with fzf (if installed)

# Check branch status
vk attempt branch-status <attempt-id>
vk attempt branch-status  # Interactive selection with fzf (if installed)
```

### Interactive Selection (with fzf)

When fzf is installed, you can omit IDs from commands to get an interactive fuzzy-search selection:

- **Project selection**: Triggered when not in a git repository or when no matching project is found
- **Task selection**: Triggered when task ID is omitted from `task show/update/delete` commands
- **Attempt selection**: Triggered when attempt ID is omitted from `attempt` commands

Example workflow:
```bash
# Select project interactively, then select task, then show details
vk task show

# Select project and task interactively, then delete
vk task delete

# Select project, task, and attempt interactively, then create PR
vk attempt pr
```

### Shell Completions

Enable tab-completion for commands, options, and arguments:

```bash
# Bash (add to ~/.bashrc)
source <(vk completions bash)

# Zsh (add to ~/.zshrc)
source <(vk completions zsh)

# Fish (add to ~/.config/fish/config.fish)
source (vk completions fish | psub)
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
