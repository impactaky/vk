# Definition of done

## DoD list

### 1. Repo-specific DoD guidance

The repository guidance for DoD reports should capture review expectations that proved reusable in this run.

- [x] 1.1 `openspec/specs/dod-points/spec.md` is updated to state that when introducing a new library, the report should note whether an equivalent capability was available in an already-used dependency and prefer the existing dependency when practical.
- [x] 1.2 `openspec/specs/dod-points/spec.md` is updated to state that when broad runtime permissions are documented or required, the report should explain why a narrower permission scope was not used if that tradeoff is user-relevant.

### 2. Validation and reporting

The change should remain small, verifiable, and explicit about what was actually checked.

- [x] 2.1 Validation confirms the `dod-points` spec was updated as intended, using the exact command or inspection method reported in the final DoD report.
- [x] 2.2 The final DoD report distinguishes observed edits from inferred rationale and states the narrow scope of the update.

## Undefined

- [x] Whether the new guidance belongs under `Required Points` or `Recommended Points` should be decided after inspecting the current wording and the intended enforcement level.
