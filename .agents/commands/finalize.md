## Inputs

- description: Description of the PR to finalize.

## Options

- base-branch: Branch to compare against (default: main)
- target-branch: Branch to compare to base-branch (default: current branch)

## Outputs

## Summary

This command is used to finalize current draft PR.

## Steps

1. See diff from base-branch to target-branch to understand this PR purpose
2. Ask user to confirm the PR purpose
3. Think about things that better to do for this PR
4. Create or update documents for this PR
5. Make simple readable plan file to refine this PR.
   Make sure test with `docker compose run -rm vk`
   a. How to add unit test cases for this PR
   b. How to add integration test cases for this PR
   c. Lint same as github actions
   d. review your plan and ask gray zone to user until there are no gray zone
6. Implement follwoing plan
7. Show review guide for this PR