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
docker compose run --rm vk deno test --allow-read --allow-write --allow-env src/
docker compose run --rm vk
```

Rules:
- Stop on first failure.
- Keep output short.
- Report failing command clearly.
- Do not run `deno test` on the host for this repository.
- If Docker Compose is not available, report validation as blocked rather than falling back to host-side `deno test`.
