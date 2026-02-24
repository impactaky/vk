## Overview

Harden prompt resolution by validating the resolved text content before making
API calls.

## Design

- Keep existing prompt-source rules (`--description` xor `--file`).
- After resolving prompt text, require `prompt.trim().length > 0`.
- Error messages:
  - file prompt empty: `Option --file must contain non-empty text.`
  - description prompt empty: `Option --description must be non-empty.`

## Testing

- Add tests that pass an empty file to create and spin-off, expecting fast
  failure with the new error message.
- Keep existing `--file` success tests.
