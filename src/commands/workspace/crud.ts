import type { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { loadConfig } from "../../api/config.ts";
import { ApiClient } from "../../api/client.ts";
import type { UpdateWorkspace } from "../../api/types.ts";
import { getAttemptIdWithAutoDetect } from "../../utils/attempt-resolver.ts";
import { parseExecutorString } from "../../utils/executor-parser.ts";
import {
  applyWorkspaceListFilters,
  parseWorkspaceListFilters,
} from "../../utils/workspace-list-filters.ts";
import { resolvePrompt, resolveWorkspaceRepoInputs } from "./shared.ts";

export function addWorkspaceCrudCommands(command: Command): void {
  command
    .command("list")
    .description("List workspaces")
    .option("--task-id <id:string>", "Filter by task ID")
    .option(
      "--filter <expression:string>",
      "Filter by workspace field (repeatable). Supports status=active|archived|pinned|ready|pending|deleted",
      { collect: true },
    )
    .option("--json", "Output as JSON")
    .action(async (options) => {
      const parsedFilters = parseWorkspaceListFilters(options.filter);
      const filters = parsedFilters.status === undefined
        ? { ...parsedFilters, status: "active" }
        : parsedFilters;
      const client = await ApiClient.create();
      const attempts = applyWorkspaceListFilters(
        await client.listTaskAttempts(options.taskId, filters),
        filters,
      );

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
    });

  command
    .command("show")
    .description("Show workspace details")
    .arguments("[id:string]")
    .option("--json", "Output as JSON")
    .action(async (options, id?: string) => {
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
    });

  command
    .command("create")
    .description("Create workspace")
    .option(
      "--description <text:string>",
      "Task description/prompt (opens editor when omitted with no --file)",
    )
    .option("--file <path:string>", "Read task description/prompt from file")
    .option("--repo <repo:string>", "Repository ID or name (repeatable)", {
      collect: true,
    })
    .option("--target-branch <name:string>", "Target branch name")
    .option(
      "--executor <executor:string>",
      "Executor profile in <name>:<variant> format",
    )
    .option("--json", "Output as JSON")
    .action(async (options) => {
      const prompt = await resolvePrompt(options);
      const client = await ApiClient.create();
      const config = await loadConfig();
      const executor = parseExecutorString(
        options.executor || config.defaultExecutor || "CLAUDE_CODE:DEFAULT",
      );
      const targetBranch = options.targetBranch || "main";
      const repos = await resolveWorkspaceRepoInputs(
        options.repo,
        targetBranch,
        client,
      );

      const createResult = await client.createWorkspace({
        prompt,
        executor_config: executor,
        repos,
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
    });

  command
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
            throw new Error("Parent workspace repo is missing repository ID.");
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
    });

  command
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
    });

  command
    .command("delete")
    .description("Delete workspace")
    .arguments("[id:string]")
    .action(async (_options, id?: string) => {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      await client.deleteWorkspace(attemptId);
      console.log(`Workspace ${attemptId} deleted.`);
    });

  command
    .command("repos")
    .description("List repositories attached to a workspace")
    .arguments("[id:string]")
    .option("--json", "Output as JSON")
    .action(async (options, id?: string) => {
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
    });
}
