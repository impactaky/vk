import { Command } from "@cliffy/command";
import { Confirm, Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { CreateProject, UpdateProject } from "../api/types.ts";
import { getProjectId } from "../utils/project-resolver.ts";
import { applyFilters } from "../utils/filter.ts";
import { handleCliError } from "../utils/error-handler.ts";

export const projectCommand = new Command()
  .description("Manage projects")
  .action(function () {
    this.showHelp();
  });

// List projects
projectCommand
  .command("list")
  .description("List all projects")
  .option("--name <name:string>", "Filter by project name")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const client = await ApiClient.create();
    let projects = await client.listProjects();

    // Build filter object from provided options
    const filters: Record<string, unknown> = {};
    if (options.name !== undefined) {
      filters.name = options.name;
    }

    // Apply filters
    projects = applyFilters(projects, filters);

    if (options.json) {
      console.log(JSON.stringify(projects, null, 2));
      return;
    }

    if (projects.length === 0) {
      console.log("No projects found.");
      return;
    }

    const table = new Table()
      .header(["ID", "Name", "Default Working Dir"])
      .body(projects.map((p) => [
        p.id,
        p.name,
        p.default_agent_working_dir || "-",
      ]));

    table.render();
  });

// Show project
projectCommand
  .command("show")
  .description("Show project details")
  .arguments("[id:string]")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(id, client);

      const project = await client.getProject(projectId);

      if (options.json) {
        console.log(JSON.stringify(project, null, 2));
        return;
      }

      console.log(`ID:                  ${project.id}`);
      console.log(`Name:                ${project.name}`);
      console.log(
        `Default Working Dir: ${project.default_agent_working_dir || "-"}`,
      );
      console.log(`Remote Project ID:   ${project.remote_project_id || "-"}`);
      console.log(`Created:             ${project.created_at}`);
      console.log(`Updated:             ${project.updated_at}`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Create project
projectCommand
  .command("create")
  .description("Create a new project")
  .option("--name <name:string>", "Project name")
  .option(
    "--repo <id:string>",
    "Repository ID to associate (can be specified multiple times)",
    { collect: true },
  )
  .action(async (options) => {
    let name = options.name;

    if (!name) {
      name = await Input.prompt("Project name:");
    }

    const repoIds: string[] = options.repo || [];

    const createProject: CreateProject = {
      name,
      repositories: repoIds.map((repoId, index) => ({
        repo_id: repoId,
        is_main: index === 0, // First repo is main by default
      })),
    };

    const client = await ApiClient.create();
    const project = await client.createProject(createProject);

    console.log(`Project created successfully!`);
    console.log(`ID: ${project.id}`);
  });

// Update project
projectCommand
  .command("update")
  .description("Update a project")
  .arguments("[id:string]")
  .option("--name <name:string>", "New project name")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(id, client);

      const update: UpdateProject = {};

      if (options.name) {
        update.name = options.name;
      }

      if (Object.keys(update).length === 0) {
        console.log("No updates specified.");
        return;
      }

      const project = await client.updateProject(projectId, update);
      console.log(`Project ${project.id} updated.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Delete project
projectCommand
  .command("delete")
  .description("Delete a project")
  .arguments("[id:string]")
  .option("--force", "Skip confirmation")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(id, client);

      if (!options.force) {
        const confirmed = await Confirm.prompt(
          `Are you sure you want to delete project ${projectId}?`,
        );
        if (!confirmed) {
          console.log("Cancelled.");
          return;
        }
      }

      await client.deleteProject(projectId);
      console.log(`Project ${projectId} deleted.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// List project repositories
projectCommand
  .command("repos")
  .description("List repositories associated with this project")
  .arguments("[id:string]")
  .option("--json", "Output as JSON")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(id, client);

      const repos = await client.listProjectRepos(projectId);

      if (options.json) {
        console.log(JSON.stringify(repos, null, 2));
        return;
      }

      if (repos.length === 0) {
        console.log("No repositories found.");
        return;
      }

      const table = new Table()
        .header(["ID", "Name", "Path"])
        .body(repos.map((r) => [
          r.id,
          r.name,
          r.path,
        ]));

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Add repository to project
projectCommand
  .command("add-repo")
  .description("Add a repository to this project")
  .arguments("[id:string]")
  .option("--repo <id:string>", "Repository ID to add", { required: true })
  .option("--main", "Set as main repository")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(id, client);

      const repo = await client.addProjectRepo(
        projectId,
        options.repo,
        options.main ?? false,
      );

      console.log(`Repository ${repo.id} added to project.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });

// Remove repository from project
projectCommand
  .command("remove-repo")
  .description("Remove a repository from this project")
  .arguments("[id:string]")
  .option("--repo <id:string>", "Repository ID to remove", { required: true })
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      const projectId = await getProjectId(id, client);

      await client.removeProjectRepo(projectId, options.repo);

      console.log(`Repository ${options.repo} removed from project.`);
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
