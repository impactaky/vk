## 1. Implementation

- [x] 1.1 Add `@opensrc/deno-open` dependency to `deno.json`
- [x] 1.2 Add `open` subcommand to `src/commands/task.ts`
- [x] 1.3 Update `--allow-run` permissions in `deno.json` tasks

## 2. Verification

- [x] 2.1 Run `deno task dev task open --help` to verify command is registered
- [x] 2.2 Run lint, fmt, and type checks
- [x] 2.3 Run tests to ensure no regressions
