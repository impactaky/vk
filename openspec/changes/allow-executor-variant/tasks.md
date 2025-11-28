# Implementation Tasks

## 1. Update Type Definitions
- [ ] 1.1 Update `CreateAttempt` interface in `src/api/types.ts` to use structured `executor_profile_id` with `executor` and `variant` fields
- [ ] 1.2 Update `TaskAttempt` interface to reflect how executor is stored/returned by the API

## 2. Implement Executor Parsing
- [ ] 2.1 Create helper function to parse `<name>:<variant>` format in `src/commands/attempt.ts`
- [ ] 2.2 Add validation to ensure executor string contains exactly one colon separator
- [ ] 2.3 Add error handling for invalid executor format with clear error message

## 3. Update Attempt Create Command
- [ ] 3.1 Update `attempt create` command in `src/commands/attempt.ts` to parse executor string
- [ ] 3.2 Construct `executor_profile_id` object with separate `executor` and `variant` fields
- [ ] 3.3 Update help text/description to indicate `<name>:<variant>` format requirement

## 4. Update Filter Logic
- [ ] 4.1 Verify filtering in `src/utils/filter.ts` works with full `name:variant` string match
- [ ] 4.2 Update attempt list filtering to handle executor in the new format

## 5. Update Tests
- [ ] 5.1 Add tests for executor string parsing (valid and invalid formats)
- [ ] 5.2 Update existing attempt creation tests to use `<name>:<variant>` format
- [ ] 5.3 Add filter tests for executor matching with variants

## 6. Update Documentation
- [ ] 6.1 Update README.md examples to show `<name>:<variant>` format
- [ ] 6.2 Update any inline code examples in comments
