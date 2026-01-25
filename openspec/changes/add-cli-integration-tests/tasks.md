## 1. Implementation

- [x] 1.1 Create CLI runner helper (`vk/tests/helpers/cli-runner.ts`)
  - Implement `runCli(args: string[])` function using `Deno.Command`
  - Implement `runCliJson<T>(args: string[])` helper for JSON output parsing
  - Configure environment with `VK_API_URL` from test config

- [x] 1.2 Update deno.json permissions
  - Add `--allow-run=deno` to `test:integration` task

- [x] 1.3 Create CLI integration tests (`vk/tests/cli_integration_test.ts`)
  - Config command tests (show, set)
  - Project command tests (create, list, show, update, delete, repos, add-repo, remove-repo)
  - Task command tests (create, list, show, update, delete)
  - Repository command tests (list, register, show, update, branches)
  - Attempt command tests (create, list, show, update, repos, branch-status, delete)

## 2. Validation

- [x] 2.1 Run `deno task lint` - no lint errors
- [x] 2.2 Run `deno task check` - no type errors
- [x] 2.3 Run `deno task test` - unit tests pass (in src/)
- [ ] 2.4 Run `deno task test:integration` - integration tests pass (requires running server)
