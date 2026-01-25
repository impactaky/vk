# Tasks: Add GitHub Actions Release Workflow

## Implementation Tasks

- [x] Create `.github/workflows/release.yml` with tag trigger
- [x] Add CI job (format, lint, type check, unit tests)
- [x] Add build job with matrix strategy for 5 targets
- [x] Add release job to create GitHub release with artifacts

## Validation (Post-Merge)

- [ ] Merge PR to main branch
- [ ] Create test tag `v0.1.0` and verify:
  - CI job passes
  - All 5 binaries compile successfully
  - GitHub release is created with binaries attached
- [ ] Download and test a binary on each platform
