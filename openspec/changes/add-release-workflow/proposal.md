# Proposal: Add GitHub Actions Release Workflow

## Summary
Add a GitHub Actions workflow that automates the release process by triggering on version tags, compiling cross-platform binaries using `deno compile`, and creating GitHub releases with the compiled assets.

## Motivation
Currently, releases must be created manually. An automated release workflow will:
- Ensure consistent release artifacts across platforms
- Reduce manual effort and human error
- Enable users to download pre-compiled binaries for their platform

## Scope
- Add new GitHub Actions workflow file (`.github/workflows/release.yml`)
- No changes to existing CLI code or commands

## Key Decisions
1. **Trigger**: Tag push matching `v*` pattern (e.g., `v0.1.0`, `v1.0.0-beta.1`)
2. **CI validation**: Run format, lint, type check, and unit tests before building
3. **Cross-compilation**: Use Deno's `--target` flag to compile from Ubuntu for all platforms
4. **Target platforms**: Linux x64/arm64, macOS x64/arm64, Windows x64
5. **Release notes**: Auto-generate from commits using `softprops/action-gh-release@v2`
6. **Prerelease detection**: Tags containing `-` (e.g., `-beta`, `-rc`) marked as prereleases

## Out of Scope
- Version bumping automation
- Changelog generation from conventional commits
- Binary signing or checksum files
- Homebrew formula updates
