# Shell Completions

## ADDED Requirements

### Requirement: Bash completion generation
The CLI MUST provide a command to generate bash shell completion scripts.

#### Scenario: Generate bash completions
- Given the CLI is installed
- When the user runs `vk completions bash`
- Then the CLI outputs a valid bash completion script to stdout

### Requirement: Zsh completion generation
The CLI MUST provide a command to generate zsh shell completion scripts.

#### Scenario: Generate zsh completions
- Given the CLI is installed
- When the user runs `vk completions zsh`
- Then the CLI outputs a valid zsh completion script to stdout

### Requirement: Fish completion generation
The CLI MUST provide a command to generate fish shell completion scripts.

#### Scenario: Generate fish completions
- Given the CLI is installed
- When the user runs `vk completions fish`
- Then the CLI outputs a valid fish completion script to stdout

### Requirement: Completions help
The CLI MUST provide help for the completions command showing available shells.

#### Scenario: Show completions help
- Given the CLI is installed
- When the user runs `vk completions --help`
- Then the CLI shows available shell options (bash, zsh, fish)
