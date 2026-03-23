# Definition of done

## DoD list

### 1. Reporting guidance

The DoD reporting guidance captures the validation-command mismatch lesson from this task.

- [x] 1.1 `.agents/reporting/dod-points.md` requires the final report to explicitly call out differences between the user-requested command and the validation command actually run.
- [x] 1.2 The added guidance includes concrete examples of meaningful differences such as `--json`, mock endpoints, or explicit repo-selection flags.

### 2. Verification

The documentation change is checked and can be referenced in future reports.

- [x] 2.1 The updated guidance keeps the existing MUST/SHOULD structure coherent and avoids contradicting current points.
- [x] 2.2 Validation confirms the final wording is present in `.agents/reporting/dod-points.md`, and the final report distinguishes observed edits from inference.

## Undefined

- Whether verbose test output guidance such as `-v` should be added now is out of scope for this change unless required by the final wording review.
