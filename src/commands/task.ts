import { Command } from "@cliffy/command";
import { Confirm, Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { CreateTask, TaskStatus, UpdateTask } from "../api/types.ts";
import {
  getProjectId,
  ProjectResolverError,
} from "../utils/project-resolver.ts";

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
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(options.project, client);
      const tasks = await client.listTasks(projectId);

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
  .arguments("<id:string>")
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    const client = await ApiClient.create();
    const task = await client.getTask(id);

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
    console.log(`Created:     ${task.created_at}`);
    console.log(`Updated:     ${task.updated_at}`);
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
  .action(async (options) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(options.project, client);

      let title = options.title;
      let description = options.description;

      if (!title) {
        title = await Input.prompt("Task title:");
      }

      if (!description) {
        description = await Input.prompt({
          message: "Task description (optional):",
          default: "",
        });
      }

      const createTask: CreateTask = {
        project_id: projectId,
        title,
        description: description || undefined,
      };

      const task = await client.createTask(createTask);

      console.log(`Task created successfully!`);
      console.log(`ID: ${task.id}`);
    } catch (error) {
      if (error instanceof ProjectResolverError) {
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
  .arguments("<id:string>")
  .option("--title <title:string>", "New title")
  .option("--description <desc:string>", "New description")
  .option(
    "--status <status:string>",
    "New status (pending, in_progress, completed, cancelled)",
  )
  .action(async (options, id) => {
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

    if (Object.keys(update).length === 0) {
      console.log("No updates specified.");
      return;
    }

    const client = await ApiClient.create();
    const task = await client.updateTask(id, update);

    console.log(`Task ${task.id} updated.`);
  });

// Delete task
taskCommand
  .command("delete")
  .description("Delete a task")
  .arguments("<id:string>")
  .option("--force", "Skip confirmation")
  .action(async (options, id) => {
    if (!options.force) {
      const confirmed = await Confirm.prompt(
        `Are you sure you want to delete task ${id}?`,
      );
      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }
    }

    const client = await ApiClient.create();
    await client.deleteTask(id);
    console.log(`Task ${id} deleted.`);
  });
