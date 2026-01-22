## MODIFIED Requirements

### Requirement: Repository Auto-Detection from Path
The CLI MUST automatically detect the repository ID from the current working directory when not explicitly provided. The CLI SHALL use git URL-based matching as the primary strategy, with path-based matching as a fallback.

#### Scenario: Auto-detect repository from git URL basename
- **WHEN** user is in a git repository with a remote origin URL
- **AND** a registered repository has the same git URL basename
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI auto-detects the repository using git URL basename matching

#### Scenario: Auto-detect repository across different machines
- **WHEN** user is in a git repository cloned to a different path than the registered repository
- **AND** both have the same git remote URL basename
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI auto-detects the repository using git URL basename matching

#### Scenario: Fallback to repo.name when path not accessible
- **WHEN** user is in a git repository with remote URL basename matching a registered repo's name
- **AND** the registered repository's path is not accessible on the current machine
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI auto-detects the repository by matching against repo.name

#### Scenario: Auto-detect repository from current directory
- **WHEN** user is in a directory that is within a registered repository's path
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI auto-detects the repository and displays its details

#### Scenario: Auto-detect repository for nested directory
- **WHEN** user is in a subdirectory of a registered repository's path
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI auto-detects the parent repository and displays its details

#### Scenario: Auto-detect fails with fzf fallback
- **WHEN** user is in a directory that is not within any registered repository's path
- **AND** git URL-based matching also fails
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI falls back to fzf interactive selection

#### Scenario: Auto-detect skipped when ID provided
- **WHEN** user explicitly provides a repository ID as argument
- **THEN** the CLI uses the provided ID and skips auto-detection

#### Scenario: Multiple matching repositories prefer most specific
- **WHEN** user is in a directory that matches multiple registered repositories (nested paths)
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI uses the most specific (longest path) repository

#### Scenario: Multiple git URL matches with path disambiguation
- **WHEN** multiple registered repositories have the same git URL basename
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI prefers the repository that also matches by path
