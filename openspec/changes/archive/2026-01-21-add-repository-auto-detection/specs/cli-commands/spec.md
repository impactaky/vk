## ADDED Requirements

### Requirement: Repository Auto-Detection from Path
The CLI MUST automatically detect the repository ID from the current working directory when not explicitly provided.

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
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI falls back to fzf interactive selection

#### Scenario: Auto-detect skipped when ID provided
- **WHEN** user explicitly provides a repository ID as argument
- **THEN** the CLI uses the provided ID and skips auto-detection

#### Scenario: Multiple matching repositories prefer most specific
- **WHEN** user is in a directory that matches multiple registered repositories (nested paths)
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI uses the most specific (longest path) repository

---

## MODIFIED Requirements

### Requirement: Repository Show Command
The CLI MUST provide a command to show details of a specific repository with auto-detection support.

#### Scenario: Show repository details with explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository show repo-123`
- **THEN** the CLI displays the repository details including name, display_name, path, and scripts

#### Scenario: Show repository with JSON output and explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository show repo-123 --json`
- **THEN** the CLI outputs the repository as JSON

#### Scenario: Show non-existent repository with explicit ID
- **WHEN** no repository with id "xyz-999" exists
- **AND** the user runs `vk repository show xyz-999`
- **THEN** the CLI displays an error message

#### Scenario: Show repository with auto-detected ID from path
- **WHEN** user is in a directory within a registered repository's path
- **AND** the user runs `vk repository show` without providing ID
- **THEN** the CLI auto-detects the repository and displays its details

---

### Requirement: Repository Update Command
The CLI MUST provide a command to update repository properties with auto-detection support.

#### Scenario: Update repository display name with explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository update repo-123 --display-name "New Name"`
- **THEN** the CLI updates the repository display_name

#### Scenario: Update repository setup script with explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository update repo-123 --setup-script "npm install"`
- **THEN** the CLI updates the repository setup_script

#### Scenario: Update repository cleanup script with explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository update repo-123 --cleanup-script "npm run clean"`
- **THEN** the CLI updates the repository cleanup_script

#### Scenario: Update repository dev server script with explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository update repo-123 --dev-server-script "npm run dev"`
- **THEN** the CLI updates the repository dev_server_script

#### Scenario: Update repository parallel setup with explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository update repo-123 --parallel-setup`
- **THEN** the CLI enables parallel_setup_script for the repository

#### Scenario: Update repository copy files with explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository update repo-123 --copy-files "*.env,config/*"`
- **THEN** the CLI updates the repository copy_files

#### Scenario: No updates specified with explicit ID
- **WHEN** a repository with id "repo-123" exists
- **AND** the user runs `vk repository update repo-123` without any update flags
- **THEN** the CLI displays "No updates specified."

#### Scenario: Update repository with auto-detected ID from path
- **WHEN** user is in a directory within a registered repository's path
- **AND** the user runs `vk repository update --display-name "New Name"` without providing ID
- **THEN** the CLI auto-detects the repository and updates it

---

### Requirement: Repository Branches Command
The CLI MUST provide a command to list branches for a repository with auto-detection support.

#### Scenario: List all branches with explicit ID
- **WHEN** a repository with id "repo-123" exists with branches
- **AND** the user runs `vk repository branches repo-123`
- **THEN** the CLI displays a table of branches with name, current indicator, and remote status

#### Scenario: List branches with JSON output and explicit ID
- **WHEN** a repository with id "repo-123" exists with branches
- **AND** the user runs `vk repository branches repo-123 --json`
- **THEN** the CLI outputs the branches as JSON array

#### Scenario: List only remote branches with explicit ID
- **WHEN** a repository with id "repo-123" has local and remote branches
- **AND** the user runs `vk repository branches repo-123 --remote`
- **THEN** the CLI displays only remote branches

#### Scenario: List only local branches with explicit ID
- **WHEN** a repository with id "repo-123" has local and remote branches
- **AND** the user runs `vk repository branches repo-123 --local`
- **THEN** the CLI displays only local branches

#### Scenario: No branches found with explicit ID
- **WHEN** a repository with id "repo-123" has no branches
- **AND** the user runs `vk repository branches repo-123`
- **THEN** the CLI displays "No branches found."

#### Scenario: List branches with auto-detected ID from path
- **WHEN** user is in a directory within a registered repository's path
- **AND** the user runs `vk repository branches` without providing ID
- **THEN** the CLI auto-detects the repository and displays its branches
