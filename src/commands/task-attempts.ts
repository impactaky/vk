import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { loadConfig } from "../api/config.ts";
import { ApiClient } from "../api/client.ts";
import type { UpdateWorkspace } from "../api/types.ts";
import { getAttemptIdWithAutoDetect } from "../utils/attempt-resolver.ts";
import { handleCliError } from "../utils/error-handler.ts";
import { parseExecutorString } from "../utils/executor-parser.ts";
import { getRepositoryId } from "../utils/repository-resolver.ts";

type PromptSourceOptions = {
  description?: string;
  file?: string;
};

const EDITOR_INSTRUCTIONS = [
  "# Enter the workspace prompt.",
  "# Lines starting with # are ignored.",
  "# Save and close the editor to continue.",
].join("\n");

function getConfiguredEditor(): string {
  const editor = Deno.env.get("GIT_EDITOR") ?? Deno.env.get("VISUAL") ??
    Deno.env.get("EDITOR");
  if (!editor || editor.trim().length === 0) {
    throw new Error(
      "Option --description or --file is required unless GIT_EDITOR, VISUAL, or EDITOR is set.",
    );
  }
  return editor.trim();
}

function splitCommand(command: string): string[] {
  const args: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < command.length; i += 1) {
    const char = command[i];

    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === "\\" && quote === '"' && i + 1 < command.length) {
        i += 1;
        current += command[i];
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        args.push(current);
        current = "";
      }
      continue;
    }

    if (char === "\\" && i + 1 < command.length) {
      i += 1;
      current += command[i];
      continue;
    }

    current += char;
  }

  if (quote) {
    throw new Error("Editor command contains an unmatched quote.");
  }

  if (current.length > 0) {
    args.push(current);
  }

  if (args.length === 0) {
    throw new Error("Editor command is empty.");
  }

  return args;
}

function normalizeEditorPrompt(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n")
    .trim();
}

async function resolvePromptFromEditor(): Promise<string> {
  const [command, ...args] = splitCommand(getConfiguredEditor());
  const tempFile = await Deno.makeTempFile({
    prefix: "vk-workspace-prompt-",
    suffix: ".md",
  });

  try {
    await Deno.writeTextFile(tempFile, `${EDITOR_INSTRUCTIONS}\n`);

    const result = await new Deno.Command(command, {
      args: [...args, tempFile],
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    }).output();

    if (result.code !== 0) {
      throw new Error(`Editor exited with status ${result.code}.`);
    }

    const prompt = normalizeEditorPrompt(await Deno.readTextFile(tempFile));
    if (prompt.length === 0) {
      throw new Error("Editor content must contain non-comment text.");
    }

    return prompt;
  } finally {
    await Deno.remove(tempFile).catch(() => undefined);
  }
}

async function resolvePrompt(options: PromptSourceOptions): Promise<string> {
  if (options.description && options.file) {
    throw new Error("Options --description and --file are mutually exclusive.");
  }

  let prompt: string | undefined;
  if (options.file) {
    prompt = await Deno.readTextFile(options.file);
    if (prompt.trim().length === 0) {
      throw new Error("Option --file must contain non-empty text.");
    }
    return prompt;
  }

  if (options.description) {
    prompt = options.description;
    if (prompt.trim().length === 0) {
      throw new Error("Option --description must be non-empty.");
    }
    return prompt;
  }

  return await resolvePromptFromEditor();
}

export const taskAttemptsCommand = new Command()
  .description("Manage workspaces")
  .action(function () {
    this.showHelp();
  });

