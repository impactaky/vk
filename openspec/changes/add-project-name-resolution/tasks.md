## 1. Implementation
- [x] 1.1 Add `resolveProjectByIdOrName()` function to `src/utils/project-resolver.ts`
- [x] 1.2 Update `getProjectId()` to call `resolveProjectByIdOrName()` when explicit value is provided

## 2. Testing
- [x] 2.1 Add integration test for resolving by name when single match exists
- [x] 2.2 Add integration test for ID matching taking priority over name matching
- [x] 2.3 Add integration test for error when multiple projects share the same name
- [x] 2.4 Add integration test for error when no project matches ID or name

## 3. Verification
- [ ] 3.1 Run `deno task lint` and fix any issues
- [ ] 3.2 Run `deno task test` and verify all tests pass
