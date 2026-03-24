# Definition of done

## DoD list

### 1. CI regression fixes

The branch should be brought back to a passing state for the failures currently reported in GitHub Actions.

- [x] 1.1 The `require-await` lint failure in `tests/api_client_test.ts` is fixed without weakening the lint rule.
- [x] 1.2 All `Repo` fixtures that now require `archive_script` are updated so the type-checking failures in `src/utils/fzf_test.ts` and `tests/repository_resolver_integration_test.ts` are resolved.

### 2. Validation

The fixes should be verified with the same kinds of checks that failed in CI.

- [x] 2.1 A lint command is run and reported explicitly in the final DoD report.
- [x] 2.2 A repository-approved compose-based integration/type-check validation command is run and reported explicitly in the final DoD report, including whether the result is observed directly or inferred from narrower validation.

## Undefined

- [x] Whether any additional CI-only failures appear after the first two known failures are fixed still needs to be confirmed by rerunning the relevant checks.
