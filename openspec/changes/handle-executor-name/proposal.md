# Change: Allow Executor Specification by Name

## Why
Currently, users must specify executor profile IDs when creating attempts, which requires knowledge of the exact UUID. This is not user-friendly. Allowing users to specify executors by name would improve the developer experience by making the CLI more intuitive.

## What Changes
- Add support for specifying executor by name in `vk attempt create --executor` option
- CLI will resolve executor names to profile IDs before making API calls
- Add API endpoint to list executor profiles
- Update attempt create command to accept either executor name or profile ID

## Impact
- Affected specs: cli-commands
- Affected code:
  - src/commands/attempt.ts (attempt create command)
  - src/api/client.ts (add executor profile listing)
  - src/api/types.ts (add ExecutorProfile type)
