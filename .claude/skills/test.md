---
name: Test
description: Run unit tests and optionally integration tests (mirrors CI checks)
user_invocable: true
---

Run tests based on the CI workflow:

1. **Run unit tests**
   ```bash
   deno test --allow-read --allow-write --allow-env src/
   ```
   Fix any failing tests.

2. **Run integration tests** (requires Docker)
   ```bash
   docker compose run --rm vk
   ```
   This starts the vibe-kanban server with health checks and runs all integration tests.

Report the results and summarize any failures that need attention.
