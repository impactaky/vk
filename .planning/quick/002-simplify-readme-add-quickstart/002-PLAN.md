---
quick: 002
type: execute
files_modified: [README.md]
autonomous: true
---

<objective>
Simplify README.md and add a prominent QuickStart section at the top.

Purpose: Make it easy for new users to get started with vk CLI in under 2
minutes. Output: Updated README.md with clear QuickStart section covering
install through first task creation.
</objective>

<context>
@README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restructure README with QuickStart section</name>
  <files>README.md</files>
  <action>
Restructure README.md with these changes:

1. Keep the opening description (vibe-kanban CLI, gh comparison)

2. Add new "QuickStart" section immediately after intro with numbered steps:

   **1. Install vk**
   - From Deno:
     `deno install -g --allow-net --allow-read --allow-write --allow-env --allow-run=git,fzf -n vk https://raw.githubusercontent.com/BloopAI/vk/main/src/main.ts`
   - From GitHub releases: link to releases page for pre-built binaries

   **1.1 Configure shell completion (optional)**
   ```bash
   # Bash
   echo 'source <(vk completions bash)' >> ~/.bashrc

   # Zsh
   echo 'source <(vk completions zsh)' >> ~/.zshrc

   # Fish
   echo 'source (vk completions fish | psub)' >> ~/.config/fish/config.fish
   ```

   **2. Set API URL**
   ```bash
   vk config set api-url https://your-vibe-kanban-instance.com
   ```

   **3. Verify connection**
   ```bash
   vk project list
   ```

   **4. Create and run your first task**
   ```bash
   vk task create --run --message 'Your task description' --title 'My first task' --executor 'CLAUDE_CODE:DEFAULT'
   ```

3. Move detailed Installation section (Deno requirements, fzf optional,
   uninstall) to after QuickStart

4. Keep Usage section but simplify - remove redundant examples that repeat
   filter patterns

5. Move Shell Completions section content into QuickStart step 1.1, remove the
   standalone section

6. Keep Development and License sections at the end unchanged

Key simplifications:

- Remove "Run without installing" section (advanced users can figure this out)
- Consolidate repetitive filter examples (show one multi-filter example per
  resource type)
- Remove verbose fzf installation instructions (just link to fzf repo)
  </action>
  <verify>
  - README.md has QuickStart section as second h2 after intro
  - QuickStart has all 4 numbered steps with correct commands
  - Shell completions integrated into step 1.1
  - No duplicate content between QuickStart and later sections
    </verify>
    <done> README has prominent QuickStart flow: Install -> Completions ->
    Config -> Verify -> Create task
    </done>
    </task>

</tasks>

<verification>
- cat README.md | head -100 shows QuickStart section prominently
- grep -c "QuickStart" README.md returns 1 (section exists)
- grep "task create --run" README.md shows the quick command
</verification>

<success_criteria>

- New user can follow QuickStart in under 2 minutes
- README is shorter overall (target ~150 lines, down from ~230)
- All essential information preserved, just reorganized </success_criteria>

<output>
After completion, create `.planning/quick/002-simplify-readme-add-quickstart/002-SUMMARY.md`
</output>
