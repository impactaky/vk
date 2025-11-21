import { Command } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { CreateAttempt, CreatePRRequest } from "../api/types.ts";

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
  .option("--target-branch <branch:string>", "Target branch")
  .action(async (options) => {
    const client = await ApiClient.create();

    const createAttempt: CreateAttempt = {
      task_id: options.task,
      executor_profile_id: options.executor,
      base_branch: options.baseBranch,
      target_branch: options.targetBranch,
    };

    const attempt = await client.createAttempt(createAttempt);

    console.log(`Attempt created successfully!`);
    console.log(`ID: ${attempt.id}`);
    console.log(`Branch: ${attempt.branch}`);
  });

// Delete attempt
attemptCommand
  .command("delete")
  .description("Delete an attempt")
  .arguments("<id:string>")
  .option("--force", "Delete without confirmation")
  .action(async (options, id) => {
    const client = await ApiClient.create();

    if (!options.force) {
      const confirmed = await Confirm.prompt(
        `Are you sure you want to delete attempt ${id}?`,
      );
      if (!confirmed) {
        console.log("Deletion cancelled.");
        return;
      }
    }

    await client.deleteAttempt(id);
    console.log(`Attempt ${id} deleted successfully.`);
  });

// Update attempt
attemptCommand
  .command("update")
  .description("Update attempt properties")
  .arguments("<id:string>")
  .option("--target-branch <branch:string>", "New target branch")
  .option("--branch <name:string>", "New branch name")
  .action(async (options, id) => {
    const client = await ApiClient.create();

    if (options.targetBranch) {
      const attempt = await client.changeTargetBranch(id, {
        target_branch: options.targetBranch,
      });
      console.log(`Target branch updated to: ${attempt.target_branch}`);
    }

    if (options.branch) {
      const attempt = await client.renameBranch(id, {
        new_branch_name: options.branch,
      });
      console.log(`Branch renamed to: ${attempt.branch}`);
    }

    if (!options.targetBranch && !options.branch) {
      console.log(
        "No update options specified. Use --target-branch or --branch.",
      );
    }
  });

// Merge attempt
attemptCommand
  .command("merge")
  .description("Merge attempt branch into target branch")
  .arguments("<id:string>")
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    const client = await ApiClient.create();
    const result = await client.mergeAttempt(id);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (result.success) {
      console.log("Merge successful!");
      if (result.message) {
        console.log(result.message);
      }
    } else {
      console.log("Merge failed.");
      if (result.message) {
        console.log(result.message);
      }
    }
  });

// Push attempt
attemptCommand
  .command("push")
  .description("Push attempt branch to remote")
  .arguments("<id:string>")
  .action(async (_options, id) => {
    const client = await ApiClient.create();
    await client.pushAttempt(id);
    console.log(`Branch pushed successfully.`);
  });

// Rebase attempt
attemptCommand
  .command("rebase")
  .description("Rebase attempt branch onto target branch")
  .arguments("<id:string>")
  .action(async (_options, id) => {
    const client = await ApiClient.create();
    await client.rebaseAttempt(id);
    console.log(`Branch rebased successfully.`);
  });

// Stop attempt
attemptCommand
  .command("stop")
  .description("Stop attempt execution")
  .arguments("<id:string>")
  .action(async (_options, id) => {
    const client = await ApiClient.create();
    await client.stopAttempt(id);
    console.log(`Attempt execution stopped.`);
  });

// Create PR
attemptCommand
  .command("pr")
  .description("Create a GitHub PR for the attempt")
  .arguments("<id:string>")
  .option("--title <title:string>", "PR title")
  .option("--body <body:string>", "PR body")
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    const client = await ApiClient.create();

    const request: CreatePRRequest = {};
    if (options.title) request.title = options.title;
    if (options.body) request.body = options.body;

    const result = await client.createPR(id, request);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`PR created successfully!`);
    console.log(`URL: ${result.url}`);
    console.log(`Number: #${result.number}`);
  });

// Branch status
attemptCommand
  .command("branch-status")
  .description("Show branch status for an attempt")
  .arguments("<id:string>")
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    const client = await ApiClient.create();
    const status = await client.getBranchStatus(id);

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    console.log(`Ahead:         ${status.ahead}`);
    console.log(`Behind:        ${status.behind}`);
    console.log(`Has Conflicts: ${status.has_conflicts}`);
  });
