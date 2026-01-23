## 1. Implementation
- [ ] 1.1 Add `resolveRepositoryByIdOrName()` function to `src/utils/repository-resolver.ts`
- [ ] 1.2 Update `getRepositoryId()` to call `resolveRepositoryByIdOrName()` when explicit value is provided

## 2. Testing
- [ ] 2.1 Add unit test for resolving by name when single match exists
- [ ] 2.2 Add unit test for ID matching taking priority over name matching
- [ ] 2.3 Add unit test for error when multiple repositories share the same name
- [ ] 2.4 Add unit test for error when no repository matches

## 3. Verification
- [ ] 3.1 Run `deno task lint` and fix any issues
- [ ] 3.2 Run `deno task test` and verify all tests pass
