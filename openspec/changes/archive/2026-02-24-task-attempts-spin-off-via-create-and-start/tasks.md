## 1. Spec and Tests

- [x] 1.1 Update `specs/cli.md` spin-off section to use create-and-start with
      parent repos/branch.
- [x] 1.2 Add/adjust failing integration tests for spin-off to assert
      create-and-start contract and `--description` validation.

## 2. Implementation

- [x] 2.1 Update spin-off command implementation in
      `src/commands/task-attempts.ts` to derive from parent attempt + repos and
      call create-and-start.
- [x] 2.2 Remove unsupported spin-off endpoint wiring from `src/api/client.ts`
      and `src/api/types.ts`.

## 3. Verification

- [x] 3.1 Run targeted spin-off tests.
- [x] 3.2 Run full baseline `docker compose run --rm vk`.
- [x] 3.3 Mark tasks complete and ensure docs/spec sync.
