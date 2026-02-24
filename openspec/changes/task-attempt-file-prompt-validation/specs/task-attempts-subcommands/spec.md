## MODIFIED Requirements

### Requirement: Task-attempt prompt source validation
For `vk task-attempts create` and `vk task-attempts spin-off [id]`, resolved
prompt content MUST be non-empty text.

#### Scenario: Empty file prompt is rejected
- **WHEN** user passes `--file` pointing to an empty (or whitespace-only) file
- **THEN** CLI returns a clear validation error before API submission.
