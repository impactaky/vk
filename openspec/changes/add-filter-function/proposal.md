# Proposal: Add Filter Function to List Commands

## Change ID
`add-filter-function`

## Overview
Add GitHub CLI-style filter options to all list commands (`project list`, `task list`, and `attempt list`) to enable filtering results by field values using simple key-value syntax.

## Motivation
Currently, users must retrieve all results and manually filter them, which is inefficient for large datasets. Adding filter functionality allows users to:
- Quickly find specific items matching criteria (e.g., tasks with status=completed)
- Combine multiple filters for precise queries (e.g., tasks with status=in_progress and priority=5)
- Use filters with both table and JSON output modes
- Improve CLI usability to match familiar patterns from gh command

## Scope
This change adds filter capability to three list commands:
1. `vk project list` - filter by id, name, git_repo_path, is_archived, hex_color
2. `vk task list` - filter by id, title, status, priority, executor, labels, is_favorite, hex_color
3. `vk attempt list` - filter by id, branch, executor, target_branch

## User Experience

### Examples

Filter tasks by status:
```bash
vk task list --filter status=completed
```

Filter tasks with multiple conditions:
```bash
vk task list --filter status=in_progress --filter priority=5
```

Filter projects by archived status:
```bash
vk project list --filter is_archived=false
```

Filter attempts by executor:
```bash
vk attempt list --task task-123 --filter executor=CLAUDE_CODE
```

Use filters with JSON output:
```bash
vk task list --filter status=completed --json
```

## Technical Approach
- Add `--filter` option to list commands supporting multiple values
- Parse filter as `key=value` pairs
- Apply filters client-side after fetching from API
- Support both boolean (true/false) and string value matching
- Array fields (like labels) match if any element matches the filter value
- Filters work with both table and JSON output modes

## Dependencies
None - this is a pure client-side feature.

## Risks and Mitigations
- **Risk**: Client-side filtering may be slow for very large result sets
  - **Mitigation**: Document that filtering happens client-side; consider server-side filtering in future if needed
- **Risk**: Complex filter syntax may confuse users
  - **Mitigation**: Keep syntax simple (key=value only); document with clear examples

## Alternatives Considered
1. **JMESPath/jq-style queries**: More powerful but more complex; rejected for simplicity
2. **Server-side filtering**: Requires API changes; deferred for future consideration
3. **Single filter flag with complex syntax**: Less intuitive than multiple --filter flags

## Success Criteria
- All list commands support --filter option
- Multiple filters can be combined (AND logic)
- Filters work with both table and JSON output
- Clear error messages for invalid filter syntax
- Documentation includes filter examples for each command
