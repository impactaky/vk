# Proposal: Add Shell Completions

## Summary

Add shell completion support for bash, zsh, and fish shells using cliffy's built-in `CompletionsCommand` module.

## Motivation

Shell completions improve user experience by:
- Enabling tab-completion for commands, subcommands, and options
- Reducing typing errors and speeding up CLI usage
- Following CLI best practices for professional tools

## Approach

Leverage cliffy's `@cliffy/command/completions` module which provides:
- `CompletionsCommand` - main completion command handler
- `BashCompletionsCommand` - Bash shell support
- `ZshCompletionsCommand` - Zsh shell support
- `FishCompletionsCommand` - Fish shell support

The implementation will add a `completions` subcommand that generates shell-specific completion scripts users can source in their shell configuration.

## Scope

- Add `completions` command with subcommands for each shell
- Support bash, zsh, and fish shells
- Provide installation instructions in help output

## Out of Scope

- Auto-installation of completions
- Support for other shells (PowerShell, etc.)
