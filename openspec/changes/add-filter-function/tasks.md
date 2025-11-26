# Implementation Tasks

## Tasks

1. **Create filter utility module**
   - Create `src/utils/filter.ts` with filtering logic
   - Implement `applyFilters<T>(items: T[], filters: Record<string, unknown>): T[]` function
   - Add type coercion for boolean, number, and string values
   - Implement array field matching (any element matches)
   - Add strict type checking for filter values
   - Write unit tests in `src/utils/filter_test.ts`

2. **Add filter options to project list command**
   - Add `--name <name:string>` option to filter by project name
   - Add `--archived <archived:boolean>` option to filter by archived status
   - Add `--color <color:string>` option to filter by hex color
   - Collect all specified filter options into a filter object
   - Apply filters using the utility function to fetched projects before display
   - Update both table and JSON output paths
   - Test manually with various filter combinations

3. **Add filter options to task list command**
   - Add `--status <status:string>` option to filter by task status
   - Add `--priority <priority:number>` option to filter by priority
   - Add `--executor <executor:string>` option to filter by executor
   - Add `--label <label:string>` option to filter by label (array matching)
   - Add `--favorite <favorite:boolean>` option to filter by favorite status
   - Add `--color <color:string>` option to filter by hex color
   - Collect all specified filter options into a filter object
   - Apply filters using the utility function to fetched tasks before display
   - Update both table and JSON output paths
   - Test manually with various filter combinations

4. **Add filter options to attempt list command**
   - Add `--executor <executor:string>` option to filter by executor
   - Add `--branch <branch:string>` option to filter by branch name
   - Add `--target-branch <branch:string>` option to filter by target branch
   - Collect all specified filter options into a filter object
   - Apply filters using the utility function to fetched attempts before display
   - Update both table and JSON output paths
   - Test manually with various filter combinations

5. **Add integration tests**
   - Create integration test file for filter functionality
   - Test each list command with filter options
   - Test multiple filter combinations (AND logic)
   - Test filters with JSON output
   - Test array field matching for labels
   - Test boolean and numeric value parsing

6. **Update documentation and help text**
   - Update command descriptions to mention filter options
   - Ensure help text clearly shows all filter options
   - Update README with filter usage examples
   - Document available filter options for each command

7. **Run validation and quality checks**
   - Run `deno fmt` to format code
   - Run `deno lint` to check for issues
   - Run `deno check` for type checking
   - Run `deno test` to ensure all tests pass
   - Manually test all three list commands with various filter options

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
