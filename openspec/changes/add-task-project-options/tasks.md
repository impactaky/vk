# Tasks for add-task-project-options

## Implementation Tasks

1. [ ] Update Task type in `src/api/types.ts` to include new fields (priority, due_date, labels, percent_done, hex_color, is_favorite)
2. [ ] Update Project type in `src/api/types.ts` to include new fields (hex_color, is_archived, description)
3. [ ] Add new options to `vk task create` command (--priority, --due-date, --labels, --color, --favorite)
4. [ ] Add new options to `vk task update` command (--priority, --due-date, --labels, --percent-done, --color, --favorite)
5. [ ] Add new options to `vk project create` command (--color, --description)
6. [ ] Add new options to `vk project update` command (implement new command with --color, --description, --archived)
7. [ ] Update `vk task show` to display new fields
8. [ ] Update `vk task list` to optionally display priority and due date
9. [ ] Update `vk project show` to display new fields
10. [ ] Update API client methods to handle new fields
11. [ ] Add shell completions for new options
12. [ ] Update tests for new functionality
