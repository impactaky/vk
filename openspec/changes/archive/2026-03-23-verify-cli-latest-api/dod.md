# Definition of done

## DoD list

### 1. Latest API alignment

VK must use the latest documented vibe-kanban API surface from DeepWiki, without relying on deprecated task-attempt routes.

- [x] 1.1 Workspace-related API calls use the current `/api/workspaces` routes and current nested paths for git, execution, and pull-request operations.
- [x] 1.2 Organization commands use the current `/v1/organizations` routes and parse the latest response shapes correctly.
- [x] 1.3 Repository request/response types reflect the latest API fields used by the CLI, including current optional repo configuration fields.
- [x] 1.4 Deprecated fallback support for older workspace/task-attempt API routes is removed from the CLI codepath.

### 2. Subcommand correctness

Each existing CLI subcommand must map to the latest API contract and produce the expected request body and output handling for that contract.

- [x] 2.1 Existing `workspace` subcommands are reviewed against the latest API and corrected where their method, path, or response parsing is outdated.
- [x] 2.2 Existing `repository` subcommands are reviewed against the latest API and corrected where supported update fields or response handling are outdated.
- [x] 2.3 Existing `organization` subcommands are reviewed against the latest API and corrected where endpoint namespace or response handling are outdated.

### 3. Verification

Validation must demonstrate current endpoint mappings and distinguish tested behavior from static inference.

- [x] 3.1 Automated tests cover the updated API client endpoint paths and latest request/response shapes for changed commands.
- [x] 3.2 The human-readable CLI spec is updated where current behavior changed.
- [x] 3.3 Final report states which commands were validated by tests versus checked by static inspection against DeepWiki.
