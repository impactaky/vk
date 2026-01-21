## ADDED Requirements

### Requirement: Repository Debug Mode
The CLI MUST provide a `--debug` flag for repository commands to output diagnostic information about repository resolution.

#### Scenario: Debug output for repository show
- **WHEN** user runs `vk repository show --debug` without providing ID
- **THEN** the CLI outputs diagnostic information including:
  - Current directory path
  - Git remote URL and extracted basename for current directory
  - For each registered repository: path, git URL result, fallback basename, final basename used
  - Number of git URL matches found
  - Whether path-based matching was used as fallback
- **AND** the CLI proceeds with normal repository resolution

#### Scenario: Debug output with explicit ID
- **WHEN** user runs `vk repository show repo-123 --debug`
- **THEN** the CLI outputs "Debug: Using explicit repository ID: repo-123"
- **AND** the CLI proceeds with showing the repository

#### Scenario: Debug flag on repository update
- **WHEN** user runs `vk repository update --debug --display-name "New Name"`
- **THEN** the CLI outputs diagnostic information during repository resolution
- **AND** the CLI proceeds with the update

#### Scenario: Debug flag on repository branches
- **WHEN** user runs `vk repository branches --debug`
- **THEN** the CLI outputs diagnostic information during repository resolution
- **AND** the CLI proceeds with listing branches
