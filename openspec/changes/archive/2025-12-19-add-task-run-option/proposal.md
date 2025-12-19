# Add Run Option to Task Create Command

## Summary

Add a `--run` option to the `vk task create` command that creates an attempt and immediately starts execution after task creation.

## Motivation

Currently, creating a task and starting execution requires two separate commands:
1. `vk task create --title "My Task"`
2. `vk attempt create --task <task-id> --executor CLAUDE_CODE:DEFAULT`

This proposal adds a `--run` option that combines both operations into a single command, improving the developer workflow.

## Scope

- Modify the `task create` command to accept `--run` and `--executor` options
- When `--run` is specified with an executor, automatically create an attempt after task creation
- Reuse existing attempt creation logic from the API client

## Non-Goals

- No changes to the attempt create command itself
- No changes to the API client (the existing `createAttempt` method is sufficient)
