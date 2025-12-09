# Change: Allow Executor Variant Specification

## Why

The vibe-kanban API's `executor_profile_id` consists of both a `name` and a `variant` field (e.g., `{executor: "CLAUDE_CODE", variant: "DEFAULT"}`). Currently, the CLI only accepts a plain string for the `--executor` flag, making it impossible for users to specify which variant they want to use when creating attempts.

## What Changes

- Update `--executor` flag to accept `<name>:<variant>` format (e.g., `CLAUDE_CODE:DEFAULT`)
- Parse the executor string into name and variant components
- Send the properly structured `executor_profile_id` object to the API with separate `executor` and `variant` fields
- Update filtering logic to match the full `name:variant` string for executor filters

## Impact

- Affected specs: `cli-commands`
- Affected code:
  - `src/commands/attempt.ts` - Parse executor string and construct profile ID
  - `src/api/types.ts` - Update `CreateAttempt` interface to match API structure
  - `src/utils/filter.ts` - Ensure executor filtering works with the new format
  - Tests and documentation
