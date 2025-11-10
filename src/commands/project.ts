import { ApiClient } from "../utils/api-client.ts";
import { printError, printJson, printSuccess, printTable } from "../utils/output.ts";
import type { CreateProject, Project } from "../types/api.ts";

export async function projectList(options: { json?: boolean }): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.get<Project[]>("/projects");

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch projects");
    }

    if (options.json) {
      printJson(response.data);
      return;
    }

    if (response.data.length === 0) {
      printSuccess("No projects found");
      return;
    }

    const headers = ["ID", "Name", "Git Repo Path"];
    const rows = response.data.map((p) => [
      p.id,
      p.name,
      p.git_repo_path,
    ]);

    printTable(headers, rows);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to list projects",
    );
    Deno.exit(1);
  }
}

export async function projectView(
  projectId: string,
  options: { json?: boolean },
): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.get<Project>(`/projects/${projectId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch project");
    }

    if (options.json) {
      printJson(response.data);
      return;
    }

    const project = response.data;
    printSuccess(`Project: ${project.name}`);
    printSuccess(`ID: ${project.id}`);
    printSuccess(`Git Repo Path: ${project.git_repo_path}`);
    if (project.setup_script) {
      printSuccess(`Setup Script: ${project.setup_script}`);
    }
    if (project.dev_script) {
      printSuccess(`Dev Script: ${project.dev_script}`);
    }
    if (project.cleanup_script) {
      printSuccess(`Cleanup Script: ${project.cleanup_script}`);
    }
    printSuccess(`Created: ${project.created_at}`);
    printSuccess(`Updated: ${project.updated_at}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to view project",
    );
    Deno.exit(1);
  }
}

export async function projectCreate(options: {
  name: string;
  path: string;
  setupScript?: string;
  devScript?: string;
  cleanupScript?: string;
  useExisting?: boolean;
}): Promise<void> {
  try {
    const client = await ApiClient.create();

    const createData: CreateProject = {
      name: options.name,
      git_repo_path: options.path,
      setup_script: options.setupScript,
      dev_script: options.devScript,
      cleanup_script: options.cleanupScript,
      use_existing_repo: options.useExisting || false,
    };

    const response = await client.post<Project>("/projects", createData);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create project");
    }

    printSuccess(`Created project: ${response.data.name} (ID: ${response.data.id})`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to create project",
    );
    Deno.exit(1);
  }
}

export async function projectDelete(
  projectId: string,
  options: { force?: boolean },
): Promise<void> {
  try {
    if (!options.force) {
      const confirmation = prompt("Are you sure you want to delete this project? (y/N)");
      if (confirmation?.toLowerCase() !== "y") {
        printSuccess("Cancelled");
        return;
      }
    }

    const client = await ApiClient.create();
    const response = await client.delete(`/projects/${projectId}`);

    if (!response.success) {
      throw new Error(response.error || "Failed to delete project");
    }

    printSuccess(`Deleted project ${projectId}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to delete project",
    );
    Deno.exit(1);
  }
}
