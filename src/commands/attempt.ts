import { Command } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type {
  AttachPRRequest,
  CreateAttempt,
  CreatePRRequest,
  FollowUpRequest,
} from "../api/types.ts";
import { applyFilters } from "../utils/filter.ts";
import {
  getAttemptIdWithAutoDetect,
  getTaskIdWithAutoDetect,
} from "../utils/attempt-resolver.ts";
import { parseExecutorString } from "../utils/executor-parser.ts";
import { handleCliError } from "../utils/error-handler.ts";

export const attemptCommand = new Command()
  .description("Manage task attempts")
  .action(function () {
    this.showHelp();
  });

// List attempts
attemptCommand
  .command("list")
  .description("List attempts for a task")
  .option(
    "--task <id:string>",
    "Task ID (auto-detected from current branch if omitted)",
  )
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--executor <executor:string>", "Filter by executor")
  .option("--branch <branch:string>", "Filter by branch name")
  .option("--target-branch <branch:string>", "Filter by target branch")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();

      const taskId = await getTaskIdWithAutoDetect(
        client,
        options.task,
        options.project,
      );

      let attempts = await client.listAttempts(taskId);

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
    } catch (error) {
      handleCliError(error);
      throw error;
    }
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
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
      handleCliError(error);
      throw error;
    }
  });

// Create attempt
attemptCommand
  .command("create")
  .description("Create a new attempt for a task")
  .option("--task <id:string>", "Task ID", { required: true })
  .option(
    "--executor <executor:string>",
    "Executor profile ID in format <name>:<variant> (e.g., CLAUDE_CODE:DEFAULT)",
    {
      required: true,
    },
  )
  .option("--base-branch <branch:string>", "Base branch", { default: "main" })
  .option("--target-branch <branch:string>", "Target branch")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();

      // Parse executor string into profile ID
      const executorProfileId = parseExecutorString(options.executor);

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
      handleCliError(error);
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

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
      handleCliError(error);
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

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
      handleCliError(error);
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
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
      handleCliError(error);
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      await client.pushAttempt(attemptId);
      console.log(`Branch pushed successfully.`);
    } catch (error) {
      handleCliError(error);
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      await client.rebaseAttempt(attemptId);
      console.log(`Branch rebased successfully.`);
    } catch (error) {
      handleCliError(error);
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      await client.stopAttempt(attemptId);
      console.log(`Attempt execution stopped.`);
    } catch (error) {
      handleCliError(error);
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

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
      handleCliError(error);
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
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      const status = await client.getBranchStatus(attemptId);

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      console.log(`Ahead:         ${status.ahead}`);
      console.log(`Behind:        ${status.behind}`);
      console.log(`Has Conflicts: ${status.has_conflicts}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Follow-up command - send message to running attempt
attemptCommand
  .command("follow-up")
  .description("Send a follow-up message to a running attempt")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--message <message:string>", "Message to send to the executor", {
    required: true,
  })
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const request: FollowUpRequest = {
        message: options.message,
      };

      await client.followUp(attemptId, request);
      console.log(`Follow-up message sent successfully.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Force push command
attemptCommand
  .command("force-push")
  .description("Force push attempt branch to remote")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--force", "Skip confirmation prompt")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      if (!options.force) {
        const confirmed = await Confirm.prompt(
          `Are you sure you want to force push? This may overwrite remote changes.`,
        );
        if (!confirmed) {
          console.log("Force push cancelled.");
          return;
        }
      }

      await client.forcePushAttempt(attemptId);
      console.log(`Branch force pushed successfully.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Abort conflicts command
attemptCommand
  .command("abort-conflicts")
  .description("Abort git conflicts for an attempt")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      await client.abortConflicts(attemptId);
      console.log(`Conflicts aborted successfully.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Attach existing PR command
attemptCommand
  .command("attach-pr")
  .description("Attach an existing GitHub PR to an attempt")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--pr-number <number:number>", "PR number to attach", {
    required: true,
  })
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const request: AttachPRRequest = {
        pr_number: options.prNumber,
      };

      const prUrl = await client.attachPR(attemptId, request);

      if (options.json) {
        console.log(JSON.stringify({ url: prUrl }, null, 2));
        return;
      }

      console.log(`PR #${options.prNumber} attached successfully!`);
      console.log(`URL: ${prUrl}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// PR comments command
attemptCommand
  .command("pr-comments")
  .description("View comments on the PR associated with an attempt")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const comments = await client.getPRComments(attemptId);

      if (options.json) {
        console.log(JSON.stringify(comments, null, 2));
        return;
      }

      if (comments.length === 0) {
        console.log("No comments found.");
        return;
      }

      for (const comment of comments) {
        console.log("---");
        console.log(`Author: ${comment.user}`);
        console.log(`Type:   ${comment.comment_type}`);
        console.log(`Date:   ${comment.created_at}`);
        if (comment.path) {
          console.log(
            `File:   ${comment.path}${comment.line ? `:${comment.line}` : ""}`,
          );
        }
        console.log(`\n${comment.body}\n`);
      }
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
