#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { authLogin, authLogout, authStatus } from "./src/commands/auth.ts";
import { configGet, configList, configSet } from "./src/commands/config.ts";
import { projectCreate, projectDelete, projectList, projectView } from "./src/commands/project.ts";
import { taskCreate, taskDelete, taskList, taskUpdate, taskView } from "./src/commands/task.ts";
import {
  attemptCreate,
  attemptFollowUp,
  attemptList,
  attemptView,
} from "./src/commands/attempt.ts";
import { printError } from "./src/utils/output.ts";

const VERSION = "0.1.0";

async function main(): Promise<void> {
  // Create the root command
  const cli = new Command()
    .name("vk")
    .version(VERSION)
    .description("CLI for vibe-kanban")
    .action(function() {
      this.showHelp();
    });

  // Auth commands
  const authCommand = new Command()
    .description("Manage authentication")
    .action(function() {
      this.showHelp();
    });

  authCommand
    .command("login")
    .description("Log in via GitHub OAuth")
    .action(async () => {
      await authLogin();
    });

  authCommand
    .command("status")
    .description("Check authentication status")
    .action(async () => {
      await authStatus();
    });

  authCommand
    .command("logout")
    .description("Log out and clear credentials")
    .action(async () => {
      await authLogout();
    });

  cli.command("auth", authCommand);

  // Config commands
  const configCommand = new Command()
    .description("Manage configuration")
    .action(function() {
      this.showHelp();
    });

  configCommand
    .command("set <key:string> <value:string>")
    .description("Set a configuration value")
    .action(async (_options, key, value) => {
      await configSet(key, value);
    });

  configCommand
    .command("get <key:string>")
    .description("Get a configuration value")
    .action(async (_options, key) => {
      await configGet(key);
    });

  configCommand
    .command("list")
    .description("List all configuration")
    .action(async () => {
      await configList();
    });

  cli.command("config", configCommand);

  // Project commands
  const projectCommand = new Command()
    .description("Manage projects")
    .action(function() {
      this.showHelp();
    });

  projectCommand
    .command("list")
    .description("List all projects")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      await projectList({ json: options.json });
    });

  projectCommand
    .command("view <project-id:string>")
    .description("View project details")
    .option("--json", "Output as JSON")
    .action(async (options, projectId) => {
      await projectView(projectId, { json: options.json });
    });

  projectCommand
    .command("create")
    .description("Create a new project")
    .option("--name <name:string>", "Project name", { required: true })
    .option("--path <path:string>", "Project path", { required: true })
    .option("--setup-script <script:string>", "Setup script")
    .option("--dev-script <script:string>", "Dev script")
    .option("--cleanup-script <script:string>", "Cleanup script")
    .option("--use-existing", "Use existing directory")
    .action(async (options) => {
      await projectCreate({
        name: options.name,
        path: options.path,
        setupScript: options.setupScript,
        devScript: options.devScript,
        cleanupScript: options.cleanupScript,
        useExisting: options.useExisting,
      });
    });

  projectCommand
    .command("delete <project-id:string>")
    .description("Delete a project")
    .option("--force", "Force deletion without confirmation")
    .action(async (options, projectId) => {
      await projectDelete(projectId, { force: options.force });
    });

  cli.command("project", projectCommand);

  // Task commands
  const taskCommand = new Command()
    .description("Manage tasks")
    .action(function() {
      this.showHelp();
    });

  taskCommand
    .command("list [project-id:string]")
    .description("List tasks for a project (auto-detects from git remote if not specified)")
    .option("--json", "Output as JSON")
    .action(async (options, projectId) => {
      await taskList(projectId, { json: options.json });
    });

  taskCommand
    .command("view <task-id:string>")
    .description("View task details")
    .option("--json", "Output as JSON")
    .action(async (options, taskId) => {
      await taskView(taskId, { json: options.json });
    });

  taskCommand
    .command("create")
    .description("Create a new task (auto-detects project from git remote if --project-id not specified)")
    .option("--project-id <id:string>", "Project ID (auto-detected if omitted)")
    .option("--title <title:string>", "Task title", { required: true })
    .option("--description <description:string>", "Task description")
    .action(async (options) => {
      await taskCreate({
        projectId: options.projectId,
        title: options.title,
        description: options.description,
      });
    });

  taskCommand
    .command("update <task-id:string>")
    .description("Update a task")
    .option("--title <title:string>", "Task title")
    .option("--description <description:string>", "Task description")
    .option("--status <status:string>", "Task status")
    .action(async (options, taskId) => {
      await taskUpdate(taskId, {
        title: options.title,
        description: options.description,
        status: options.status,
      });
    });

  taskCommand
    .command("delete <task-id:string>")
    .description("Delete a task")
    .option("--force", "Force deletion without confirmation")
    .action(async (options, taskId) => {
      await taskDelete(taskId, { force: options.force });
    });

  cli.command("task", taskCommand);

  // Attempt commands
  const attemptCommand = new Command()
    .description("Manage task attempts")
    .action(function() {
      this.showHelp();
    });

  attemptCommand
    .command("list <task-id:string>")
    .description("List attempts for a task")
    .option("--json", "Output as JSON")
    .action(async (options, taskId) => {
      await attemptList(taskId, { json: options.json });
    });

  attemptCommand
    .command("view <attempt-id:string>")
    .description("View attempt details")
    .option("--json", "Output as JSON")
    .action(async (options, attemptId) => {
      await attemptView(attemptId, { json: options.json });
    });

  attemptCommand
    .command("create <task-id:string>")
    .description("Create a new task attempt")
    .option("--executor <executor:string>", "Executor type", { required: true })
    .option("--base-branch <branch:string>", "Base branch", { required: true })
    .option("--variant <variant:string>", "Variant")
    .action(async (options, taskId) => {
      await attemptCreate({
        taskId,
        executor: options.executor,
        baseBranch: options.baseBranch,
        variant: options.variant,
      });
    });

  attemptCommand
    .command("follow-up <attempt-id:string>")
    .description("Send a follow-up message to an attempt")
    .option("--prompt <message:string>", "Follow-up message", { required: true })
    .action(async (options, attemptId) => {
      await attemptFollowUp(attemptId, { prompt: options.prompt });
    });

  cli.command("attempt", attemptCommand);

  // All commands now use Cliffy, so always parse with Cliffy
  try {
    await cli.parse(Deno.args);
  } catch (error) {
    printError(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
