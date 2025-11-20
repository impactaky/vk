# Tasks: Add Shell Completions

## Implementation Tasks

1. **Create main CLI entry point**
   - Create `src/main.ts` with basic Command setup
   - Configure command name, version, description

2. **Add CompletionsCommand to CLI**
   - Import `CompletionsCommand` from `@cliffy/command/completions`
   - Register as subcommand of main command

3. **Test completion generation**
   - Verify `completions bash` outputs bash completion script
   - Verify `completions zsh` outputs zsh completion script
   - Verify `completions fish` outputs fish completion script

4. **Add deno.json configuration**
   - Configure entry point and tasks
   - Add import map for cliffy dependencies

5. **Document usage**
   - Add completion installation instructions to README
   - Include shell-specific sourcing examples

## Validation

- Run `deno check` to verify types
- Run `deno lint` to verify code style
- Test completion scripts in each shell environment
