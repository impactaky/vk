# Implementation Tasks

## Tasks

1. **Create filter utility module** ✅
   - [x] Create `src/utils/filter.ts` with filtering logic
   - [x] Implement `applyFilters<T>(items: T[], filters: Record<string, unknown>): T[]` function
   - [x] Add type coercion for boolean, number, and string values
   - [x] Implement array field matching (any element matches)
   - [x] Add strict type checking for filter values
   - [x] Write unit tests in `src/utils/filter_test.ts`

2. **Add filter options to project list command** ✅
   - [x] Add `--name <name:string>` option to filter by project name
   - [x] Add `--archived <archived:boolean>` option to filter by archived status
   - [x] Add `--color <color:string>` option to filter by hex color
   - [x] Collect all specified filter options into a filter object
   - [x] Apply filters using the utility function to fetched projects before display
   - [x] Update both table and JSON output paths
   - [x] Test manually with various filter combinations

3. **Add filter options to task list command** ✅
   - [x] Add `--status <status:string>` option to filter by task status
   - [x] Add `--priority <priority:number>` option to filter by priority
   - [x] Add `--executor <executor:string>` option to filter by executor
   - [x] Add `--label <label:string>` option to filter by label (array matching)
   - [x] Add `--favorite <favorite:boolean>` option to filter by favorite status
   - [x] Add `--color <color:string>` option to filter by hex color
   - [x] Collect all specified filter options into a filter object
   - [x] Apply filters using the utility function to fetched tasks before display
   - [x] Update both table and JSON output paths
   - [x] Test manually with various filter combinations

4. **Add filter options to attempt list command** ✅
   - [x] Add `--executor <executor:string>` option to filter by executor
   - [x] Add `--branch <branch:string>` option to filter by branch name
   - [x] Add `--target-branch <branch:string>` option to filter by target branch
   - [x] Collect all specified filter options into a filter object
   - [x] Apply filters using the utility function to fetched attempts before display
   - [x] Update both table and JSON output paths
   - [x] Test manually with various filter combinations

5. **Add integration tests** ✅
   - [x] Create integration test file for filter functionality
   - [x] Test each list command with filter options
   - [x] Test multiple filter combinations (AND logic)
   - [x] Test filters with JSON output
   - [x] Test array field matching for labels
   - [x] Test boolean and numeric value parsing

6. **Update documentation and help text** ✅
   - [x] Update command descriptions to mention filter options
   - [x] Ensure help text clearly shows all filter options
   - [x] Update README with filter usage examples
   - [x] Document available filter options for each command

7. **Run validation and quality checks** ✅
   - [x] Run `deno fmt` to format code
   - [x] Run `deno lint` to check for issues
   - [x] Run `deno check` for type checking
   - [x] Run `deno test` to ensure all tests pass
   - [x] Manually test all three list commands with various filter options

## Dependencies
- Tasks 2, 3, 4 depend on task 1 (filter utility must exist first)
- Task 5 requires tasks 2-4 to be completed
- Task 6 can be done after tasks 2-4
- Task 7 must be done last

## Validation
Each task is verified by:
- Unit tests passing (task 1)
- Manual testing of filter functionality (tasks 2-4)
- Integration tests passing (task 5)
- Documentation is clear and accurate (task 6)
- All quality checks pass (task 7)
