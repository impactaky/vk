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
vk organization list
```

### 4. List task attempts

```bash
vk task-attempts list
```

## Installation

Requires [Deno](https://deno.land/) v2.x.

### Optional: Install fzf for interactive selection

For interactive repository/attempt selection, install
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

### Organization Commands

```bash
vk organization list
vk organization list --json
vk organization show <organization-id>
```

### Repository Commands

```bash
vk repository list
vk repository list --json
vk repository show <repository-id>
vk repository register --path "/path/to/repo" --display-name "My Repo"
vk repository init --parent-path "/parent/dir" --folder-name "new-repo"
vk repository update <repository-id> --display-name "Renamed Repo"
vk repository branches <repository-id>
```

### Task-Attempts Commands

```bash
vk task-attempts list
vk task-attempts list --json
vk task-attempts list --task-id <task-id>
vk task-attempts show <attempt-id>
vk task-attempts show --json <attempt-id>
vk task-attempts spin-off <attempt-id> --description "Follow-up work"
```

## License

MIT
