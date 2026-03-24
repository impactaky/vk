import { Command } from "@cliffy/command";
import { addWorkspaceCrudCommands } from "./crud.ts";
import { addWorkspaceGitCommands } from "./git.ts";
import { createWorkspacePrCommand } from "./pr.ts";

export const taskAttemptsCommand = new Command()
  .description("Manage workspaces")
  .action(function () {
    this.showHelp();
  });

addWorkspaceCrudCommands(taskAttemptsCommand);
addWorkspaceGitCommands(taskAttemptsCommand);
taskAttemptsCommand.command("pr", createWorkspacePrCommand());
