import { Command } from "@cliffy/command";
import { Confirm, Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { open } from "@opensrc/deno-open";
import { ApiClient } from "../api/client.ts";
import { getApiUrl, loadConfig } from "../api/config.ts";
import type {
  CreateTask,
  CreateWorkspace,
  TaskStatus,
  UpdateTask,
} from "../api/types.ts";
import { getProjectId } from "../utils/project-resolver.ts";
import { parseTaskFromFile } from "../utils/markdown-parser.ts";
import { applyFilters } from "../utils/filter.ts";
import { getTaskIdWithAutoDetect } from "../utils/attempt-resolver.ts";
import { parseExecutorString } from "../utils/executor-parser.ts";
import { handleCliError } from "../utils/error-handler.ts";

export const taskCommand = new Command()
  .description("Manage tasks")
  .action(function () {
    this.showHelp();
  });

// List tasks
taskCommand
  .command("list")
  .description("List tasks for a project")
  .option(
    "--project <id:string>",
    "Project ID (auto-detected from git if omitted)",
  )
  .option(
    "--status <status:string>",
    "Filter by task status (todo, inprogress, inreview, done, cancelled)",
  )
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(options.project, client);
      let tasks = await client.listTasks(projectId);

      // Build filter object from provided options
      const filters: Record<string, unknown> = {};
      if (options.status !== undefined) {
        filters.status = options.status;
      }

      // Apply filters
      tasks = applyFilters(tasks, filters);

      if (options.json) {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }

      if (tasks.length === 0) {
        console.log("No tasks found.");
        return;
      }

      const table = new Table()
        .header(["ID", "Title", "Status"])
        .body(
          tasks.map((t) => [t.id, t.title, t.status]),
        );

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Show task
taskCommand
  .command("show")
  .description("Show task details")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();

      const taskId = await getTaskIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const task = await client.getTask(taskId);

      if (options.json) {
        console.log(JSON.stringify(task, null, 2));
        return;
      }

      console.log(`ID:                  ${task.id}`);
      console.log(`Project ID:          ${task.project_id}`);
      console.log(`Title:               ${task.title}`);
      console.log(`Status:              ${task.status}`);
      if (task.description) {
        console.log(`Description:         ${task.description}`);
      }
      if (task.parent_workspace_id) {
        console.log(`Parent Workspace ID: ${task.parent_workspace_id}`);
      }
      console.log(`Created:             ${task.created_at}`);
      console.log(`Updated:             ${task.updated_at}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Create task
taskCommand
  .command("create")
  .description("Create a new task")
  .option(
    "--project <id:string>",
    "Project ID (auto-detected from git if omitted)",
  )
  .option("--title <title:string>", "Task title")
  .option("--description <desc:string>", "Task description")
  .option("--from <file:file>", "Create task from markdown file")
  .option("--run", "Create a workspace and start execution immediately")
  .option(
    "--executor <executor:string>",
    "Executor profile ID in format <name>:<variant> (e.g., CLAUDE_CODE:DEFAULT). Required when --run is specified unless default-executor is configured.",
  )
  .option(
    "--target-branch <branch:string>",
    "Target branch for workspace repos (default: repo's default or 'main')",
  )
  .action(async (options) => {
    try {
      let executorString: string | undefined;
      if (options.run) {
        if (options.executor) {
          executorString = options.executor;
        } else {
          executorString = (await loadConfig()).defaultExecutor;
          if (!executorString) {
            console.error(
              "Error: --executor is required when --run is specified. Set a default with `vk config set default-executor <name>:<variant>`.",
            );
            Deno.exit(1);
          }
        }
      }

      const client = await ApiClient.create();
      const projectId = await getProjectId(options.project, client);

      let title = options.title;
      let description = options.description;

      // Handle --from option
      if (options.from) {
        if (options.title || options.description) {
          console.error(
            "Error: Cannot use --from with --title or --description",
          );
          Deno.exit(1);
        }

        const parsed = await parseTaskFromFile(options.from);
        title = parsed.title;
        description = parsed.description;
      } else {
        if (!title) {
          title = await Input.prompt("Task title:");
        }

        if (!description) {
          description = await Input.prompt({
            message: "Task description (optional):",
            default: "",
          });
        }
      }

      const createTask: CreateTask = {
        project_id: projectId,
        title,
        description: description || undefined,
      };

      const task = await client.createTask(createTask);

      console.log(`Task created successfully!`);
      console.log(`ID: ${task.id}`);

      // If --run is specified, create a workspace and start execution
      if (options.run && executorString) {
        const executorProfileId = parseExecutorString(executorString);

        // Get project repos to build repos[] array
        const projectRepos = await client.listProjectRepos(projectId);
        if (projectRepos.length === 0) {
          console.error(
            "Error: Project has no repositories. Add a repository first.",
          );
          Deno.exit(1);
        }

        // Build repos array with target branches
        const repos = projectRepos.map((repo) => ({
          repo_id: repo.id,
          target_branch: options.targetBranch || repo.default_target_branch ||
            "main",
        }));

        const createWorkspace: CreateWorkspace = {
          task_id: task.id,
          executor_profile_id: executorProfileId,
          repos,
        };

        const workspace = await client.createWorkspace(createWorkspace);

        console.log(`Workspace created successfully!`);
        console.log(`Workspace ID: ${workspace.id}`);
        console.log(`Branch: ${workspace.branch}`);
      }
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Update task
taskCommand
  .command("update")
  .description("Update a task")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--title <title:string>", "New title")
  .option("--description <desc:string>", "New description")
  .option(
    "--status <status:string>",
    "New status (todo, inprogress, inreview, done, cancelled)",
  )
  .action(async (options, id) => {
    try {
      const update: UpdateTask = {};

      if (options.title) {
        update.title = options.title;
      }
      if (options.description !== undefined) {
        update.description = options.description || null;
      }
      if (options.status) {
        update.status = options.status as TaskStatus;
      }

      if (Object.keys(update).length === 0) {
        console.log("No updates specified.");
        return;
      }

      const client = await ApiClient.create();

      const taskId = await getTaskIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const task = await client.updateTask(taskId, update);

      console.log(`Task ${task.id} updated.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Delete task
taskCommand
  .command("delete")
  .description("Delete a task")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--force", "Skip confirmation")
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();

      const taskId = await getTaskIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      if (!options.force) {
        const confirmed = await Confirm.prompt(
          `Are you sure you want to delete task ${taskId}?`,
        );
        if (!confirmed) {
          console.log("Cancelled.");
          return;
        }
      }

      await client.deleteTask(taskId);
      console.log(`Task ${taskId} deleted.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Open task in browser
taskCommand
  .command("open")
  .description("Open a task in the browser")
  .arguments("[id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .action(async (options, id) => {
    try {
      const client = await ApiClient.create();

      const taskId = await getTaskIdWithAutoDetect(
        client,
        id,
        options.project,
      );

      const task = await client.getTask(taskId);

      const baseUrl = await getApiUrl();
      const url = `${baseUrl}/projects/${task.project_id}/tasks/${task.id}`;

      console.log(`Opening: ${url}`);
      await open(url);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
