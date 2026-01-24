# project-options Specification

## Purpose
TBD - created by archiving change add-task-project-options. Update Purpose after archive.
## Requirements
### Requirement: Project Color Support
The CLI MUST support setting and displaying project colors.

#### Scenario: Create project with color
Given the vibe-kanban API is running
When the user runs `vk project create --name "Frontend" --path "/repo" --color "#3498db"`
Then the CLI creates the project with the specified hex color

#### Scenario: Update project color
Given a project with id "abc-123" exists
When the user runs `vk project update abc-123 --color "#e74c3c"`
Then the CLI updates the project color

#### Scenario: Show project displays color
Given a project with id "abc-123" exists with color "#3498db"
When the user runs `vk project show abc-123`
Then the CLI displays the project color

---

### Requirement: Project Description Support
The CLI MUST support setting and displaying project descriptions.

#### Scenario: Create project with description
Given the vibe-kanban API is running
When the user runs `vk project create --name "API" --path "/repo" --description "Backend API services"`
Then the CLI creates the project with the specified description

#### Scenario: Update project description
Given a project with id "abc-123" exists
When the user runs `vk project update abc-123 --description "Updated description"`
Then the CLI updates the project description

---

### Requirement: Project Archive Support
The CLI MUST support archiving and unarchiving projects.

#### Scenario: Archive project
Given a project with id "abc-123" exists and is not archived
When the user runs `vk project update abc-123 --archived`
Then the CLI archives the project

#### Scenario: Unarchive project
Given a project with id "abc-123" exists and is archived
When the user runs `vk project update abc-123 --no-archived`
Then the CLI unarchives the project

#### Scenario: List projects shows archived status
Given projects exist with some archived
When the user runs `vk project list`
Then the CLI displays archived status for each project

---

### Requirement: Project Update Command
The CLI MUST provide a command to update project properties.

#### Scenario: Update project name
Given a project with id "abc-123" exists
When the user runs `vk project update abc-123 --name "New Name"`
Then the CLI updates the project name

#### Scenario: Update multiple properties
Given a project with id "abc-123" exists
When the user runs `vk project update abc-123 --name "New" --color "#fff" --description "Desc"`
Then the CLI updates all specified properties

---

