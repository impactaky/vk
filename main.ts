#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
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
import { printError, printInfo } from "./src/utils/output.ts";

const VERSION = "0.1.0";

function printHelp(): void {
  printInfo(`vk - CLI for vibe-kanban

USAGE:
  vk <command> [subcommand] [options]

COMMANDS:
  auth        Manage authentication
    login       Log in via GitHub OAuth
    status      Check authentication status
    logout      Log out and clear credentials

  config      Manage configuration
    set         Set a configuration value
    get         Get a configuration value
    list        List all configuration

  project     Manage projects
    list        List all projects
    view        View project details
    create      Create a new project
    delete      Delete a project

  task        Manage tasks
    list        List tasks for a project
    view        View task details
    create      Create a new task
    update      Update a task
    delete      Delete a task

  attempt     Manage task attempts
    list        List attempts for a task
    view        View attempt details
    create      Create a new task attempt
    follow-up   Send a follow-up message to an attempt

OPTIONS:
  -h, --help     Show help
  -v, --version  Show version
  --json         Output as JSON (where applicable)

EXAMPLES:
  vk auth login
  vk project list
  vk task create <project-id> --title "My Task" --description "Task description"
  vk attempt create <task-id> --executor claude-code --base-branch main

For more information, visit: https://github.com/BloopAI/vibe-kanban
`);
}

function printVersion(): void {
  printInfo(`vk version ${VERSION}`);
}

async function main(): Promise<void> {
  const args = parse(Deno.args, {
    boolean: ["help", "version", "json", "force", "use-existing"],
    string: [
      "title",
      "description",
      "name",
      "path",
      "setup-script",
      "dev-script",
      "cleanup-script",
      "status",
      "executor",
      "base-branch",
      "variant",
      "prompt",
      "project-id",
    ],
    alias: {
      h: "help",
      v: "version",
    },
  });

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    printVersion();
    return;
  }

  const [command, subcommand, ...rest] = args._;

  if (!command) {
    printHelp();
    return;
  }

  try {
    switch (command) {
      case "auth":
        switch (subcommand) {
          case "login":
            await authLogin();
            break;
          case "status":
            await authStatus();
            break;
          case "logout":
            await authLogout();
            break;
          default:
            printError(`Unknown auth subcommand: ${subcommand}`);
            printInfo("Available subcommands: login, status, logout");
            Deno.exit(1);
        }
        break;

      case "config":
        switch (subcommand) {
          case "set":
            if (rest.length < 2) {
              printError("Usage: vk config set <key> <value>");
              Deno.exit(1);
            }
            await configSet(String(rest[0]), String(rest[1]));
            break;
          case "get":
            if (rest.length < 1) {
              printError("Usage: vk config get <key>");
              Deno.exit(1);
            }
            await configGet(String(rest[0]));
            break;
          case "list":
            await configList();
            break;
          default:
            printError(`Unknown config subcommand: ${subcommand}`);
            printInfo("Available subcommands: set, get, list");
            Deno.exit(1);
        }
        break;

      case "project":
        switch (subcommand) {
          case "list":
            await projectList({ json: args.json });
            break;
          case "view":
            if (rest.length < 1) {
              printError("Usage: vk project view <project-id>");
              Deno.exit(1);
            }
            await projectView(String(rest[0]), { json: args.json });
            break;
          case "create":
            if (!args.name || !args.path) {
              printError("Usage: vk project create --name <name> --path <path>");
              Deno.exit(1);
            }
            await projectCreate({
              name: args.name,
              path: args.path,
              setupScript: args["setup-script"],
              devScript: args["dev-script"],
              cleanupScript: args["cleanup-script"],
              useExisting: args["use-existing"],
            });
            break;
          case "delete":
            if (rest.length < 1) {
              printError("Usage: vk project delete <project-id>");
              Deno.exit(1);
            }
            await projectDelete(String(rest[0]), { force: args.force });
            break;
          default:
            printError(`Unknown project subcommand: ${subcommand}`);
            printInfo("Available subcommands: list, view, create, delete");
            Deno.exit(1);
        }
        break;

      case "task":
        switch (subcommand) {
          case "list":
            if (rest.length < 1) {
              printError("Usage: vk task list <project-id>");
              Deno.exit(1);
            }
            await taskList(String(rest[0]), { json: args.json });
            break;
          case "view":
            if (rest.length < 1) {
              printError("Usage: vk task view <task-id>");
              Deno.exit(1);
            }
            await taskView(String(rest[0]), { json: args.json });
            break;
          case "create":
            if (!args["project-id"] || !args.title) {
              printError("Usage: vk task create --project-id <id> --title <title>");
              Deno.exit(1);
            }
            await taskCreate({
              projectId: args["project-id"],
              title: args.title,
              description: args.description,
            });
            break;
          case "update":
            if (rest.length < 1) {
              printError(
                "Usage: vk task update <task-id> [--title <title>] [--description <desc>] [--status <status>]",
              );
              Deno.exit(1);
            }
            await taskUpdate(String(rest[0]), {
              title: args.title,
              description: args.description,
              status: args.status,
            });
            break;
          case "delete":
            if (rest.length < 1) {
              printError("Usage: vk task delete <task-id>");
              Deno.exit(1);
            }
            await taskDelete(String(rest[0]), { force: args.force });
            break;
          default:
            printError(`Unknown task subcommand: ${subcommand}`);
            printInfo("Available subcommands: list, view, create, update, delete");
            Deno.exit(1);
        }
        break;

      case "attempt":
        switch (subcommand) {
          case "list":
            if (rest.length < 1) {
              printError("Usage: vk attempt list <task-id>");
              Deno.exit(1);
            }
            await attemptList(String(rest[0]), { json: args.json });
            break;
          case "view":
            if (rest.length < 1) {
              printError("Usage: vk attempt view <attempt-id>");
              Deno.exit(1);
            }
            await attemptView(String(rest[0]), { json: args.json });
            break;
          case "create":
            if (rest.length < 1 || !args.executor || !args["base-branch"]) {
              printError(
                "Usage: vk attempt create <task-id> --executor <executor> --base-branch <branch>",
              );
              Deno.exit(1);
            }
            await attemptCreate({
              taskId: String(rest[0]),
              executor: args.executor,
              baseBranch: args["base-branch"],
              variant: args.variant,
            });
            break;
          case "follow-up":
            if (rest.length < 1 || !args.prompt) {
              printError("Usage: vk attempt follow-up <attempt-id> --prompt <message>");
              Deno.exit(1);
            }
            await attemptFollowUp(String(rest[0]), { prompt: args.prompt });
            break;
          default:
            printError(`Unknown attempt subcommand: ${subcommand}`);
            printInfo("Available subcommands: list, view, create, follow-up");
            Deno.exit(1);
        }
        break;

      default:
        printError(`Unknown command: ${command}`);
        printInfo("Run 'vk --help' for usage information");
        Deno.exit(1);
    }
  } catch (error) {
    printError(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
