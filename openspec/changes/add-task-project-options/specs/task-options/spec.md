# task-options Specification

## Purpose
Extend task CLI commands with additional Vikunja API properties for richer task management.

## ADDED Requirements

### Requirement: Task Priority Support
The CLI MUST support setting and displaying task priority levels.

#### Scenario: Create task with priority
Given the user is in a git repository matching a project
When the user runs `vk task create --title "Urgent fix" --priority 5`
Then the CLI creates the task with priority 5 (highest)

#### Scenario: Update task priority
Given a task with id "task-456" exists
When the user runs `vk task update task-456 --priority 3`
Then the CLI updates the task priority to 3

#### Scenario: Show task displays priority
Given a task with id "task-456" exists with priority 4
When the user runs `vk task show task-456`
Then the CLI displays the task priority

---

### Requirement: Task Due Date Support
The CLI MUST support setting and displaying task due dates.

#### Scenario: Create task with due date
Given the user is in a git repository matching a project
When the user runs `vk task create --title "Review" --due-date "2024-12-31"`
Then the CLI creates the task with the specified due date

#### Scenario: Update task due date
Given a task with id "task-456" exists
When the user runs `vk task update task-456 --due-date "2024-12-25"`
Then the CLI updates the task due date

#### Scenario: Clear task due date
Given a task with id "task-456" exists with a due date
When the user runs `vk task update task-456 --due-date ""`
Then the CLI clears the task due date

---

### Requirement: Task Labels Support
The CLI MUST support setting and displaying task labels.

#### Scenario: Create task with labels
Given the user is in a git repository matching a project
When the user runs `vk task create --title "Bug fix" --labels "bug,urgent"`
Then the CLI creates the task with labels "bug" and "urgent"

#### Scenario: Update task labels
Given a task with id "task-456" exists
When the user runs `vk task update task-456 --labels "feature,enhancement"`
Then the CLI updates the task labels

---

### Requirement: Task Progress Support
The CLI MUST support setting and displaying task completion percentage.

#### Scenario: Update task percent done
Given a task with id "task-456" exists
When the user runs `vk task update task-456 --percent-done 50`
Then the CLI updates the task completion to 50%

#### Scenario: Show task displays progress
Given a task with id "task-456" exists with 75% completion
When the user runs `vk task show task-456`
Then the CLI displays the completion percentage

---

### Requirement: Task Color Support
The CLI MUST support setting and displaying task colors.

#### Scenario: Create task with color
Given the user is in a git repository matching a project
When the user runs `vk task create --title "Design task" --color "#ff5733"`
Then the CLI creates the task with the specified hex color

#### Scenario: Update task color
Given a task with id "task-456" exists
When the user runs `vk task update task-456 --color "#00ff00"`
Then the CLI updates the task color

---

### Requirement: Task Favorite Support
The CLI MUST support marking tasks as favorites.

#### Scenario: Create task as favorite
Given the user is in a git repository matching a project
When the user runs `vk task create --title "Important" --favorite`
Then the CLI creates the task marked as favorite

#### Scenario: Toggle task favorite status
Given a task with id "task-456" exists
When the user runs `vk task update task-456 --favorite`
Then the CLI toggles the task's favorite status

---

