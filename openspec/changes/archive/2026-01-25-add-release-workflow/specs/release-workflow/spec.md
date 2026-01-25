# Release Workflow Specification

## Overview
GitHub Actions workflow for automated releases triggered by version tags.

## ADDED Requirements

### Requirement: Tag-triggered Release Workflow
The release workflow SHALL trigger when a version tag is pushed.

#### Scenario: Push version tag triggers release
- **Given** a commit is tagged with `v*` pattern (e.g., `v0.1.0`)
- **When** the tag is pushed to the repository
- **Then** the release workflow starts execution

#### Scenario: Non-version tags do not trigger release
- **Given** a commit is tagged without the `v` prefix
- **When** the tag is pushed to the repository
- **Then** the release workflow does not run

### Requirement: CI Validation Before Build
The workflow MUST validate code quality before compiling binaries.

#### Scenario: CI checks pass before build
- **Given** the release workflow is triggered
- **When** the CI job runs
- **Then** it checks formatting with `deno fmt --check`
- **And** it runs linting with `deno lint`
- **And** it type checks with `deno check src/main.ts`
- **And** it runs unit tests

#### Scenario: Build does not run if CI fails
- **Given** the release workflow is triggered
- **When** any CI check fails
- **Then** the build job does not start
- **And** no release is created

### Requirement: Cross-platform Binary Compilation
The workflow SHALL compile binaries for multiple platforms.

#### Scenario: Compile binaries for all supported platforms
- **Given** the CI job passes
- **When** the build job runs
- **Then** it compiles `vk-linux-x64` for `x86_64-unknown-linux-gnu`
- **And** it compiles `vk-linux-arm64` for `aarch64-unknown-linux-gnu`
- **And** it compiles `vk-macos-x64` for `x86_64-apple-darwin`
- **And** it compiles `vk-macos-arm64` for `aarch64-apple-darwin`
- **And** it compiles `vk-windows-x64.exe` for `x86_64-pc-windows-msvc`

#### Scenario: Binaries include required permissions
- **Given** a binary is compiled
- **Then** it has `--allow-net` permission
- **And** it has `--allow-read` permission
- **And** it has `--allow-write` permission
- **And** it has `--allow-env` permission
- **And** it has `--allow-run=git,fzf` permission

### Requirement: GitHub Release Creation
The workflow SHALL create a GitHub release with compiled binaries.

#### Scenario: Create release with binaries
- **Given** all binaries are compiled successfully
- **When** the release job runs
- **Then** a GitHub release is created with the tag name
- **And** all 5 binaries are attached as release assets
- **And** release notes are auto-generated from commits

#### Scenario: Prerelease detection
- **Given** a tag contains a hyphen (e.g., `v1.0.0-beta.1`)
- **When** the release is created
- **Then** it is marked as a prerelease

#### Scenario: Stable release detection
- **Given** a tag does not contain a hyphen (e.g., `v1.0.0`)
- **When** the release is created
- **Then** it is not marked as a prerelease
