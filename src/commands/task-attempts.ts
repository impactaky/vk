import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
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
