## 1. Spec and Tests

- [x] 1.1 Update `specs/cli.md` create/spin-off input documentation to support
      description-or-file prompt sources.
- [x] 1.2 Add/adjust integration tests for:
      - missing prompt input
      - mutually exclusive `--description` + `--file`
      - successful `--file` usage for create and spin-off.

## 2. Implementation

- [x] 2.1 Implement prompt resolution helper in
      `src/commands/task-attempts.ts` and wire it into create/spin-off.
- [x] 2.2 Add `--file` CLI option to create and spin-off commands.

## 3. Verification

- [x] 3.1 Run `/lint` skill commands.
- [x] 3.2 Run `/test` skill commands.
