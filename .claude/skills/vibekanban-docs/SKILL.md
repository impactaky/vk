---
name: vibekanban-docs
description: Fetch latest documentation and information about the vibekanban project from DeepWiki. Use when needing to understand vibekanban architecture, APIs, type system, executor implementations, frontend/backend structure, or any vibekanban-specific concepts. Triggers on questions about how vibekanban works, its API contracts, type definitions, or implementation details.
---

# Vibekanban Documentation

Access up-to-date vibekanban documentation via DeepWiki MCP (repository: `BloopAI/vibe-kanban`).

## Available DeepWiki Tools

Use these MCP tools to fetch vibekanban information:

### mcp__deepwiki__read_wiki_structure
Get the table of contents showing all available documentation topics.

```
mcp__deepwiki__read_wiki_structure(repoName: "BloopAI/vibe-kanban")
```

### mcp__deepwiki__ask_question
Ask specific questions about vibekanban. Best for targeted queries.

```
mcp__deepwiki__ask_question(repoName: "BloopAI/vibe-kanban", question: "<your question>")
```

### mcp__deepwiki__read_wiki_contents
Fetch the full wiki contents. Note: Output is large (~1M chars) and saved to a file. Use ask_question for targeted queries instead.

## Documentation Topics

Key areas covered in the vibekanban wiki:

- **System Architecture** - Overall design and component relationships
- **Type System and API Contracts** - Shared types, API schemas
- **Projects, Tasks, and Repositories** - Core domain models
- **Workspaces and Execution Lifecycle** - How work gets executed
- **Git Worktree Management** - Multi-branch isolation
- **Executor System** - Architecture, profiles, implementations (Claude, OpenAI, Gemini)
- **Backend Services** - Server, API routes, database, WebSocket streaming
- **Frontend Application** - React structure, state management, UI components
- **Git/GitHub Integration** - PR creation, git operations
- **REST API Endpoints** - HTTP API reference
- **WebSocket Streams** - Real-time event system
- **Data Types and Schemas** - Type definitions

## Usage Pattern

1. For specific questions: Use `ask_question` directly
2. For exploration: First call `read_wiki_structure` to see available topics, then `ask_question` about relevant sections

### Example Queries

```
# Understanding the executor system
ask_question("How does the executor system work? What are executor profiles?")

# API contracts
ask_question("What are the main API endpoints and their request/response types?")

# Type system
ask_question("What are the core TypeScript types shared between frontend and backend?")

# WebSocket events
ask_question("How does WebSocket streaming work? What events are emitted?")
```
