import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { CreateAttempt } from "../api/types.ts";

export const attemptCommand = new Command()
  .description("Manage task attempts")
  .action(function () {
    this.showHelp();
  });

// List attempts
attemptCommand
  .command("list")
  .description("List attempts for a task")
  .option("--task <id:string>", "Task ID", { required: true })
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const client = await ApiClient.create();
    const attempts = await client.listAttempts(options.task);

    if (options.json) {
      console.log(JSON.stringify(attempts, null, 2));
      return;
    }

    if (attempts.length === 0) {
      console.log("No attempts found.");
      return;
    }

    const table = new Table()
      .header(["ID", "Branch", "Executor", "Target Branch"])
      .body(
        attempts.map((a) => [a.id, a.branch, a.executor, a.target_branch]),
      );

    table.render();
  });

// Show attempt
attemptCommand
  .command("show")
  .description("Show attempt details")
  .arguments("<id:string>")
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    const client = await ApiClient.create();
    const attempt = await client.getAttempt(id);

    if (options.json) {
      console.log(JSON.stringify(attempt, null, 2));
      return;
    }

    console.log(`ID:             ${attempt.id}`);
    console.log(`Task ID:        ${attempt.task_id}`);
    console.log(`Branch:         ${attempt.branch}`);
    console.log(`Target Branch:  ${attempt.target_branch}`);
    console.log(`Executor:       ${attempt.executor}`);
    if (attempt.container_ref) {
      console.log(`Container Ref:  ${attempt.container_ref}`);
    }
    console.log(`Worktree Deleted: ${attempt.worktree_deleted}`);
    if (attempt.setup_completed_at) {
      console.log(`Setup Completed: ${attempt.setup_completed_at}`);
    }
    console.log(`Created:        ${attempt.created_at}`);
    console.log(`Updated:        ${attempt.updated_at}`);
  });

// Create attempt
attemptCommand
  .command("create")
  .description("Create a new attempt for a task")
  .option("--task <id:string>", "Task ID", { required: true })
  .option("--executor <executor:string>", "Executor profile ID", {
    required: true,
  })
  .option("--base-branch <branch:string>", "Base branch", { default: "main" })
  .action(async (options) => {
    const client = await ApiClient.create();

    const createAttempt: CreateAttempt = {
      task_id: options.task,
      executor_profile_id: options.executor,
      base_branch: options.baseBranch,
    };

    const attempt = await client.createAttempt(createAttempt);

    console.log(`Attempt created successfully!`);
    console.log(`ID: ${attempt.id}`);
    console.log(`Branch: ${attempt.branch}`);
  });
