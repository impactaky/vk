# Change: Add --ai option for AI-friendly CLI documentation

## Why
AI agents working with the vk CLI need a programmatic way to understand all available commands, their options, arguments, and usage patterns. The standard `--help` output is designed for humans and requires parsing. A structured JSON output enables AI agents to reliably discover and use CLI capabilities.

## What Changes
- Add `--ai` option to the root `vk` command
- When invoked, outputs comprehensive JSON documentation of all commands and subcommands
- Recursively extracts command metadata (name, description, arguments, options)
- New utility module `src/utils/ai-help.ts` for generating the documentation

## Impact
- Affected specs: cli-commands
- Affected code: `src/main.ts`, new `src/utils/ai-help.ts`
