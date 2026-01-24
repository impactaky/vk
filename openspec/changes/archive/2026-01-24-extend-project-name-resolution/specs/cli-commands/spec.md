## MODIFIED Requirements
### Requirement: Project Resolution by Name
The CLI MUST accept project name as an alternative to project ID when explicitly specifying a project. The CLI SHALL first try to match by ID, then by name.

#### Scenario: Resolve project by name
- **WHEN** a project with name "my-project" exists
- **AND** the user runs `vk task list --project my-project`
- **THEN** the CLI resolves the project by name and lists its tasks

#### Scenario: Resolve project by ID takes priority
- **WHEN** a project with id "my-project" exists
- **AND** another project with name "my-project" exists
- **AND** the user runs `vk task list --project my-project`
- **THEN** the CLI resolves by ID first and uses that project

#### Scenario: Error when multiple projects share the same name
- **WHEN** two projects exist with name "my-project" but different IDs
- **AND** the user runs `vk task list --project my-project`
- **THEN** the CLI displays an error listing both project IDs for disambiguation

#### Scenario: Error when no project matches ID or name
- **WHEN** no project exists with id or name "nonexistent"
- **AND** the user runs `vk task list --project nonexistent`
- **THEN** the CLI displays an error suggesting `vk project list`

#### Scenario: Show project by name
- **WHEN** a project with name "my-project" exists
- **AND** the user runs `vk project show my-project`
- **THEN** the CLI resolves the project by name and displays its details

#### Scenario: Delete project by name
- **WHEN** a project with name "my-project" exists
- **AND** the user runs `vk project delete my-project`
- **THEN** the CLI resolves the project by name and prompts for deletion confirmation

#### Scenario: Update project by name
- **WHEN** a project with name "my-project" exists
- **AND** the user runs `vk project update my-project --name "new-name"`
- **THEN** the CLI resolves the project by name and updates it

#### Scenario: List project repos by name
- **WHEN** a project with name "my-project" exists
- **AND** the user runs `vk project repos my-project`
- **THEN** the CLI resolves the project by name and lists its repositories

#### Scenario: Add repo to project by name
- **WHEN** a project with name "my-project" exists
- **AND** the user runs `vk project add-repo my-project --repo repo-123`
- **THEN** the CLI resolves the project by name and adds the repository

#### Scenario: Remove repo from project by name
- **WHEN** a project with name "my-project" exists
- **AND** the user runs `vk project remove-repo my-project --repo repo-123`
- **THEN** the CLI resolves the project by name and removes the repository
