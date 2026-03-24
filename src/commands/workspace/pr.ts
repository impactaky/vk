import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../../api/client.ts";
import { getAttemptIdWithAutoDetect } from "../../utils/attempt-resolver.ts";
import { CliError } from "../../utils/error-handler.ts";
import { getRepositoryId } from "../../utils/repository-resolver.ts";

export function createWorkspacePrCommand() {
  const prCommand = new Command()
    .description("Pull request operations for workspaces")
    .option("--id <id:string>", "Workspace ID")
    .option("--repo <repo:string>", "Repository ID or name")
    .option("--title <title:string>", "Pull request title")
    .option("--body <body:string>", "Pull request body")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      if (!options.repo) {
        throw new CliError("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, options.id);
      const repoId = await getRepositoryId(options.repo, client);
      const title = options.title || `Workspace ${attemptId}`;
      const url = await client.createPR(attemptId, {
        repo_id: repoId,
        title,
        body: options.body,
      });

      if (options.json) {
        console.log(JSON.stringify(url, null, 2));
        return;
      }

      console.log(`Pull request created: ${url}`);
    });

  prCommand
    .command("attach")
    .description("Attach an existing pull request to a workspace")
    .arguments("[id:string]")
    .option("--repo <repo:string>", "Repository ID or name")
    .option("--pr-number <number:number>", "Pull request number")
    .option("--json", "Output as JSON")
    .action(async (options, id?: string) => {
      if (!options.repo) {
        throw new CliError("Option --repo is required.");
      }
      if (options.prNumber === undefined) {
        throw new CliError("Option --pr-number is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      const result = await client.attachPR(attemptId, {
        repo_id: repoId,
        pr_number: options.prNumber,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(`Pull request attached: ${result.pr_url}`);
    });

  prCommand
    .command("comments")
    .description("List pull request comments for a workspace")
    .arguments("[id:string]")
    .option("--repo <repo:string>", "Repository ID or name")
    .option("--json", "Output as JSON")
    .action(async (options, id?: string) => {
      if (!options.repo) {
        throw new CliError("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      const response = await client.getPRComments(attemptId, repoId);

      if (options.json) {
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      if (response.comments.length === 0) {
        console.log("No PR comments found.");
        return;
      }

      const table = new Table()
        .header(["ID", "Type", "User", "Path", "Line", "Created"])
        .body(response.comments.map((comment) => [
          String(comment.id),
          comment.comment_type,
          comment.user,
          comment.path || "-",
          comment.line ? String(comment.line) : "-",
          comment.created_at,
        ]));

      table.render();
    });

  return prCommand;
}
