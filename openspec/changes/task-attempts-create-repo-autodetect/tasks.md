## 1. Spec and Tests

- [x] 1.1 Update `specs/cli.md` `task-attempts create` docs to make `--repo`
      optional with auto-detect behavior.
- [x] 1.2 Add/adjust integration tests for `vk task-attempts create` without
      `--repo` to validate repository autodetection from current directory.

## 2. Implementation

- [x] 2.1 Update `src/commands/task-attempts.ts` create command to use
      `getRepositoryId` without requiring explicit `--repo`.

## 3. Verification

- [x] 3.1 Run `/lint` skill checks.
- [x] 3.2 Run `/test` skill checks.
