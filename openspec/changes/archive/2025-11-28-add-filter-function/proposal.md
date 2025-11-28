# Proposal: Add Filter Function to List Commands

## Change ID
`add-filter-function`

## Overview
Add GitHub CLI-style filter options to all list commands (`project list`, `task list`, and `attempt list`) to enable filtering results by field-specific flags (e.g., `--status completed`, `--archived true`).

## Motivation
Currently, users must retrieve all results and manually filter them, which is inefficient for large datasets. Adding filter functionality allows users to:
- Quickly find specific items matching criteria (e.g., tasks with status=completed)
- Combine multiple filters for precise queries (e.g., tasks with status=in_progress and priority=5)
- Use filters with both table and JSON output modes
- Improve CLI usability to match familiar patterns from gh command

## Scope
This change adds filter options to three list commands:
1. `vk project list` - filter by `--name`, `--archived`, `--color`
2. `vk task list` - filter by `--status`, `--priority`, `--executor`, `--label`, `--favorite`, `--color`
3. `vk attempt list` - filter by `--executor`, `--branch`, `--target-branch`

## User Experience

### Examples

Filter tasks by status:
```bash
vk task list --status completed
```

Filter tasks with multiple conditions:
```bash
vk task list --status in_progress --priority 5
```

Filter projects by archived status:
```bash
vk project list --archived false
```

Filter attempts by executor:
```bash
vk attempt list --task task-123 --executor CLAUDE_CODE
```

Filter tasks by label:
```bash
vk task list --label bug
```

Use filters with JSON output:
```bash
vk task list --status completed --json
```

## Technical Approach
- Add individual option flags for each filterable field on list commands
- Parse option values and apply filters client-side after fetching from API
- Support boolean (true/false), numeric, and string value matching
- Array fields (like labels) match if any element matches the filter value
- Filters work with both table and JSON output modes
- All filter options are optional and use AND logic when combined

## Dependencies
None - this is a pure client-side feature.

## Risks and Mitigations
- **Risk**: Client-side filtering may be slow for very large result sets
  - **Mitigation**: Document that filtering happens client-side; consider server-side filtering in future if needed
- **Risk**: Adding many flags may clutter the help output
  - **Mitigation**: Group filter options logically in help text; use clear descriptions

## Alternatives Considered
1. **Generic --filter flag with key=value syntax**: Less intuitive than dedicated flags; rejected for better UX
2. **JMESPath/jq-style queries**: More powerful but more complex; rejected for simplicity
3. **Server-side filtering**: Requires API changes; deferred for future consideration

## Success Criteria
- All list commands support field-specific filter flags
- Multiple filter flags can be combined (AND logic)
- Filters work with both table and JSON output
- Clear help text showing available filter options
- Documentation includes filter examples for each command
