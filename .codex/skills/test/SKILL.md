---
name: test
description: Run test checks for VK.
license: MIT
compatibility: Requires Deno and Docker Compose.
metadata:
  author: vk
  version: "1.0"
---

Run these commands in order:

```bash
deno test --allow-read --allow-write --allow-env src/
docker compose run --rm vk
```

Rules:
- Stop on first failure.
- Keep output short.
- Report failing command clearly.
- If Docker Compose is not available, run unit tests and report integration as skipped.
