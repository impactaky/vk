# Implementation Tasks

## 1. Update Type Definitions
- [x] 1.1 Update `CreateAttempt` interface in `src/api/types.ts` to use structured `executor_profile_id` with `executor` and `variant` fields
- [x] 1.2 Update `TaskAttempt` interface to reflect how executor is stored/returned by the API

## 2. Implement Executor Parsing
- [x] 2.1 Create helper function to parse `<name>:<variant>` format in `src/commands/attempt.ts`
- [x] 2.2 Add validation to ensure executor string contains exactly one colon separator
- [x] 2.3 Add error handling for invalid executor format with clear error message

## 3. Update Attempt Create Command
- [x] 3.1 Update `attempt create` command in `src/commands/attempt.ts` to parse executor string
- [x] 3.2 Construct `executor_profile_id` object with separate `executor` and `variant` fields
- [x] 3.3 Update help text/description to indicate `<name>:<variant>` format requirement

## 4. Update Filter Logic
- [x] 4.1 Verify filtering in `src/utils/filter.ts` works with full `name:variant` string match
- [x] 4.2 Update attempt list filtering to handle executor in the new format

## 5. Update Tests
- [x] 5.1 Add tests for executor string parsing (valid and invalid formats)
- [x] 5.2 Update existing attempt creation tests to use `<name>:<variant>` format
- [x] 5.3 Add filter tests for executor matching with variants

## 6. Update Documentation
- [x] 6.1 Update README.md examples to show `<name>:<variant>` format
- [x] 6.2 Update any inline code examples in comments
