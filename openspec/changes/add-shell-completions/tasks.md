# Tasks: Add Shell Completions

## Implementation Tasks

- [x] **Create main CLI entry point**
  - Create `src/main.ts` with basic Command setup
  - Configure command name, version, description

- [x] **Add CompletionsCommand to CLI**
  - Import `CompletionsCommand` from `@cliffy/command/completions`
  - Register as subcommand of main command

- [x] **Test completion generation**
  - Verify `completions bash` outputs bash completion script
  - Verify `completions zsh` outputs zsh completion script
  - Verify `completions fish` outputs fish completion script

- [x] **Add deno.json configuration**
  - Configure entry point and tasks
  - Add import map for cliffy dependencies

- [x] **Document usage**
  - Add completion installation instructions to README
  - Include shell-specific sourcing examples

## Validation

- [x] Run `deno check` to verify types
- [x] Run `deno lint` to verify code style
- [x] Test completion scripts in each shell environment
