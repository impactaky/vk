---
name: lint
description: Run formatting, linting, and type checks for Deno projects (mirrors CI checks). Use when the user wants to check code quality, fix formatting issues, run linters, or verify type safety with commands like "/lint", "check formatting", "run type check", or before committing code.
---

# Lint

Run the following checks in order, fixing any issues found:

1. **Check formatting**
   ```bash
   deno fmt --check
   ```
   If formatting issues are found, run `deno fmt` to fix them.

2. **Lint**
   ```bash
   deno lint
   ```
   Fix any linting errors reported.

3. **Type check**
   ```bash
   deno check src/main.ts
   ```
   Fix any type errors reported.

Report the results of each check and summarize any issues that were found and fixed.
