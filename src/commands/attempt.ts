import { ApiClient } from "../utils/api-client.ts";
import { printError, printJson, printSuccess, printTable } from "../utils/output.ts";
import type { CreateTaskAttempt, TaskAttempt } from "../types/api.ts";

export async function attemptList(
  taskId: string,
  options: { json?: boolean },
): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.get<TaskAttempt[]>(
      `/task-attempts?task_id=${taskId}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch task attempts");
    }

    if (options.json) {
      printJson(response.data);
      return;
    }

    if (response.data.length === 0) {
      printSuccess("No task attempts found");
      return;
    }

    const headers = ["ID", "Executor", "Base Branch", "Branch"];
    const rows = response.data.map((a) => [
      a.id,
      a.executor,
      a.base_branch,
      a.branch,
    ]);

    printTable(headers, rows);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to list task attempts",
    );
    Deno.exit(1);
  }
}

export async function attemptView(
  attemptId: string,
  options: { json?: boolean },
): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.get<TaskAttempt>(`/task-attempts/${attemptId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch task attempt");
    }

    if (options.json) {
      printJson(response.data);
      return;
    }

    const attempt = response.data;
    printSuccess(`Task Attempt ID: ${attempt.id}`);
    printSuccess(`Task ID: ${attempt.task_id}`);
    printSuccess(`Executor: ${attempt.executor}`);
    printSuccess(`Base Branch: ${attempt.base_branch}`);
    printSuccess(`Branch: ${attempt.branch}`);
    if (attempt.container_ref) {
      printSuccess(`Container Ref: ${attempt.container_ref}`);
    }
    printSuccess(`Created: ${attempt.created_at}`);
    printSuccess(`Updated: ${attempt.updated_at}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to view task attempt",
    );
    Deno.exit(1);
  }
}

export async function attemptCreate(options: {
  taskId: string;
  executor: string;
  baseBranch: string;
  variant?: string;
}): Promise<void> {
  try {
    const client = await ApiClient.create();

    const createData: CreateTaskAttempt = {
      task_id: options.taskId,
      executor_profile_id: {
        executor: options.executor,
        variant: options.variant,
      },
      base_branch: options.baseBranch,
    };

    const response = await client.post<TaskAttempt>("/task-attempts", createData);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create task attempt");
    }

    printSuccess(`Created task attempt (ID: ${response.data.id})`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to create task attempt",
    );
    Deno.exit(1);
  }
}

export async function attemptFollowUp(
  attemptId: string,
  options: { prompt: string },
): Promise<void> {
  try {
    const client = await ApiClient.create();

    const response = await client.post(
      `/task-attempts/${attemptId}/follow-up`,
      { prompt: options.prompt },
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to send follow-up");
    }

    printSuccess("Follow-up sent successfully");
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to send follow-up",
    );
    Deno.exit(1);
  }
}
