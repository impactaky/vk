# Proposal: Add Verbose Option

## Summary
Add a global `-v` / `--verbose` option to the vk CLI that displays detailed API request and response information for debugging and transparency.

## Motivation
Users need visibility into API interactions for:
- Debugging connectivity issues
- Understanding what data is being sent/received
- Troubleshooting unexpected behavior

## Scope
- Add global `-v, --verbose` flag to CLI entry point
- Create verbose state module for global state management
- Instrument API client to log request/response details
- Output verbose logs to stderr to preserve JSON output compatibility

## Approach
Use a global state module pattern (similar to config handling) to minimize code changes. The ApiClient's `request()` method will check verbose state and log details when enabled.

## Dependencies
None - this is a self-contained enhancement.

## Risks
- Minor: Verbose output may include sensitive data in request/response bodies
  - Mitigation: Users explicitly opt-in with `-v` flag
