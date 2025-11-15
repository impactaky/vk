# Tasks

## 1. Add Cliffy dependency and create base command structure

- [x] Import Cliffy Command from deno.land/x/cliffy
- [x] Create root command instance in main.ts with version and description
- [x] Verify Cliffy can be imported and basic command structure works

**Validation**: Run `deno check main.ts` successfully ✓

## 2. Refactor auth commands to use Cliffy

- [x] Create Cliffy command definitions for auth subcommands (login, status, logout)
- [x] Remove auth-related switch cases from main.ts
- [x] Register auth command with root command
- [x] Test all auth subcommands work identically

**Validation**: `vk auth login`, `vk auth status`, `vk auth logout`, and `vk auth --help` all work correctly ✓

## 3. Refactor config commands to use Cliffy

- [x] Create Cliffy command definitions for config subcommands (set, get, list)
- [x] Define arguments for config set/get commands
- [x] Remove config-related switch cases from main.ts
- [x] Register config command with root command
- [x] Test all config subcommands work identically

**Validation**: `vk config set`, `vk config get`, `vk config list`, and `vk config --help` all work correctly ✓

## 4. Refactor project commands to use Cliffy

- [x] Create Cliffy command definitions for project subcommands (list, view, create, delete)
- [x] Define required/optional arguments and options for each subcommand
- [x] Leverage Cliffy's built-in validation for required fields
- [x] Remove project-related switch cases from main.ts
- [x] Register project command with root command
- [x] Test all project subcommands work identically

**Validation**: All `vk project` subcommands work correctly with proper validation and help text ✓

## 5. Refactor task commands to use Cliffy

- [x] Create Cliffy command definitions for task subcommands (list, view, create, update, delete)
- [x] Define arguments and options (--project-id, --title, --description, --status)
- [x] Remove task-related switch cases from main.ts
- [x] Register task command with root command
- [x] Test all task subcommands work identically

**Validation**: All `vk task` subcommands work correctly with proper validation and help text ✓

## 6. Refactor attempt commands to use Cliffy

- [x] Create Cliffy command definitions for attempt subcommands (list, view, create, follow-up)
- [x] Define arguments and options (--executor, --base-branch, --variant, --prompt)
- [x] Remove attempt-related switch cases from main.ts
- [x] Register attempt command with root command
- [x] Test all attempt subcommands work identically

**Validation**: All `vk attempt` subcommands work correctly with proper validation and help text ✓

## 7. Clean up main.ts and verify complete migration

- [x] Remove all std/flags imports
- [x] Remove manual help and version functions (use Cliffy's built-in)
- [x] Remove all switch-case statement blocks
- [x] Simplify main() function to just parse and execute
- [x] Verify no manual argument parsing remains

**Validation**:
- main.ts is significantly smaller and cleaner (reduced from 312 to 261 lines) ✓
- No references to std/flags exist ✓
- `deno check main.ts` passes ✓

## 8. Test complete CLI functionality

- [x] Run through all command combinations to verify behavior is unchanged
- [x] Test error cases (missing arguments, invalid options)
- [x] Verify help text is generated correctly for all commands
- [x] Test --json, --force, and other global options work correctly

**Validation**:
- All commands work identically to before migration ✓
- Help text is comprehensive and accurate ✓
- Error messages are clear and helpful ✓

## 9. Update documentation if needed

- [x] Check if any documentation references the old implementation
- [x] Update examples if command usage has changed (should not change)
- [x] Document the use of Cliffy for future maintainers

**Validation**: Documentation is accurate and up-to-date (no changes needed as user interface unchanged) ✓
