# DoD Report Points

Use these repo-specific points when writing or evaluating a DoD report for VK.

## Required Points

- `MUST`: State the concrete user-facing command or workflow that is now expected to work.
- `MUST`: State the exact validation command that was run to confirm the behavior when such a command exists.
- `MUST`: If the validation command differs from the user-requested command, state the difference explicitly and why it matters. Examples: added `--json`, used a mock endpoint, or passed an explicit repo-selection flag.
- `MUST`: State whether validation used the live API, a mock endpoint, tests, or static inspection.
- `MUST`: Distinguish observed behavior from inference. Do not report inferred behavior as confirmed behavior.
- `MUST`: When a command still depends on external state, state that dependency explicitly.

## Recommended Points

- `SHOULD`: Summarize the expected user-visible result of the command, not only the code change.
- `SHOULD`: Call out notable fallback behavior, compatibility shims, or environment assumptions when they matter to the user.
- `SHOULD`: Mention the narrow scope of the change when that reduces regression risk for adjacent commands.

## Avoid

- `AVOID`: Claim that a command was validated end to end if only mock-based validation or unit tests were run.
- `AVOID`: Omit the exact command when the change is about CLI behavior.
