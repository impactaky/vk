# Adopt Cliffy for CLI Argument Parsing

## Summary

Replace the current manual argument parsing using Deno's std/flags with Cliffy, a mature CLI framework for Deno that provides better structure, type safety, and maintainability.

## Motivation

The current CLI implementation in `main.ts` uses a manual approach with `std/flags` and nested switch-case statements that is:
- **Hard to maintain**: All argument definitions are centralized in one large parse configuration (lines 74-95), while validation and command routing is scattered through switch cases (lines 115-302)
- **Error-prone**: Manual validation of required arguments in each command handler (e.g., lines 137-140, 166-169, 216-220)
- **Difficult to extend**: Adding new commands or options requires touching multiple locations
- **Limited help generation**: Help text is manually maintained (lines 18-67) and can become out of sync with actual implementation

Cliffy addresses these issues by:
- Providing declarative command definitions with built-in validation
- Auto-generating help text from command definitions
- Supporting typed arguments and options
- Offering command chaining and middleware
- Better error messages out of the box

## Goals

1. Replace std/flags with Cliffy's Command API
2. Maintain backward compatibility with existing command interface
3. Improve code organization by moving command definitions closer to implementations
4. Reduce boilerplate and manual validation code
5. Enable better error messages and auto-generated help

## Non-Goals

- Changing the CLI command structure or interface
- Adding new commands or features (scope limited to refactoring)
- Modifying the API client or command implementations

## Success Criteria

- All existing commands work identically to current behavior
- Help text is auto-generated from command definitions
- Argument validation is handled by Cliffy
- Code is more maintainable with less boilerplate
- No breaking changes to the CLI interface
