## 1. Test Refactor

- [x] 1.1 Remove mock API helper types/functions used for create/spin-off
      success tests in `tests/task_attempts_integration_test.ts`.
- [x] 1.2 Add/adjust real-instance seed helpers needed by create/spin-off tests
      (e.g., repository seed lookup).
- [x] 1.3 Rewrite create/spin-off success tests to use `config.apiUrl` and live
      seed data from compose-backed API.

## 2. Verification

- [x] 2.1 Run `/lint` skill checks.
- [x] 2.2 Run `/test` skill checks.
