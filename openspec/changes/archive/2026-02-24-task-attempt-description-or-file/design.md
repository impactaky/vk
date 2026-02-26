## Overview

Introduce a small prompt resolver in `task-attempts.ts` that normalizes prompt
input for commands creating new task attempts.

## Design Decisions

- Add `--file <path:string>` to `create` and `spin-off`.
- Resolve prompt via one helper:
  - if both `--description` and `--file` are set, throw a validation error.
  - if `--file` is set, read file content with `Deno.readTextFile`.
  - if neither is set, throw a validation error.
- Keep prompt payload field unchanged (`prompt`) when calling
  `createWorkspace`.

## Error Handling

- Missing both flags: `Option --description or --file is required.`
- Both flags set: `Options --description and --file are mutually exclusive.`
- File read errors should bubble through existing `handleCliError` path.

## Testing Strategy

- Update existing failing-path tests for missing description to the new message.
- Add tests for `--file` success path for both create and spin-off.
- Add tests for mutually exclusive input error.
