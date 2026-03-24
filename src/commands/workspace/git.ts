import type { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../../api/client.ts";
import { getAttemptIdWithAutoDetect } from "../../utils/attempt-resolver.ts";
import { CliError } from "../../utils/error-handler.ts";
import { getRepositoryId } from "../../utils/repository-resolver.ts";

export function addWorkspaceGitCommands(command: Command): void {
  command
    .command("branch-status")
    .description("Show branch status for repositories in a workspace")
    .arguments("[id:string]")
    .option("--json", "Output as JSON")
    .action(async (options, id?: string) => {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const statuses = await client.getBranchStatus(attemptId);

      if (options.json) {
        console.log(JSON.stringify(statuses, null, 2));
        return;
      }

      if (statuses.length === 0) {
        console.log("No branch status found.");
        return;
      }

      const table = new Table()
        .header([
          "Repository",
          "Ahead",
          "Behind",
          "Uncommitted",
          "Untracked",
          "Conflict",
        ])
        .body(statuses.map((status) => [
          status.repo_name,
          String(status.commits_ahead),
          String(status.commits_behind),
          String(status.uncommitted_count),
          String(status.untracked_count),
          status.conflicted_files.length > 0 ? "Yes" : "No",
        ]));

      table.render();
    });

  command
    .command("rename-branch")
    .description("Rename workspace branch")
    .arguments("[id:string]")
    .option("--new-branch-name <name:string>", "New branch name")
    .option("--json", "Output as JSON")
    .action(async (options, id?: string) => {
      if (!options.newBranchName) {
        throw new CliError("Option --new-branch-name is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const result = await client.renameBranch(attemptId, {
        new_branch_name: options.newBranchName,
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      const branchName = "branch" in result && result.branch
        ? result.branch
        : options.newBranchName;
      console.log(`Workspace ${attemptId} branch renamed to ${branchName}.`);
    });

  command
    .command("merge")
    .description("Merge workspace branch")
    .arguments("[id:string]")
    .option("--repo <repo:string>", "Repository ID or name")
    .action(async (options, id?: string) => {
      if (!options.repo) {
        throw new CliError("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      await client.mergeWorkspace(attemptId, { repo_id: repoId });
      console.log(`Workspace ${attemptId} merged for repo ${repoId}.`);
    });

  command
    .command("push")
    .description("Push workspace branch")
    .arguments("[id:string]")
    .option("--repo <repo:string>", "Repository ID or name")
    .action(async (options, id?: string) => {
      if (!options.repo) {
        throw new CliError("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      await client.pushWorkspace(attemptId, { repo_id: repoId });
      console.log(`Workspace ${attemptId} pushed for repo ${repoId}.`);
    });

  command
    .command("rebase")
    .description("Rebase workspace branch")
    .arguments("[id:string]")
    .option("--repo <repo:string>", "Repository ID or name")
    .option("--old-base-branch <name:string>", "Old base branch")
    .option("--new-base-branch <name:string>", "New base branch")
    .action(async (options, id?: string) => {
      if (!options.repo) {
        throw new CliError("Option --repo is required.");
      }

      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      const repoId = await getRepositoryId(options.repo, client);
      await client.rebaseWorkspace(attemptId, {
        repo_id: repoId,
        old_base_branch: options.oldBaseBranch,
        new_base_branch: options.newBaseBranch,
      });
      console.log(`Workspace ${attemptId} rebased for repo ${repoId}.`);
    });

  command
    .command("stop")
    .description("Stop workspace")
    .arguments("[id:string]")
    .action(async (_options, id?: string) => {
      const client = await ApiClient.create();
      const attemptId = await getAttemptIdWithAutoDetect(client, id);
      await client.stopWorkspace(attemptId);
      console.log(`Workspace ${attemptId} stopped.`);
    });
}
