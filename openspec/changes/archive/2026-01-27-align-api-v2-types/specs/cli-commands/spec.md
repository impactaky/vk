## MODIFIED Requirements

### Requirement: Workspace Merge Command
The CLI MUST provide a command to merge workspace branch into target branch with repository specification.

#### Scenario: Merge workspace with explicit repo ID
- **WHEN** a workspace has multiple repositories
- **AND** the user runs `vk attempt merge --repo <repo-id>`
- **THEN** the CLI merges the specified repository's branch

#### Scenario: Merge workspace with auto-detected repo
- **WHEN** a workspace has only one repository
- **AND** the user runs `vk attempt merge` without --repo
- **THEN** the CLI auto-detects and uses the single repository

#### Scenario: Merge fails without repo for multi-repo workspace
- **WHEN** a workspace has multiple repositories
- **AND** the user runs `vk attempt merge` without --repo
- **THEN** the CLI displays an error asking to specify --repo

---

### Requirement: Workspace Push Command
The CLI MUST provide a command to push workspace branch to remote with repository specification.

#### Scenario: Push workspace with explicit repo ID
- **WHEN** a workspace has multiple repositories
- **AND** the user runs `vk attempt push --repo <repo-id>`
- **THEN** the CLI pushes the specified repository's branch

#### Scenario: Push workspace with auto-detected repo
- **WHEN** a workspace has only one repository
- **AND** the user runs `vk attempt push` without --repo
- **THEN** the CLI auto-detects and uses the single repository

#### Scenario: Force push workspace with repo
- **WHEN** the user runs `vk attempt force-push --repo <repo-id>`
- **THEN** the CLI force-pushes the specified repository's branch after confirmation

---

### Requirement: Workspace Rebase Command
The CLI MUST provide a command to rebase workspace branch with repository and branch specification.

#### Scenario: Rebase workspace with all options
- **WHEN** the user runs `vk attempt rebase --repo <repo-id> --old-base main --new-base develop`
- **THEN** the CLI rebases from old-base to new-base for the specified repository

#### Scenario: Rebase workspace with repo only
- **WHEN** the user runs `vk attempt rebase --repo <repo-id>`
- **THEN** the CLI rebases using default base branch detection

#### Scenario: Rebase workspace with auto-detected repo
- **WHEN** a workspace has only one repository
- **AND** the user runs `vk attempt rebase` without --repo
- **THEN** the CLI auto-detects and uses the single repository
