import { Command } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type {
  AttachPRRequest,
  CreatePRRequest,
  CreateWorkspace,
  FollowUpRequest,
  MergeWorkspaceRequest,
  PushWorkspaceRequest,
  RebaseWorkspaceRequest,
  RepoBranchStatus,
  UpdateWorkspace,
} from "../api/types.ts";
import { applyFilters } from "../utils/filter.ts";
import {
  getAttemptIdWithAutoDetect,
  getTaskIdWithAutoDetect,
} from "../utils/attempt-resolver.ts";
import { selectSession } from "../utils/fzf.ts";
import { parseExecutorString } from "../utils/executor-parser.ts";
import { handleCliError } from "../utils/error-handler.ts";

export const attemptCommand = new Command()
  .description("Manage workspaces (task attempts)")
  .action(function () {
    this.showHelp();
  });

// List workspaces
attemptCommand
  .command("list")
  .description("List workspaces for a task")
  .option(
    "--task <id:string>",
    "Task ID (auto-detected from current branch if omitted)",
  )
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--branch <branch:string>", "Filter by branch name")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();

      const taskId = await getTaskIdWithAutoDetect(
        client,
        options.task,
        options.project,
      );

      let workspaces = await client.listWorkspaces(taskId);

      // Build filter object from provided options
      const filters: Record<string, unknown> = {};
      if (options.branch !== undefined) {
        filters.branch = options.branch;
      }

      // Apply filters
      workspaces = applyFilters(workspaces, filters);

      if (options.json) {
        console.log(JSON.stringify(workspaces, null, 2));
        return;
      }

      if (workspaces.length === 0) {
        console.log("No workspaces found.");
        return;
      }

      const table = new Table()
        .header(["ID", "Branch", "Name", "Archived", "Pinned"])
        .body(
          workspaces.map((w) => [
            w.id,
            w.branch,
            w.name || "-",
            w.archived ? "Yes" : "No",
            w.pinned ? "Yes" : "No",
          ]),
        );

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Show workspace
attemptCommand
  .command("show")
  .description("Show workspace details")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      const workspace = await client.getWorkspace(workspaceId);

      if (options.json) {
        console.log(JSON.stringify(workspace, null, 2));
        return;
      }

      console.log(`ID:              ${workspace.id}`);
      console.log(`Task ID:         ${workspace.task_id}`);
      console.log(`Branch:          ${workspace.branch}`);
      console.log(`Name:            ${workspace.name || "-"}`);
      console.log(`Working Dir:     ${workspace.agent_working_dir || "-"}`);
      console.log(`Archived:        ${workspace.archived ? "Yes" : "No"}`);
      console.log(`Pinned:          ${workspace.pinned ? "Yes" : "No"}`);
      if (workspace.container_ref) {
        console.log(`Container Ref:   ${workspace.container_ref}`);
      }
      if (workspace.setup_completed_at) {
        console.log(`Setup Completed: ${workspace.setup_completed_at}`);
      }
      console.log(`Created:         ${workspace.created_at}`);
      console.log(`Updated:         ${workspace.updated_at}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Create workspace
attemptCommand
  .command("create")
  .description("Create a new workspace for a task")
  .option("--task <id:string>", "Task ID", { required: true })
  .option(
    "--executor <executor:string>",
    "Executor profile ID in format <name>:<variant> (e.g., CLAUDE_CODE:DEFAULT)",
    {
      required: true,
    },
  )
  .option(
    "--target-branch <branch:string>",
    "Target branch for workspace repos (default: repo's default or 'main')",
  )
  .action(async (options) => {
    try {
      const client = await ApiClient.create();

      // Parse executor string into profile ID
      const executorProfileId = parseExecutorString(options.executor);

      // Get task to find project_id
      const task = await client.getTask(options.task);

      // Get project repos to build repos[] array
      const projectRepos = await client.listProjectRepos(task.project_id);
      if (projectRepos.length === 0) {
        console.error(
          "Error: Project has no repositories. Add a repository first.",
        );
        Deno.exit(1);
      }

      // Build repos array with target branches
      const repos = projectRepos.map((repo) => ({
        repo_id: repo.id,
        target_branch:
          options.targetBranch || repo.default_target_branch || "main",
      }));

      const createWorkspace: CreateWorkspace = {
        task_id: options.task,
        executor_profile_id: executorProfileId,
        repos,
      };

      const workspace = await client.createWorkspace(createWorkspace);

      console.log(`Workspace created successfully!`);
      console.log(`ID: ${workspace.id}`);
      console.log(`Branch: ${workspace.branch}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Delete workspace
attemptCommand
  .command("delete")
  .description("Delete a workspace")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--force", "Delete without confirmation")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      if (!options.force) {
        const confirmed = await Confirm.prompt(
          `Are you sure you want to delete workspace ${workspaceId}?`,
        );
        if (!confirmed) {
          console.log("Deletion cancelled.");
          return;
        }
      }

      await client.deleteWorkspace(workspaceId);
      console.log(`Workspace ${workspaceId} deleted successfully.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Update workspace
attemptCommand
  .command("update")
  .description("Update workspace properties")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--name <name:string>", "New workspace name")
  .option("--archived", "Archive the workspace")
  .option("--no-archived", "Unarchive the workspace")
  .option("--pinned", "Pin the workspace")
  .option("--no-pinned", "Unpin the workspace")
  .option("--branch <name:string>", "New branch name")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      // Handle workspace property updates
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

      if (Object.keys(update).length > 0) {
        const workspace = await client.updateWorkspace(workspaceId, update);
        console.log(`Workspace ${workspace.id} updated.`);
      }

      // Handle branch rename separately
      if (options.branch) {
        const workspace = await client.renameBranch(workspaceId, {
          new_branch_name: options.branch,
        });
        console.log(`Branch renamed to: ${workspace.branch}`);
      }

      if (Object.keys(update).length === 0 && !options.branch) {
        console.log(
          "No update options specified. Use --name, --archived, --pinned, or --branch.",
        );
      }
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// List workspace repositories
attemptCommand
  .command("repos")
  .description("List repositories associated with this workspace")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const repos = await client.getWorkspaceRepos(workspaceId);

      if (options.json) {
        console.log(JSON.stringify(repos, null, 2));
        return;
      }

      if (repos.length === 0) {
        console.log("No repositories found.");
        return;
      }

      const table = new Table()
        .header(["Repo ID", "Target Branch"])
        .body(repos.map((r) => [
          r.repo_id,
          r.target_branch,
        ]));

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Helper function to get repo_id with auto-detection for single-repo workspaces
async function getRepoIdForWorkspace(
  client: ApiClient,
  workspaceId: string,
  explicitRepoId?: string,
): Promise<string> {
  if (explicitRepoId) {
    return explicitRepoId;
  }

  const repos = await client.getWorkspaceRepos(workspaceId);
  if (repos.length === 0) {
    throw new Error("Workspace has no repositories");
  }
  if (repos.length === 1) {
    return repos[0].repo_id;
  }
  throw new Error(
    `Workspace has ${repos.length} repositories. Please specify --repo <repo-id>`,
  );
}

// Merge workspace
attemptCommand
  .command("merge")
  .description("Merge workspace branch into target branch")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option(
    "--repo <id:string>",
    "Repository ID (auto-detected if workspace has only one repo)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      const repoId = await getRepoIdForWorkspace(
        client,
        workspaceId,
        options.repo,
      );
      const request: MergeWorkspaceRequest = { repo_id: repoId };
      const result = await client.mergeWorkspace(workspaceId, request);

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

// Push workspace
attemptCommand
  .command("push")
  .description("Push workspace branch to remote")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option(
    "--repo <id:string>",
    "Repository ID (auto-detected if workspace has only one repo)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      const repoId = await getRepoIdForWorkspace(
        client,
        workspaceId,
        options.repo,
      );
      const request: PushWorkspaceRequest = { repo_id: repoId };
      await client.pushWorkspace(workspaceId, request);
      console.log(`Branch pushed successfully.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Rebase workspace
attemptCommand
  .command("rebase")
  .description("Rebase workspace branch onto target branch")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option(
    "--repo <id:string>",
    "Repository ID (auto-detected if workspace has only one repo)",
  )
  .option("--old-base <branch:string>", "Old base branch to rebase from")
  .option("--new-base <branch:string>", "New base branch to rebase onto")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      const repoId = await getRepoIdForWorkspace(
        client,
        workspaceId,
        options.repo,
      );
      const request: RebaseWorkspaceRequest = {
        repo_id: repoId,
        old_base_branch: options.oldBase,
        new_base_branch: options.newBase,
      };
      await client.rebaseWorkspace(workspaceId, request);
      console.log(`Branch rebased successfully.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Stop workspace
attemptCommand
  .command("stop")
  .description("Stop workspace execution")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      await client.stopWorkspace(workspaceId);
      console.log(`Workspace execution stopped.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Create PR
attemptCommand
  .command("pr")
  .description("Create a GitHub PR for the workspace")
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
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      // Get workspace to find task_id, then get task for defaults
      const workspace = await client.getWorkspace(workspaceId);
      const task = await client.getTask(workspace.task_id);

      const request: CreatePRRequest = {
        title: options.title || task.title,
        body: options.body || task.description || "",
      };

      const prUrl = await client.createPR(workspaceId, request);

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
  .description("Show branch status for a workspace")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option(
    "--repo <id:string>",
    "Repository ID (auto-detected if workspace has only one repo)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      const statuses = await client.getBranchStatus(workspaceId);

      if (options.json) {
        console.log(JSON.stringify(statuses, null, 2));
        return;
      }

      // If --repo flag provided, filter to single repo and show detailed view
      if (options.repo) {
        const filtered = statuses.find(
          (s: RepoBranchStatus) => s.repo_id === options.repo,
        );
        if (!filtered) {
          throw new Error(`No status found for repo ${options.repo}`);
        }
        console.log(
          `Repo:                ${filtered.repo_name || filtered.repo_id}`,
        );
        console.log(`Target Branch:       ${filtered.target_branch_name}`);
        console.log(`Ahead:               ${filtered.commits_ahead} commits`);
        console.log(`Behind:              ${filtered.commits_behind} commits`);
        console.log(
          `Remote Ahead:        ${filtered.remote_commits_ahead} commits`,
        );
        console.log(
          `Remote Behind:       ${filtered.remote_commits_behind} commits`,
        );
        console.log(`Uncommitted:         ${filtered.uncommitted_count} files`);
        console.log(`Untracked:           ${filtered.untracked_count} files`);
        console.log(
          `Has Changes:         ${
            filtered.has_uncommitted_changes ? "Yes" : "No"
          }`,
        );
        console.log(
          `Rebase In Progress:  ${
            filtered.is_rebase_in_progress ? "Yes" : "No"
          }`,
        );
        if (filtered.conflict_op) {
          console.log(`Conflict Operation:  ${filtered.conflict_op}`);
          console.log(
            `Conflicted Files:    ${filtered.conflicted_files.length}`,
          );
        }
        return;
      }

      // Display all repos in table format
      if (statuses.length === 0) {
        console.log("No repositories found.");
        return;
      }

      const table = new Table()
        .header([
          "Repo",
          "Target Branch",
          "Ahead",
          "Behind",
          "Changes",
          "Conflicts",
        ])
        .body(
          statuses.map((s: RepoBranchStatus) => [
            s.repo_name || s.repo_id,
            s.target_branch_name,
            s.commits_ahead.toString(),
            s.commits_behind.toString(),
            s.has_uncommitted_changes ? "Yes" : "No",
            s.conflict_op ? s.conflicted_files.length.toString() : "-",
          ]),
        );

      table.render();

      if (statuses.length > 1) {
        console.log(
          `\nTip: Use --repo <id> to see detailed status for a specific repository`,
        );
      }
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Follow-up command - send message to running session
attemptCommand
  .command("follow-up")
  .description("Send a follow-up message to a running workspace")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--message <message:string>", "Message to send to the executor", {
    required: true,
  })
  .option(
    "--executor <executor:string>",
    "Override executor (format: NAME:VARIANT, e.g., CLAUDE_CODE:DEFAULT)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();

      // Resolve workspace ID (from arg, auto-detect, or fzf)
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      // Get sessions for the workspace
      const sessions = await client.listSessions(workspaceId);
      if (sessions.length === 0) {
        throw new Error("No sessions found for this workspace");
      }

      // Auto-select if single session, otherwise use fzf
      const sessionId = sessions.length === 1
        ? sessions[0].id
        : await selectSession(sessions);

      // Determine executor: use provided --executor flag, or default to CLAUDE_CODE
      // For Phase 1: default executor handling
      // Future: extract executor from session's execution process
      let executorProfileId;
      if (options.executor) {
        executorProfileId = parseExecutorString(options.executor);
      } else {
        // Default executor for follow-up - use CLAUDE_CODE as safe default
        executorProfileId = {
          executor: "CLAUDE_CODE" as const,
          variant: null,
        };
      }

      const request: FollowUpRequest = {
        prompt: options.message, // Map --message flag to prompt field
        executor_profile_id: executorProfileId,
      };

      await client.sessionFollowUp(sessionId, request);
      console.log("Follow-up message sent successfully.");
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Force push command
attemptCommand
  .command("force-push")
  .description("Force push workspace branch to remote")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option(
    "--repo <id:string>",
    "Repository ID (auto-detected if workspace has only one repo)",
  )
  .option("--force", "Skip confirmation prompt")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );
      const repoId = await getRepoIdForWorkspace(
        client,
        workspaceId,
        options.repo,
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

      const request: PushWorkspaceRequest = { repo_id: repoId };
      await client.forcePushWorkspace(workspaceId, request);
      console.log(`Branch force pushed successfully.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Abort conflicts command
attemptCommand
  .command("abort-conflicts")
  .description("Abort git conflicts for a workspace")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      await client.abortConflicts(workspaceId);
      console.log(`Conflicts aborted successfully.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Attach existing PR command
attemptCommand
  .command("attach-pr")
  .description("Attach an existing GitHub PR to a workspace")
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
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const request: AttachPRRequest = {
        pr_number: options.prNumber,
      };

      const prUrl = await client.attachPR(workspaceId, request);

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
  .description("View comments on the PR associated with a workspace")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option(
    "--repo <id:string>",
    "Repository ID (auto-detected if workspace has only one repo)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      // Resolve repo_id (auto-detect for single-repo, require flag for multi-repo)
      const repoId = await getRepoIdForWorkspace(
        client,
        workspaceId,
        options.repo,
      );

      const comments = await client.getPRComments(workspaceId, repoId);

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
