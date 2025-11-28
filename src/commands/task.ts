import { Command } from "@cliffy/command";
import { Confirm, Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { CreateTask, TaskStatus, UpdateTask } from "../api/types.ts";
import {
  getProjectId,
  ProjectResolverError,
} from "../utils/project-resolver.ts";
import {
  MarkdownParseError,
  parseTaskFromFile,
} from "../utils/markdown-parser.ts";
import {
  FzfCancelledError,
  FzfNotInstalledError,
  selectTask,
} from "../utils/fzf.ts";
import { applyFilters } from "../utils/filter.ts";
import { getCurrentTaskId } from "../utils/git.ts";

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
  .option("--status <status:string>", "Filter by task status")
  .option("--priority <priority:number>", "Filter by priority")
  .option("--executor <executor:string>", "Filter by executor")
  .option("--label <label:string>", "Filter by label")
  .option("--favorite <favorite:boolean>", "Filter by favorite status")
  .option("--color <color:string>", "Filter by hex color")
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
      if (options.priority !== undefined) {
        filters.priority = options.priority;
      }
      if (options.executor !== undefined) {
        filters.executor = options.executor;
      }
      if (options.label !== undefined) {
        filters.labels = options.label;
      }
      if (options.favorite !== undefined) {
        filters.is_favorite = options.favorite;
      }
      if (options.color !== undefined) {
        filters.hex_color = options.color;
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
        .header(["ID", "Title", "Status", "Executor"])
        .body(
          tasks.map((t) => [t.id, t.title, t.status, t.executor || "-"]),
        );

      table.render();
    } catch (error) {
      if (error instanceof ProjectResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
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

      let taskId = id;
      if (!taskId) {
        // Try to auto-detect from branch name first
        const detectedTaskId = await getCurrentTaskId();
        if (detectedTaskId) {
          taskId = detectedTaskId;
        } else {
          // Fall back to fzf selection
          const projectId = await getProjectId(options.project, client);
          const tasks = await client.listTasks(projectId);
          if (tasks.length === 0) {
            console.error("No tasks found in the project.");
            Deno.exit(1);
          }
          taskId = await selectTask(tasks);
        }
      }

      const task = await client.getTask(taskId);

      if (options.json) {
        console.log(JSON.stringify(task, null, 2));
        return;
      }

      console.log(`ID:          ${task.id}`);
      console.log(`Project ID:  ${task.project_id}`);
      console.log(`Title:       ${task.title}`);
      console.log(`Status:      ${task.status}`);
      if (task.description) {
        console.log(`Description: ${task.description}`);
      }
      if (task.priority !== undefined) {
        console.log(`Priority:    ${task.priority}`);
      }
      if (task.due_date) {
        console.log(`Due Date:    ${task.due_date}`);
      }
      if (task.labels && task.labels.length > 0) {
        console.log(`Labels:      ${task.labels.join(", ")}`);
      }
      if (task.percent_done !== undefined) {
        console.log(`Progress:    ${task.percent_done}%`);
      }
      if (task.hex_color) {
        console.log(`Color:       ${task.hex_color}`);
      }
      if (task.is_favorite) {
        console.log(`Favorite:    Yes`);
      }
      console.log(`Created:     ${task.created_at}`);
      console.log(`Updated:     ${task.updated_at}`);
    } catch (error) {
      if (error instanceof ProjectResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      if (
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
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
  .option("--priority <priority:number>", "Task priority (1-5)")
  .option("--due-date <date:string>", "Due date (ISO format)")
  .option("--labels <labels:string>", "Comma-separated labels")
  .option("--color <color:string>", "Hex color (e.g., #ff5733)")
  .option("--favorite", "Mark as favorite")
  .action(async (options) => {
    try {
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
        priority: options.priority,
        due_date: options.dueDate,
        labels: options.labels?.split(",").map((l: string) => l.trim()),
        hex_color: options.color,
        is_favorite: options.favorite,
      };

      const task = await client.createTask(createTask);

      console.log(`Task created successfully!`);
      console.log(`ID: ${task.id}`);
    } catch (error) {
      if (error instanceof ProjectResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      if (error instanceof MarkdownParseError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
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
    "New status (pending, in_progress, completed, cancelled)",
  )
  .option("--priority <priority:number>", "Task priority (1-5)")
  .option("--due-date <date:string>", "Due date (ISO format, empty to clear)")
  .option("--labels <labels:string>", "Comma-separated labels")
  .option("--percent-done <percent:number>", "Completion percentage (0-100)")
  .option("--color <color:string>", "Hex color (e.g., #ff5733)")
  .option("--favorite", "Toggle favorite status")
  .action(async (options, id) => {
    try {
      const update: UpdateTask = {};

      if (options.title) {
        update.title = options.title;
      }
      if (options.description !== undefined) {
        update.description = options.description;
      }
      if (options.status) {
        update.status = options.status as TaskStatus;
      }
      if (options.priority !== undefined) {
        update.priority = options.priority;
      }
      if (options.dueDate !== undefined) {
        update.due_date = options.dueDate || undefined;
      }
      if (options.labels !== undefined) {
        update.labels = options.labels.split(",").map((l: string) => l.trim());
      }
      if (options.percentDone !== undefined) {
        update.percent_done = options.percentDone;
      }
      if (options.color !== undefined) {
        update.hex_color = options.color;
      }
      if (options.favorite !== undefined) {
        update.is_favorite = options.favorite;
      }

      if (Object.keys(update).length === 0) {
        console.log("No updates specified.");
        return;
      }

      const client = await ApiClient.create();

      let taskId = id;
      if (!taskId) {
        // Try to auto-detect from branch name first
        const detectedTaskId = await getCurrentTaskId();
        if (detectedTaskId) {
          taskId = detectedTaskId;
        } else {
          // Fall back to fzf selection
          const projectId = await getProjectId(options.project, client);
          const tasks = await client.listTasks(projectId);
          if (tasks.length === 0) {
            console.error("No tasks found in the project.");
            Deno.exit(1);
          }
          taskId = await selectTask(tasks);
        }
      }

      const task = await client.updateTask(taskId, update);

      console.log(`Task ${task.id} updated.`);
    } catch (error) {
      if (error instanceof ProjectResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      if (
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
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

      let taskId = id;
      if (!taskId) {
        // Try to auto-detect from branch name first
        const detectedTaskId = await getCurrentTaskId();
        if (detectedTaskId) {
          taskId = detectedTaskId;
        } else {
          // Fall back to fzf selection
          const projectId = await getProjectId(options.project, client);
          const tasks = await client.listTasks(projectId);
          if (tasks.length === 0) {
            console.error("No tasks found in the project.");
            Deno.exit(1);
          }
          taskId = await selectTask(tasks);
        }
      }

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
      if (error instanceof ProjectResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      if (
        error instanceof FzfNotInstalledError ||
        error instanceof FzfCancelledError
      ) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });
