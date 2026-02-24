## Context

The backend does not expose `POST /api/task-attempts/:id/spin-off`. Spin-off UX
is implemented by pre-filling create flow and creating a new attempt through
`create-and-start`.

## Design

1. Keep CLI surface unchanged: `spin-off [id] --description`.
2. Resolve parent attempt id with existing resolver.
3. Fetch parent attempt (`getTaskAttempt`) for branch source.
4. Fetch parent attempt repos (`getWorkspaceRepos`).
5. Call `createWorkspace` (`/task-attempts/create-and-start`) with:
   - `prompt`: description
   - `executor_config`: default executor config logic used by create command
   - `repos`: parent repos mapped to `{ repo_id, target_branch: parent.branch }`
6. Remove unsupported dedicated spin-off API method/type from client/types.

## Trade-offs

- Reusing create-and-start keeps compatibility with backend, but may include all
  parent repos instead of a selectable subset.
- This is acceptable for minimal parity with existing frontend spin-off
  behavior.
