import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { Session } from "../api/types.ts";
import { handleCliError } from "../utils/error-handler.ts";
import { getAttemptIdWithAutoDetect } from "../utils/attempt-resolver.ts";
import { selectSession } from "../utils/fzf.ts";

export const sessionCommand = new Command()
  .description("Manage sessions for workspaces")
  .action(function () {
    this.showHelp();
  });

function resolveSessionIdFromCurrentAttempt(
  sessions: Session[],
  sessionInput: string,
): string {
  const exactMatch = sessions.find((session) => session.id === sessionInput);
  if (exactMatch) {
    return exactMatch.id;
  }

  const matches = sessions.filter((session) =>
    session.id.startsWith(sessionInput)
  );
  if (matches.length === 1) {
    return matches[0].id;
  }

  if (matches.length > 1) {
    const candidates = matches.map((session) => `  - ${session.id}`).join("\n");
    throw new Error(
      `Session ID "${sessionInput}" is ambiguous.\n` +
        `Did you mean one of these?:\n${candidates}`,
    );
  }

  throw new Error(
    `No session ID matching "${sessionInput}" was found for this attempt.`,
  );
}

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
        .header(["ID", "Executor", "Created", "Updated"])
        .body(
          sessions.map((s) => [
            s.id,
            s.executor || "-",
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
  .arguments("[session-id:string]")
  .option(
    "--project <id:string>",
    "Project ID (for fzf selection, auto-detected from git if omitted)",
  )
  .option("--json", "Output as JSON")
  .action(async (options, sessionId) => {
    try {
      const client = await ApiClient.create();
      const workspaceId = await getAttemptIdWithAutoDetect(
        client,
        undefined,
        options.project,
      );

      const sessions = await client.listSessions(workspaceId);
      if (sessions.length === 0) {
        throw new Error("No sessions found for this workspace.");
      }

      const resolvedSessionId = sessionId
        ? resolveSessionIdFromCurrentAttempt(sessions, sessionId)
        : sessions.length === 1
        ? sessions[0].id
        : await selectSession(sessions);

      const session = await client.getSession(resolvedSessionId);

      if (options.json) {
        console.log(JSON.stringify(session, null, 2));
        return;
      }

      console.log(`Session ID:    ${session.id}`);
      console.log(`Workspace ID:  ${session.workspace_id}`);
      console.log(`Executor:      ${session.executor || "-"}`);
      console.log(`Created:       ${session.created_at}`);
      console.log(`Updated:       ${session.updated_at}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
