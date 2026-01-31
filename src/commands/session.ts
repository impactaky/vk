import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import { handleCliError } from "../utils/error-handler.ts";
import { getAttemptIdWithAutoDetect } from "../utils/attempt-resolver.ts";

export const sessionCommand = new Command()
  .description("Manage sessions for workspaces")
  .action(function () {
    this.showHelp();
  });

// List sessions for a workspace
sessionCommand
  .command("list")
  .description("List all sessions for a workspace")
  .arguments("[workspace-id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, workspaceId) => {
    try {
      const client = await ApiClient.create();
      const resolvedWorkspaceId = await getAttemptIdWithAutoDetect(
        client,
        workspaceId,
        options.project,
      );

      const sessions = await client.listSessions(resolvedWorkspaceId);

      if (options.json) {
        console.log(JSON.stringify(sessions, null, 2));
        return;
      }

      if (sessions.length === 0) {
        console.log("No sessions found for this workspace.");
        return;
      }

      const table = new Table()
        .header(["ID", "Created", "Updated"])
        .body(
          sessions.map((s) => [
            s.id,
            s.created_at,
            s.updated_at,
          ]),
        );

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Show session details
sessionCommand
  .command("show")
  .description("Show details for a session")
  .arguments("<session-id:string>")
  .option("--json", "Output as JSON")
  .action(async (options, sessionId) => {
    try {
      const client = await ApiClient.create();
      const session = await client.getSession(sessionId);

      if (options.json) {
        console.log(JSON.stringify(session, null, 2));
        return;
      }

      console.log(`Session ID:    ${session.id}`);
      console.log(`Workspace ID:  ${session.workspace_id}`);
      console.log(`Created:       ${session.created_at}`);
      console.log(`Updated:       ${session.updated_at}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
