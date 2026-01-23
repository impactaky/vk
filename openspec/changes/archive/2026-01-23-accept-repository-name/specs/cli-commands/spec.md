## ADDED Requirements
### Requirement: Repository Resolution by Name
The CLI MUST accept repository name as an alternative to repository ID when explicitly specifying a repository. The CLI SHALL first try to match by ID, then by name.

#### Scenario: Resolve repository by name
- **WHEN** a repository with name "my-repo" exists
- **AND** the user runs `vk repository show my-repo`
- **THEN** the CLI resolves the repository by name and displays its details

#### Scenario: Resolve repository by ID takes priority
- **WHEN** a repository with id "my-repo" exists
- **AND** another repository with name "my-repo" exists
- **AND** the user runs `vk repository show my-repo`
- **THEN** the CLI resolves by ID first and displays that repository

#### Scenario: Error when multiple repositories share the same name
- **WHEN** two repositories exist with name "my-repo" but different IDs
- **AND** the user runs `vk repository show my-repo`
- **THEN** the CLI displays an error listing both repository IDs for disambiguation

#### Scenario: Error when no repository matches ID or name
- **WHEN** no repository exists with id or name "nonexistent"
- **AND** the user runs `vk repository show nonexistent`
- **THEN** the CLI displays an error suggesting `vk repository list`

#### Scenario: Update repository by name
- **WHEN** a repository with name "my-repo" exists
- **AND** the user runs `vk repository update my-repo --display-name "New Name"`
- **THEN** the CLI resolves the repository by name and updates it

#### Scenario: List branches by repository name
- **WHEN** a repository with name "my-repo" exists
- **AND** the user runs `vk repository branches my-repo`
- **THEN** the CLI resolves the repository by name and displays its branches
