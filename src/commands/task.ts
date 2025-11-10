import { ApiClient } from "../utils/api-client.ts";
import { printError, printJson, printSuccess, printTable } from "../utils/output.ts";
import type { CreateTask, Task, TaskWithAttemptStatus, UpdateTask } from "../types/api.ts";
import { TaskStatus } from "../types/api.ts";

export async function taskList(
  projectId: string,
  options: { json?: boolean },
): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.get<TaskWithAttemptStatus[]>(
      `/tasks?project_id=${projectId}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch tasks");
    }

    if (options.json) {
      printJson(response.data);
      return;
    }

    if (response.data.length === 0) {
      printSuccess("No tasks found");
      return;
    }

    const headers = ["ID", "Title", "Status", "In Progress"];
    const rows = response.data.map((t) => [
      t.id,
      t.title,
      t.status,
      t.has_in_progress_attempt ? "Yes" : "No",
    ]);

    printTable(headers, rows);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to list tasks",
    );
    Deno.exit(1);
  }
}

export async function taskView(
  taskId: string,
  options: { json?: boolean },
): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.get<Task>(`/tasks/${taskId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch task");
    }

    if (options.json) {
      printJson(response.data);
      return;
    }

    const task = response.data;
    printSuccess(`Task: ${task.title}`);
    printSuccess(`ID: ${task.id}`);
    printSuccess(`Project ID: ${task.project_id}`);
    printSuccess(`Status: ${task.status}`);
    if (task.description) {
      printSuccess(`Description: ${task.description}`);
    }
    printSuccess(`Created: ${task.created_at}`);
    printSuccess(`Updated: ${task.updated_at}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to view task",
    );
    Deno.exit(1);
  }
}

export async function taskCreate(options: {
  projectId: string;
  title: string;
  description?: string;
}): Promise<void> {
  try {
    const client = await ApiClient.create();

    const createData: CreateTask = {
      project_id: options.projectId,
      title: options.title,
      description: options.description,
    };

    const response = await client.post<Task>("/tasks", createData);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create task");
    }

    printSuccess(`Created task: ${response.data.title} (ID: ${response.data.id})`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to create task",
    );
    Deno.exit(1);
  }
}

export async function taskUpdate(
  taskId: string,
  options: {
    title?: string;
    description?: string;
    status?: string;
  },
): Promise<void> {
  try {
    const client = await ApiClient.create();

    const updateData: UpdateTask = {
      title: options.title,
      description: options.description,
      status: options.status ? TaskStatus[options.status as keyof typeof TaskStatus] : undefined,
    };

    const response = await client.put<Task>(`/tasks/${taskId}`, updateData);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update task");
    }

    printSuccess(`Updated task ${taskId}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to update task",
    );
    Deno.exit(1);
  }
}

export async function taskDelete(taskId: string, options: { force?: boolean }): Promise<void> {
  try {
    if (!options.force) {
      const confirmation = prompt("Are you sure you want to delete this task? (y/N)");
      if (confirmation?.toLowerCase() !== "y") {
        printSuccess("Cancelled");
        return;
      }
    }

    const client = await ApiClient.create();
    const response = await client.delete(`/tasks/${taskId}`);

    if (!response.success) {
      throw new Error(response.error || "Failed to delete task");
    }

    printSuccess(`Deleted task ${taskId}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to delete task",
    );
    Deno.exit(1);
  }
}
