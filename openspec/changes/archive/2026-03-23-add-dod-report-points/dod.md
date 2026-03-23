# Definition of done

## DoD list

### 1. Repo-specific DoD guidance

The repository exposes a dedicated DoD points list for final reporting guidance.

- [x] 1.1 A project-specific DoD points list file exists under `.agents/` and documents report guidance for this repository.
- [x] 1.2 The list defines command-reporting expectations using normative labels such as `MUST`, `SHOULD`, and `AVOID`, plus non-numeric confidence labels.

### 2. Schema integration and validation

The `dod-driven` schema points artifact authors to the repo-specific DoD guidance when available.

- [x] 2.1 `openspec/schemas/dod-driven/schema.yaml` references the DoD points list in its instruction text without breaking the default schema flow.
- [x] 2.2 Validation confirms the updated schema instruction is visible through the relevant OpenSpec artifact instructions or direct file inspection.

## Undefined

- Whether future schemas besides `dod-driven` should also reference the same DoD points list.
