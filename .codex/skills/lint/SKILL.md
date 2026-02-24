---
name: lint
description: Run lint checks for VK.
license: MIT
compatibility: Requires Deno.
metadata:
  author: vk
  version: "1.0"
---

Run these commands in order:

```bash
deno fmt --check
deno lint
deno check src/main.ts
```

Rules:
- Stop on first failure.
- Keep output short.
- Report failing command clearly.