taskAttemptsCommand
  .command("list")
  .description("List workspaces")
  .option("--task-id <id:string>", "Filter by task ID")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();
      const attempts = await client.listTaskAttempts(options.taskId);

      if (options.json) {
        console.log(JSON.stringify(attempts, null, 2));
        return;
      }

      if (attempts.length === 0) {
        console.log("No workspaces found.");
        return;
      }

      const table = new Table()
        .header(["ID", "Task ID", "Name", "Branch", "Archived", "Pinned"])
        .body(attempts.map((attempt) => [
          attempt.id,
          attempt.task_id || "-",
          attempt.name || "-",
          attempt.branch,
          attempt.archived ? "Yes" : "No",
          attempt.pinned ? "Yes" : "No",
        ]));

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("show")
  .description("Show workspace details")
  .arguments("[id:string]")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const attempt = await client.getTaskAttempt(attemptId);

      if (options.json) {
        console.log(JSON.stringify(attempt, null, 2));
        return;
      }

      console.log(`ID:                ${attempt.id}`);
      console.log(`Task ID:           ${attempt.task_id || "-"}`);
      console.log(`Name:              ${attempt.name || "-"}`);
      console.log(`Branch:            ${attempt.branch}`);
      console.log(`Agent Working Dir: ${attempt.agent_working_dir || "-"}`);
      console.log(`Archived:          ${attempt.archived ? "Yes" : "No"}`);
      console.log(`Pinned:            ${attempt.pinned ? "Yes" : "No"}`);
      console.log(`Created:           ${attempt.created_at}`);
      console.log(`Updated:           ${attempt.updated_at}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("create")
  .description("Create workspace")
  .option(
    "--description <text:string>",
    "Task description/prompt (opens editor when omitted with no --file)",
  )
  .option("--file <path:string>", "Read task description/prompt from file")
  .option("--repo <repo:string>", "Repository ID or name")
  .option("--target-branch <name:string>", "Target branch name")
  .option(
    "--executor <executor:string>",
    "Executor profile in <name>:<variant> format",
  )
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const prompt = await resolvePrompt(options);
      const client = await ApiClient.create();
      const repoId = await getRepositoryId(options.repo, client);
      const config = await loadConfig();
      const executor = parseExecutorString(
        options.executor || config.defaultExecutor || "CLAUDE_CODE:DEFAULT",
      );
      const targetBranch = options.targetBranch || "main";

      const createResult = await client.createWorkspace({
        prompt,
        executor_config: executor,
        repos: [{ repo_id: repoId, target_branch: targetBranch }],
      });

      if (options.json) {
        console.log(JSON.stringify(createResult, null, 2));
        return;
      }

      console.log(
        createResult.execution_process
          ? `Workspace ${createResult.workspace.id} created and started.`
          : `Workspace ${createResult.workspace.id} created.`,
      );
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("spin-off")
  .description("Create workspace by spinning off from a parent workspace")
  .arguments("[id:string]")
  .option(
    "--description <text:string>",
    "Task description/prompt (opens editor when omitted with no --file)",
  )
  .option("--file <path:string>", "Read task description/prompt from file")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      const prompt = await resolvePrompt(options);

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const parentAttempt = await client.getTaskAttempt(attemptId);
      const parentRepos = await client.getWorkspaceRepos(attemptId);
      if (parentRepos.length === 0) {
        throw new Error("Parent workspace has no repositories to spin off.");
      }

      const config = await loadConfig();
      const executor = parseExecutorString(
        config.defaultExecutor || "CLAUDE_CODE:DEFAULT",
      );
      const spinOffResult = await client.createWorkspace({
        prompt,
        executor_config: executor,
        repos: parentRepos.map((repo) => {
          const repoId = repo.repo_id || repo.id;
          if (!repoId) {
            throw new Error(
              "Parent workspace repo is missing repository ID.",
            );
          }
          return {
            repo_id: repoId,
            target_branch: parentAttempt.branch,
          };
        }),
      });

      if (options.json) {
        console.log(JSON.stringify(spinOffResult, null, 2));
        return;
      }

      console.log(
        spinOffResult.execution_process
          ? `Workspace ${spinOffResult.workspace.id} spun off from ${attemptId}.`
          : `Workspace ${spinOffResult.workspace.id} created from ${attemptId}.`,
      );
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("update")
  .description("Update workspace details")
  .arguments("[id:string]")
  .option("--name <name:string>", "New workspace name")
  .option("--archived", "Mark workspace as archived")
  .option("--no-archived", "Mark workspace as not archived")
  .option("--pinned", "Pin workspace")
  .option("--no-pinned", "Unpin workspace")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      const update: UpdateWorkspace = {};

      if (options.name !== undefined) {
        update.name = options.name || null;
      }
      if (options.archived !== undefined) {
        update.archived = options.archived;
      }
      if (options.pinned !== undefined) {
        update.pinned = options.pinned;
      }

      if (Object.keys(update).length === 0) {
        console.log("No updates specified.");
        return;
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const attempt = await client.updateWorkspace(attemptId, update);

      if (options.json) {
        console.log(JSON.stringify(attempt, null, 2));
        return;
      }

      console.log(`Workspace ${attempt.id} updated.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("delete")
  .description("Delete workspace")
  .arguments("[id:string]")
  .action(async (_options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      await client.deleteWorkspace(attemptId);
      console.log(`Workspace ${attemptId} deleted.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("repos")
  .description("List repositories attached to a workspace")
  .arguments("[id:string]")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repos = await client.getWorkspaceRepos(attemptId);

      if (options.json) {
        console.log(JSON.stringify(repos, null, 2));
        return;
      }

      if (repos.length === 0) {
        console.log("No repositories found for workspace.");
        return;
      }

      const table = new Table()
        .header(["ID", "Repo ID", "Target Branch"])
        .body(repos.map((repo) => [
          repo.id,
          repo.repo_id,
          repo.target_branch,
        ]));

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("branch-status")
  .description("Show branch status for repositories in a workspace")
  .arguments("[id:string]")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const statuses = await client.getBranchStatus(attemptId);

      if (options.json) {
        console.log(JSON.stringify(statuses, null, 2));
        return;
      }

      if (statuses.length === 0) {
        console.log("No branch status found.");
        return;
      }

      const table = new Table()
        .header([
          "Repository",
          "Ahead",
          "Behind",
          "Uncommitted",
          "Untracked",
          "Conflict",
        ])
        .body(statuses.map((status) => [
          status.repo_name,
          String(status.commits_ahead),
          String(status.commits_behind),
          String(status.uncommitted_count),
          String(status.untracked_count),
          status.conflicted_files.length > 0 ? "Yes" : "No",
        ]));

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("rename-branch")
  .description("Rename workspace branch")
  .arguments("[id:string]")
  .option("--new-branch-name <name:string>", "New branch name")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      if (!options.newBranchName) {
        throw new Error("Option --new-branch-name is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const result = await client.renameBranch(attemptId, {
        new_branch_name: options.newBranchName,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      const branchName = "branch" in result && result.branch
        ? result.branch
        : options.newBranchName;
      console.log(
        `Workspace ${attemptId} branch renamed to ${branchName}.`,
      );
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("merge")
  .description("Merge workspace branch")
  .arguments("[id:string]")
  .option("--repo <repo:string>", "Repository ID or name")
  .action(async (options, id?: string) => {
    try {
      if (!options.repo) {
        throw new Error("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      await client.mergeWorkspace(attemptId, { repo_id: repoId });
      console.log(`Workspace ${attemptId} merged for repo ${repoId}.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("push")
  .description("Push workspace branch")
  .arguments("[id:string]")
  .option("--repo <repo:string>", "Repository ID or name")
  .action(async (options, id?: string) => {
    try {
      if (!options.repo) {
        throw new Error("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      await client.pushWorkspace(attemptId, { repo_id: repoId });
      console.log(`Workspace ${attemptId} pushed for repo ${repoId}.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("rebase")
  .description("Rebase workspace branch")
  .arguments("[id:string]")
  .option("--repo <repo:string>", "Repository ID or name")
  .option("--old-base-branch <name:string>", "Old base branch")
  .option("--new-base-branch <name:string>", "New base branch")
  .action(async (options, id?: string) => {
    try {
      if (!options.repo) {
        throw new Error("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      await client.rebaseWorkspace(attemptId, {
        repo_id: repoId,
        old_base_branch: options.oldBaseBranch,
        new_base_branch: options.newBaseBranch,
      });
      console.log(`Workspace ${attemptId} rebased for repo ${repoId}.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("stop")
  .description("Stop workspace")
  .arguments("[id:string]")
  .action(async (_options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      await client.stopWorkspace(attemptId);
      console.log(`Workspace ${attemptId} stopped.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

const prCommand = new Command()
  .description("Pull request operations for workspaces")
  .option("--id <id:string>", "Workspace ID")
  .option("--repo <repo:string>", "Repository ID or name")
  .option("--title <title:string>", "Pull request title")
  .option("--body <body:string>", "Pull request body")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      if (!options.repo) {
        throw new Error("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, options.id);
      const repoId = await getRepositoryId(options.repo, client);
      const title = options.title || `Workspace ${attemptId}`;
      const url = await client.createPR(attemptId, {
        repo_id: repoId,
        title,
        body: options.body,
      });

      if (options.json) {
        console.log(JSON.stringify(url, null, 2));
        return;
      }

      console.log(`Pull request created: ${url}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

prCommand
  .command("attach")
  .description("Attach an existing pull request to a workspace")
  .arguments("[id:string]")
  .option("--repo <repo:string>", "Repository ID or name")
  .option("--pr-number <number:number>", "Pull request number")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      if (!options.repo) {
        throw new Error("Option --repo is required.");
      }
      if (options.prNumber === undefined) {
        throw new Error("Option --pr-number is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      const result = await client.attachPR(attemptId, {
        repo_id: repoId,
        pr_number: options.prNumber,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(`Pull request attached: ${result.pr_url}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand.command("pr", prCommand);

prCommand
  .command("comments")
  .description("List pull request comments for a workspace")
  .arguments("[id:string]")
  .option("--repo <repo:string>", "Repository ID or name")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      if (!options.repo) {
        throw new Error("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      const response = await client.getPRComments(attemptId, repoId);

      if (options.json) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      if (response.comments.length === 0) {
        console.log("No PR comments found.");
        return;
      }

      const table = new Table()
        .header(["ID", "Type", "User", "Path", "Line", "Created"])
        .body(response.comments.map((comment) => [
          String(comment.id),
          comment.comment_type,
          comment.user,
          comment.path || "-",
          comment.line ? String(comment.line) : "-",
          comment.created_at,
        ]));

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
