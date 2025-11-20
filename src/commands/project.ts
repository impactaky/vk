import { Command } from "@cliffy/command";
import { Confirm, Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { CreateProject } from "../api/types.ts";
import { resolveDefaultProjectId } from "../utils/project_resolver.ts";

export const projectCommand = new Command()
  .description("Manage projects")
  .action(function () {
    this.showHelp();
  });

// List projects
projectCommand
  .command("list")
  .description("List all projects")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const client = await ApiClient.create();
    const projects = await client.listProjects();

    if (options.json) {
      console.log(JSON.stringify(projects, null, 2));
      return;
    }

    if (projects.length === 0) {
      console.log("No projects found.");
      return;
    }

    const table = new Table()
      .header(["ID", "Name", "Git Repo Path"])
      .body(projects.map((p) => [p.id, p.name, p.git_repo_path]));

    table.render();
  });

// Show project
projectCommand
  .command("show")
  .description("Show project details")
  .arguments("[id:string]")
  .option("--json", "Output as JSON")
  .action(async (options, id) => {
    const client = await ApiClient.create();

    // Resolve project ID from git repo if not provided
    let projectId = id;
    if (!projectId) {
      const resolvedId = await resolveDefaultProjectId(client);
      if (!resolvedId) {
        console.error(
          "Error: No project ID provided and could not resolve from git repository.",
        );
        console.error(
          "Please provide a project ID or run from a git repository with a matching project.",
        );
        Deno.exit(1);
      }
      projectId = resolvedId;
    }

    const project = await client.getProject(projectId);

    if (options.json) {
      console.log(JSON.stringify(project, null, 2));
      return;
    }

    console.log(`ID:            ${project.id}`);
    console.log(`Name:          ${project.name}`);
    console.log(`Git Repo Path: ${project.git_repo_path}`);
    if (project.setup_script) {
      console.log(`Setup Script:  ${project.setup_script}`);
    }
    if (project.dev_script) {
      console.log(`Dev Script:    ${project.dev_script}`);
    }
    if (project.cleanup_script) {
      console.log(`Cleanup Script: ${project.cleanup_script}`);
    }
    console.log(`Created:       ${project.created_at}`);
    console.log(`Updated:       ${project.updated_at}`);
  });

// Create project
projectCommand
  .command("create")
  .description("Create a new project")
  .option("--name <name:string>", "Project name")
  .option("--path <path:string>", "Git repository path")
  .option("--use-existing", "Use existing git repository")
  .action(async (options) => {
    let name = options.name;
    let gitRepoPath = options.path;
    const useExistingRepo = options.useExisting ?? true;

    if (!name) {
      name = await Input.prompt("Project name:");
    }

    if (!gitRepoPath) {
      gitRepoPath = await Input.prompt("Git repository path:");
    }

    const createProject: CreateProject = {
      name,
      git_repo_path: gitRepoPath,
      use_existing_repo: useExistingRepo,
    };

    const client = await ApiClient.create();
    const project = await client.createProject(createProject);

    console.log(`Project created successfully!`);
    console.log(`ID: ${project.id}`);
  });

// Delete project
projectCommand
  .command("delete")
  .description("Delete a project")
  .arguments("<id:string>")
  .option("--force", "Skip confirmation")
  .action(async (options, id) => {
    if (!options.force) {
      const confirmed = await Confirm.prompt(
        `Are you sure you want to delete project ${id}?`,
      );
      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }
    }

    const client = await ApiClient.create();
    await client.deleteProject(id);
    console.log(`Project ${id} deleted.`);
  });
