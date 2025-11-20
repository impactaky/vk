# Tasks: Add Task from Markdown

## Implementation Tasks

- [x] **Add markdown parsing utility**
  - Create `src/utils/markdown-parser.ts`
  - Use `@libs/markdown` (jsr:@libs/markdown) for parsing
  - Extract first heading as title
  - Extract remaining content as description
  - Handle edge cases (no heading, empty file)

- [x] **Update task create command**
  - Add `--from <file>` option to task create command
  - Read file content and parse markdown
  - Validate mutually exclusive options (--from vs --title)
  - Create task using parsed content

- [x] **Add tests**
  - Unit tests for markdown parser (8 tests passing)
  - Integration tests for task create with --from

- [x] **Update completion support**
  - Add file completion for --from option (using Cliffy's `:file` type)
