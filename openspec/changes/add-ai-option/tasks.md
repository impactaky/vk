## 1. Implementation

- [ ] 1.1 Create `src/utils/ai-help.ts` with TypeScript interfaces and generation logic
- [ ] 1.2 Implement recursive command tree traversal to extract all metadata
- [ ] 1.3 Add `--ai` option to root command in `src/main.ts`
- [ ] 1.4 Wire up option handler to output JSON and exit

## 2. Validation

- [ ] 2.1 Run `deno task lint` to verify code quality
- [ ] 2.2 Run `deno task test` to verify existing tests pass
- [ ] 2.3 Manual test: verify `vk --ai` outputs valid JSON with all commands
