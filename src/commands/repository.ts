import { Command } from "@cliffy/command";
import { Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type {
  InitRepoRequest,
  RegisterRepoRequest,
  UpdateRepo,
} from "../api/types.ts";
import { applyFilters } from "../utils/filter.ts";
import { handleCliError } from "../utils/error-handler.ts";
import { getRepositoryId } from "../utils/repository-resolver.ts";

export const repositoryCommand = new Command()
  .description("Manage repositories")
  .action(function () {
    this.showHelp();
  });

// List repositories
repositoryCommand
  .command("list")
  .description("List all repositories")
  .option("--name <name:string>", "Filter by repository name")
  .option("--path <path:string>", "Filter by repository path")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();
      let repos = await client.listRepos();

      // Build filter object from provided options
      const filters: Record<string, unknown> = {};
      if (options.name !== undefined) {
        filters.name = options.name;
      }
      if (options.path !== undefined) {
        filters.path = options.path;
      }

      // Apply filters
      repos = applyFilters(repos, filters);

      if (options.json) {
        console.log(JSON.stringify(repos, null, 2));
        return;
      }

      if (repos.length === 0) {
        console.log("No repositories found.");
        return;
      }

      const table = new Table()
        .header(["ID", "Name", "Display Name", "Path"])
        .body(
          repos.map((r) => [
            r.id,
            r.name,
            r.display_name || "-",
            r.path,
          ]),
        );

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Show repository
repositoryCommand
  .command("show")
  .description("Show repository details")
  .arguments("[id:string]")
  .option("--json", "Output as JSON")
  .option("--debug", "Show debug output for repository resolution")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const repoId = await getRepositoryId(id, client, options.debug);
      const repo = await client.getRepo(repoId);

      if (options.json) {
        console.log(JSON.stringify(repo, null, 2));
        return;
      }

      console.log(`ID:                   ${repo.id}`);
      console.log(`Name:                 ${repo.name}`);
      console.log(`Display Name:         ${repo.display_name || "-"}`);
      console.log(`Path:                 ${repo.path}`);
      if (repo.setup_script) {
        console.log(`Setup Script:         ${repo.setup_script}`);
      }
      if (repo.cleanup_script) {
        console.log(`Cleanup Script:       ${repo.cleanup_script}`);
      }
      if (repo.copy_files) {
        console.log(`Copy Files:           ${repo.copy_files}`);
      }
      console.log(
        `Parallel Setup:       ${repo.parallel_setup_script ? "Yes" : "No"}`,
      );
      if (repo.dev_server_script) {
        console.log(`Dev Server Script:    ${repo.dev_server_script}`);
      }
      console.log(`Created:              ${repo.created_at}`);
      console.log(`Updated:              ${repo.updated_at}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Register existing repository
repositoryCommand
  .command("register")
  .description("Register an existing git repository")
  .option("--path <path:string>", "Path to the git repository")
  .option("--display-name <name:string>", "Display name for the repository")
  .action(async (options) => {
    try {
      let path = options.path;
      let displayName = options.displayName;

      if (!path) {
        path = await Input.prompt("Repository path:");
      }

      if (displayName === undefined) {
        displayName = await Input.prompt({
          message: "Display name (optional):",
          default: "",
        });
      }

      const request: RegisterRepoRequest = {
        path,
        display_name: displayName || null,
      };

      const client = await ApiClient.create();
      const repo = await client.registerRepo(request);

      console.log(`Repository registered successfully!`);
      console.log(`ID: ${repo.id}`);
      console.log(`Name: ${repo.name}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Initialize new repository
repositoryCommand
  .command("init")
  .description("Initialize a new git repository")
  .option("--parent-path <path:string>", "Parent directory path")
  .option("--folder-name <name:string>", "Folder name for the new repository")
  .action(async (options) => {
    try {
      let parentPath = options.parentPath;
      let folderName = options.folderName;

      if (!parentPath) {
        parentPath = await Input.prompt("Parent directory path:");
      }

      if (!folderName) {
        folderName = await Input.prompt("Folder name:");
      }

      const request: InitRepoRequest = {
        parent_path: parentPath,
        folder_name: folderName,
      };

      const client = await ApiClient.create();
      const repo = await client.initRepo(request);

      console.log(`Repository initialized successfully!`);
      console.log(`ID: ${repo.id}`);
      console.log(`Path: ${repo.path}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Update repository
repositoryCommand
  .command("update")
  .description("Update repository properties")
  .arguments("[id:string]")
  .option("--display-name <name:string>", "New display name")
  .option("--setup-script <script:string>", "Setup script command")
  .option("--cleanup-script <script:string>", "Cleanup script command")
  .option("--copy-files <files:string>", "Files to copy (glob patterns)")
  .option("--parallel-setup", "Enable parallel setup script")
  .option("--no-parallel-setup", "Disable parallel setup script")
  .option("--dev-server-script <script:string>", "Dev server script command")
  .option("--debug", "Show debug output for repository resolution")
  .action(async (options, id?: string) => {
    try {
      const update: UpdateRepo = {};

      if (options.displayName !== undefined) {
        update.display_name = options.displayName || null;
      }
      if (options.setupScript !== undefined) {
        update.setup_script = options.setupScript || null;
      }
      if (options.cleanupScript !== undefined) {
        update.cleanup_script = options.cleanupScript || null;
      }
      if (options.copyFiles !== undefined) {
        update.copy_files = options.copyFiles || null;
      }
      if (options.parallelSetup !== undefined) {
        update.parallel_setup_script = options.parallelSetup;
      }
      if (options.devServerScript !== undefined) {
        update.dev_server_script = options.devServerScript || null;
      }

      if (Object.keys(update).length === 0) {
        console.log("No updates specified.");
        return;
      }

      const client = await ApiClient.create();
      const repoId = await getRepositoryId(id, client, options.debug);
      const repo = await client.updateRepo(repoId, update);
      console.log(`Repository ${repo.id} updated.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// List branches for a repository
repositoryCommand
  .command("branches")
  .description("List branches for a repository")
  .arguments("[id:string]")
  .option("--remote", "Show only remote branches")
  .option("--local", "Show only local branches")
  .option("--json", "Output as JSON")
  .option("--debug", "Show debug output for repository resolution")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const repoId = await getRepositoryId(id, client, options.debug);
      let branches = await client.getRepoBranches(repoId);

      // Filter by remote/local if specified
      if (options.remote) {
        branches = branches.filter((b) => b.is_remote);
      } else if (options.local) {
        branches = branches.filter((b) => !b.is_remote);
      }

      if (options.json) {
        console.log(JSON.stringify(branches, null, 2));
        return;
      }

      if (branches.length === 0) {
        console.log("No branches found.");
        return;
      }

      const table = new Table()
        .header(["Name", "Current", "Remote"])
        .body(
          branches.map((b) => [
            b.name,
            b.is_current ? "*" : "",
            b.is_remote ? "Yes" : "No",
          ]),
        );

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
