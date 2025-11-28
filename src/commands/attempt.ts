import { Command } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { CreateAttempt, CreatePRRequest } from "../api/types.ts";
import {
  getProjectId,
  ProjectResolverError,
} from "../utils/project-resolver.ts";
import {
  FzfCancelledError,
  FzfNotInstalledError,
  selectAttempt,
  selectTask,
} from "../utils/fzf.ts";
import { applyFilters } from "../utils/filter.ts";
import {
  ExecutorResolverError,
  resolveExecutor,
} from "../utils/executor-resolver.ts";

/**
 * Helper to get attempt ID, either from argument or via fzf selection
 */
async function getAttemptId(
  client: ApiClient,
  id: string | undefined,
  projectId?: string,
): Promise<string> {
  if (id) return id;

  // Need to select task first, then attempt
  const resolvedProjectId = await getProjectId(projectId, client);
  const tasks = await client.listTasks(resolvedProjectId);
  if (tasks.length === 0) {
    throw new Error("No tasks found in the project.");
  }

  const taskId = await selectTask(tasks);
  const attempts = await client.listAttempts(taskId);
  if (attempts.length === 0) {
    throw new Error("No attempts found for the selected task.");
  }

  return await selectAttempt(attempts);
}

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
  .option("--executor <executor:string>", "Filter by executor")
  .option("--branch <branch:string>", "Filter by branch name")
  .option("--target-branch <branch:string>", "Filter by target branch")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const client = await ApiClient.create();
    let attempts = await client.listAttempts(options.task);

    // Build filter object from provided options
    const filters: Record<string, unknown> = {};
    if (options.executor !== undefined) {
      filters.executor = options.executor;
    }
    if (options.branch !== undefined) {
      filters.branch = options.branch;
    }
    if (options.targetBranch !== undefined) {
      filters.target_branch = options.targetBranch;
    }

    // Apply filters
    attempts = applyFilters(attempts, filters);

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
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);
      const attempt = await client.getAttempt(attemptId);

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
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Create attempt
attemptCommand
  .command("create")
  .description("Create a new attempt for a task")
  .option("--task <id:string>", "Task ID", { required: true })
  .option("--executor <executor:string>", "Executor name or profile ID", {
    required: true,
  })
  .option("--base-branch <branch:string>", "Base branch", { default: "main" })
  .option("--target-branch <branch:string>", "Target branch")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();

      // Resolve executor name to profile ID
      const executorProfileId = await resolveExecutor(options.executor, client);

      const createAttempt: CreateAttempt = {
        task_id: options.task,
        executor_profile_id: executorProfileId,
        base_branch: options.baseBranch,
        target_branch: options.targetBranch,
      };

      const attempt = await client.createAttempt(createAttempt);

      console.log(`Attempt created successfully!`);
      console.log(`ID: ${attempt.id}`);
      console.log(`Branch: ${attempt.branch}`);
    } catch (error) {
      if (error instanceof ExecutorResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Delete attempt
attemptCommand
  .command("delete")
  .description("Delete an attempt")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--force", "Delete without confirmation")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);

      if (!options.force) {
        const confirmed = await Confirm.prompt(
          `Are you sure you want to delete attempt ${attemptId}?`,
        );
        if (!confirmed) {
          console.log("Deletion cancelled.");
          return;
        }
      }

      await client.deleteAttempt(attemptId);
      console.log(`Attempt ${attemptId} deleted successfully.`);
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Update attempt
attemptCommand
  .command("update")
  .description("Update attempt properties")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--target-branch <branch:string>", "New target branch")
  .option("--branch <name:string>", "New branch name")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);

      if (options.targetBranch) {
        const attempt = await client.changeTargetBranch(attemptId, {
          target_branch: options.targetBranch,
        });
        console.log(`Target branch updated to: ${attempt.target_branch}`);
      }

      if (options.branch) {
        const attempt = await client.renameBranch(attemptId, {
          new_branch_name: options.branch,
        });
        console.log(`Branch renamed to: ${attempt.branch}`);
      }

      if (!options.targetBranch && !options.branch) {
        console.log(
          "No update options specified. Use --target-branch or --branch.",
        );
      }
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Merge attempt
attemptCommand
  .command("merge")
  .description("Merge attempt branch into target branch")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);
      const result = await client.mergeAttempt(attemptId);

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
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Push attempt
attemptCommand
  .command("push")
  .description("Push attempt branch to remote")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);
      await client.pushAttempt(attemptId);
      console.log(`Branch pushed successfully.`);
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Rebase attempt
attemptCommand
  .command("rebase")
  .description("Rebase attempt branch onto target branch")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);
      await client.rebaseAttempt(attemptId);
      console.log(`Branch rebased successfully.`);
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Stop attempt
attemptCommand
  .command("stop")
  .description("Stop attempt execution")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);
      await client.stopAttempt(attemptId);
      console.log(`Attempt execution stopped.`);
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Create PR
attemptCommand
  .command("pr")
  .description("Create a GitHub PR for the attempt")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--title <title:string>", "PR title (defaults to task title)")
  .option("--body <body:string>", "PR body (defaults to task description)")
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);

      // Get attempt to find task_id, then get task for defaults
      const attempt = await client.getAttempt(attemptId);
      const task = await client.getTask(attempt.task_id);

      const request: CreatePRRequest = {
        title: options.title || task.title,
        body: options.body || task.description || "",
      };

      const prUrl = await client.createPR(attemptId, request);

      if (options.json) {
        console.log(JSON.stringify({ url: prUrl }, null, 2));
        return;
      }

      console.log(`PR created successfully!`);
      console.log(`URL: ${prUrl}`);
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Branch status
attemptCommand
  .command("branch-status")
  .description("Show branch status for an attempt")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptId(client, id, options.project);
      const status = await client.getBranchStatus(attemptId);

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      console.log(`Ahead:         ${status.ahead}`);
      console.log(`Behind:        ${status.behind}`);
      console.log(`Has Conflicts: ${status.has_conflicts}`);
    } catch (error) {
      if (
        error instanceof ProjectResolverError ||
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });
