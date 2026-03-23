# Definition of done

## DoD list

### 1. CLI behavior

When the user invokes the relevant VK CLI command without both `--file` and `--description`, the command should follow an interactive editor workflow similar to `git commit`.

- [x] 1.1 The target CLI command detects that neither `--file` nor `--description` was provided and routes to editor-based input instead of failing or sending an empty payload.
- [x] 1.2 The editor flow uses the user's configured editor environment in a git-commit-like manner and returns the edited content back to the command.
- [x] 1.3 If the edited content is empty or only comments/whitespace after the editor closes, the command exits with a clear non-success outcome instead of proceeding.
- [x] 1.4 Existing non-interactive behavior remains intact when `--file` or `--description` is provided.

### 2. Validation

The change should be covered by repository-appropriate verification with explicit command reporting.

- [x] 2.1 Automated validation is added or updated to cover the no-`--file`/no-`--description` editor path and the existing explicit-input paths.
- [x] 2.2 Validation is executed with the exact repository-approved command, using `docker compose run --rm vk ...` for Deno-based checks if such validation is run.
- [x] 2.3 The final report states the exact user-facing command expected to work, the exact validation command run, and whether the result is directly observed or inferred.

### 3. User-facing clarity

Users should be able to understand the new fallback behavior and its operating assumptions.

- [x] 3.1 Help text, inline messaging, or related docs explain that omitting both `--file` and `--description` opens an editor.
- [x] 3.2 The final DoD report states whether validation used tests, a mock endpoint, static inspection, or a live API, and calls out any remaining external-state dependency.

## Undefined

- [x] The specific CLI subcommand and its current option parsing behavior still need to be confirmed from the implementation.
- [x] The exact editor environment variables and temporary-file conventions should follow the existing project or runtime pattern once the implementation area is inspected.
