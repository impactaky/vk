# Proposal: Add Task from Markdown

## Summary
Add support to create tasks from markdown files, where the first heading becomes the title and the remaining content becomes the description.

## Motivation
- Allow users to prepare task content in markdown files with better editing experience
- Support longer, formatted descriptions easily
- Enable task templates and batch creation workflows

## Scope
- Add `--from <file>` option to `vk task create` command
- Parse markdown to extract title from first heading and description from body
- Maintain backward compatibility with existing `--title` and `--description` flags

## Out of Scope
- Batch creation of multiple tasks from single file
- Image attachment support from markdown
- Template variable substitution
