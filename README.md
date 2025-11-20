# vibe-kanban CLI

CLI for [vibe-kanban](https://github.com/BloopAI/vibe-kanban).

## Installation

```bash
deno install --allow-all -n vk src/main.ts
```

## Shell Completions

Generate and install shell completions for tab-completion support.

### Bash

```bash
# Add to ~/.bashrc
source <(vk completions bash)
```

### Zsh

```bash
# Add to ~/.zshrc
source <(vk completions zsh)
```

### Fish

```bash
# Add to ~/.config/fish/config.fish
vk completions fish | source
```

## Development

```bash
# Run CLI
deno task dev

# Type check
deno task check

# Lint
deno task lint

# Format
deno task fmt
```
