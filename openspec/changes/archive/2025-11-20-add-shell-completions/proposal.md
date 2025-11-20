# Add Shell Completions

## Summary
Add shell completion support for bash, zsh, and fish shells using cliffy's built-in CompletionsCommand.

## Motivation
Shell completions improve CLI usability by enabling tab-completion for commands, subcommands, and options. This is a standard feature expected in modern CLIs.

## Approach
Leverage cliffy's built-in `CompletionsCommand` which generates shell-specific completion scripts for bash, zsh, and fish. Users run `vk completions <shell>` to output the script, then source it in their shell configuration.

## Scope
- Add `completions` command to main CLI
- Support bash, zsh, and fish shells
- Document usage in help text
