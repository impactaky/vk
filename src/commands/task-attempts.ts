import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { UpdateWorkspace } from "../api/types.ts";
import { getAttemptIdWithAutoDetect } from "../utils/attempt-resolver.ts";
import { handleCliError } from "../utils/error-handler.ts";

export const taskAttemptsCommand = new Command()
  .description("Manage task attempts")
  .action(function () {
    this.showHelp();
  });

taskAttemptsCommand
  .command("list")
  .description("List task attempts")
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
        console.log("No task attempts found.");
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
  .description("Show task attempt details")
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
  .command("update")
  .description("Update task attempt details")
  .arguments("[id:string]")
  .option("--name <name:string>", "New task attempt name")
  .option("--archived", "Mark task attempt as archived")
  .option("--no-archived", "Mark task attempt as not archived")
  .option("--pinned", "Pin task attempt")
  .option("--no-pinned", "Unpin task attempt")
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

      console.log(`Task attempt ${attempt.id} updated.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("delete")
  .description("Delete task attempt")
  .arguments("[id:string]")
  .action(async (_options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      await client.deleteWorkspace(attemptId);
      console.log(`Task attempt ${attemptId} deleted.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

taskAttemptsCommand
  .command("repos")
  .description("List repositories attached to a task attempt")
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
        console.log("No repositories found for task attempt.");
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
  .description("Show branch status for repositories in a task attempt")
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
