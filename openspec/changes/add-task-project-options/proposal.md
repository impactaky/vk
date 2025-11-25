# Proposal: Add More Task and Project Options

## Summary
Extend the CLI to support additional task and project properties available in the Vikunja API, enabling richer task management and project organization.

## Motivation
The current CLI supports only basic fields (title, description, status for tasks; name, git_repo_path for projects). The Vikunja API provides many more useful properties like priority, due dates, labels, colors, and archiving that would improve task and project management workflows.

## Scope

### In Scope
- **Task Options**: priority, due_date, labels, percent_done, hex_color, is_favorite
- **Project Options**: hex_color, is_archived, description
- Update create/update commands to accept these new options
- Update show/list commands to display these fields

### Out of Scope
- Assignees and team collaboration features
- Reminders and notifications
- Attachments and comments
- Complex filtering and search
- Subtasks and parent-child task relationships

## Impact
- Modifies existing task and project types
- Extends create/update CLI commands with new flags
- Updates display formatting for show/list commands
