# Tasks: Add Task from Markdown

## Implementation Tasks

1. **Add markdown parsing utility**
   - Create `src/utils/markdown-parser.ts`
   - Extract first heading as title
   - Extract remaining content as description
   - Handle edge cases (no heading, empty file)

2. **Update task create command**
   - Add `--from <file>` option to task create command
   - Read file content and parse markdown
   - Validate mutually exclusive options (--from vs --title)
   - Create task using parsed content

3. **Add tests**
   - Unit tests for markdown parser
   - Integration tests for task create with --from

4. **Update completion support**
   - Add file completion for --from option
