# Tasks

## 1. Add Cliffy dependency and create base command structure

- Import Cliffy Command from deno.land/x/cliffy
- Create root command instance in main.ts with version and description
- Verify Cliffy can be imported and basic command structure works

**Validation**: Run `deno check main.ts` successfully

## 2. Refactor auth commands to use Cliffy

- Create Cliffy command definitions for auth subcommands (login, status, logout)
- Remove auth-related switch cases from main.ts
- Register auth command with root command
- Test all auth subcommands work identically

**Validation**: `vk auth login`, `vk auth status`, `vk auth logout`, and `vk auth --help` all work correctly

## 3. Refactor config commands to use Cliffy

- Create Cliffy command definitions for config subcommands (set, get, list)
- Define arguments for config set/get commands
- Remove config-related switch cases from main.ts
- Register config command with root command
- Test all config subcommands work identically

**Validation**: `vk config set`, `vk config get`, `vk config list`, and `vk config --help` all work correctly

## 4. Refactor project commands to use Cliffy

- Create Cliffy command definitions for project subcommands (list, view, create, delete)
- Define required/optional arguments and options for each subcommand
- Leverage Cliffy's built-in validation for required fields
- Remove project-related switch cases from main.ts
- Register project command with root command
- Test all project subcommands work identically

**Validation**: All `vk project` subcommands work correctly with proper validation and help text

## 5. Refactor task commands to use Cliffy

- Create Cliffy command definitions for task subcommands (list, view, create, update, delete)
- Define arguments and options (--project-id, --title, --description, --status)
- Remove task-related switch cases from main.ts
- Register task command with root command
- Test all task subcommands work identically

**Validation**: All `vk task` subcommands work correctly with proper validation and help text

## 6. Refactor attempt commands to use Cliffy

- Create Cliffy command definitions for attempt subcommands (list, view, create, follow-up)
- Define arguments and options (--executor, --base-branch, --variant, --prompt)
- Remove attempt-related switch cases from main.ts
- Register attempt command with root command
- Test all attempt subcommands work identically

**Validation**: All `vk attempt` subcommands work correctly with proper validation and help text

## 7. Clean up main.ts and verify complete migration

- Remove all std/flags imports
- Remove manual help and version functions (use Cliffy's built-in)
- Remove all switch-case statement blocks
- Simplify main() function to just parse and execute
- Verify no manual argument parsing remains

**Validation**:
- main.ts is significantly smaller and cleaner
- No references to std/flags exist
- `deno check main.ts` passes

## 8. Test complete CLI functionality

- Run through all command combinations to verify behavior is unchanged
- Test error cases (missing arguments, invalid options)
- Verify help text is generated correctly for all commands
- Test --json, --force, and other global options work correctly

**Validation**:
- All commands work identically to before migration
- Help text is comprehensive and accurate
- Error messages are clear and helpful

## 9. Update documentation if needed

- Check if any documentation references the old implementation
- Update examples if command usage has changed (should not change)
- Document the use of Cliffy for future maintainers

**Validation**: Documentation is accurate and up-to-date
