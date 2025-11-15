# Implementation Tasks

## 1. Stdin Detection and Reading

- [ ] 1.1 Add stdin detection logic to check if input is piped or redirected
- [ ] 1.2 Implement function to read stdin content asynchronously
- [ ] 1.3 Add error handling for stdin read failures

## 2. Markdown Parsing

- [ ] 2.1 Implement markdown title extraction (find first H1 heading)
- [ ] 2.2 Extract content after H1 heading as description
- [ ] 2.3 Handle edge cases: no heading, multiple headings, empty content
- [ ] 2.4 Strip markdown heading syntax (`#` prefix and whitespace)

## 3. CLI Integration

- [ ] 3.1 Update `task create` command to make `--title` conditionally required
- [ ] 3.2 Add logic to prioritize explicit flags over parsed markdown
- [ ] 3.3 Implement input validation (require title from either flag or markdown)
- [ ] 3.4 Update help text to document markdown input option

## 4. Testing

- [ ] 4.1 Add unit tests for markdown parsing function
- [ ] 4.2 Add integration tests for stdin input scenarios
- [ ] 4.3 Test edge cases (empty input, malformed markdown, mixed flags)
- [ ] 4.4 Test backward compatibility with existing flag-based usage

## 5. Documentation

- [ ] 5.1 Update README with markdown input examples
- [ ] 5.2 Add inline code comments for markdown parsing logic
