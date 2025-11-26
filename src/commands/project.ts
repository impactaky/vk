import { Command } from "@cliffy/command";
import { Confirm, Input } from "@cliffy/prompt";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import type { CreateProject, UpdateProject } from "../api/types.ts";
import {
  ProjectResolverError,
  resolveProjectFromGit,
} from "../utils/project-resolver.ts";
import { applyFilters } from "../utils/filter.ts";

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
  .option("--archived <archived:boolean>", "Filter by archived status")
  .option("--color <color:string>", "Filter by hex color")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const client = await ApiClient.create();
    let projects = await client.listProjects();

    // Build filter object from provided options
    const filters: Record<string, unknown> = {};
    if (options.name !== undefined) {
      filters.name = options.name;
    }
    if (options.archived !== undefined) {
      filters.is_archived = options.archived;
    }
    if (options.color !== undefined) {
      filters.hex_color = options.color;
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
      .header(["ID", "Name", "Git Repo Path", "Archived"])
      .body(projects.map((p) => [
        p.id,
        p.name,
        p.git_repo_path,
        p.is_archived ? "Yes" : "No",
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
      let projectId = id;

      if (!projectId) {
        const resolved = await resolveProjectFromGit(client);
        projectId = resolved.id;
      }

      const project = await client.getProject(projectId);

      if (options.json) {
        console.log(JSON.stringify(project, null, 2));
        return;
      }

      console.log(`ID:            ${project.id}`);
      console.log(`Name:          ${project.name}`);
      console.log(`Git Repo Path: ${project.git_repo_path}`);
      if (project.description) {
        console.log(`Description:   ${project.description}`);
      }
      if (project.hex_color) {
        console.log(`Color:         ${project.hex_color}`);
      }
      if (project.is_archived) {
        console.log(`Archived:      Yes`);
      }
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
    } catch (error) {
      if (error instanceof ProjectResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });

// Create project
projectCommand
  .command("create")
  .description("Create a new project")
  .option("--name <name:string>", "Project name")
  .option("--path <path:string>", "Git repository path")
  .option("--use-existing", "Use existing git repository")
  .option("--description <desc:string>", "Project description")
  .option("--color <color:string>", "Hex color (e.g., #3498db)")
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
      description: options.description,
      hex_color: options.color,
      use_existing_repo: useExistingRepo,
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
  .option("--description <desc:string>", "New description")
  .option("--color <color:string>", "Hex color (e.g., #3498db)")
  .option("--archived", "Archive the project")
  .option("--no-archived", "Unarchive the project")
  .action(async (options, id?: string) => {
    try {
      const client = await ApiClient.create();
      let projectId = id;

      if (!projectId) {
        const resolved = await resolveProjectFromGit(client);
        projectId = resolved.id;
      }

      const update: UpdateProject = {};

      if (options.name) {
        update.name = options.name;
      }
      if (options.description !== undefined) {
        update.description = options.description;
      }
      if (options.color !== undefined) {
        update.hex_color = options.color;
      }
      if (options.archived !== undefined) {
        update.is_archived = options.archived;
      }

      if (Object.keys(update).length === 0) {
        console.log("No updates specified.");
        return;
      }

      const project = await client.updateProject(projectId, update);
      console.log(`Project ${project.id} updated.`);
    } catch (error) {
      if (error instanceof ProjectResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
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
      let projectId = id;

      if (!projectId) {
        const resolved = await resolveProjectFromGit(client);
        projectId = resolved.id;
      }

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
      if (error instanceof ProjectResolverError) {
        console.error(`Error: ${error.message}`);
        Deno.exit(1);
      }
      throw error;
    }
  });
