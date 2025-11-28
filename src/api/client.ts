import { getApiUrl } from "./config.ts";
import type {
  ApiResponse,
  BranchStatus,
  ChangeTargetBranchRequest,
  CreateAttempt,
  CreateProject,
  CreatePRRequest,
  CreateTask,
  ExecutorProfile,
  MergeResult,
  Project,
  PRResult,
  RenameBranchRequest,
  Task,
  TaskAttempt,
  TaskWithAttemptStatus,
  UpdateProject,
  UpdateTask,
} from "./types.ts";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  static async create(): Promise<ApiClient> {
    const apiUrl = await getApiUrl();
    return new ApiClient(apiUrl);
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/api${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error (${response.status}): ${text}`);
    }

    const result: ApiResponse<T> = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Unknown API error");
    }

    return result.data as T;
  }

  // Project endpoints
  listProjects(): Promise<Project[]> {
    return this.request<Project[]>("/projects");
  }

  getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  createProject(project: CreateProject): Promise<Project> {
    return this.request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(project),
    });
  }

  updateProject(id: string, update: UpdateProject): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  // Task endpoints
  listTasks(projectId: string): Promise<TaskWithAttemptStatus[]> {
    return this.request<TaskWithAttemptStatus[]>(
      `/tasks?project_id=${projectId}`,
    );
  }

  getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  createTask(task: CreateTask): Promise<Task> {
    return this.request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  }

  updateTask(id: string, update: UpdateTask): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: "DELETE",
    });
  }

  // Attempt endpoints
  listAttempts(taskId: string): Promise<TaskAttempt[]> {
    return this.request<TaskAttempt[]>(`/task-attempts?task_id=${taskId}`);
  }

  getAttempt(id: string): Promise<TaskAttempt> {
    return this.request<TaskAttempt>(`/task-attempts/${id}`);
  }

  createAttempt(attempt: CreateAttempt): Promise<TaskAttempt> {
    return this.request<TaskAttempt>("/task-attempts", {
      method: "POST",
      body: JSON.stringify(attempt),
    });
  }

  deleteAttempt(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}`, {
      method: "DELETE",
    });
  }

  changeTargetBranch(
    id: string,
    request: ChangeTargetBranchRequest,
  ): Promise<TaskAttempt> {
    return this.request<TaskAttempt>(
      `/task-attempts/${id}/change-target-branch`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  renameBranch(id: string, request: RenameBranchRequest): Promise<TaskAttempt> {
    return this.request<TaskAttempt>(`/task-attempts/${id}/rename-branch`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  mergeAttempt(id: string): Promise<MergeResult> {
    return this.request<MergeResult>(`/task-attempts/${id}/merge`, {
      method: "POST",
    });
  }

  pushAttempt(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/push`, {
      method: "POST",
    });
  }

  rebaseAttempt(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/rebase`, {
      method: "POST",
    });
  }

  stopAttempt(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/stop`, {
      method: "POST",
    });
  }

  createPR(id: string, request?: CreatePRRequest): Promise<PRResult> {
    return this.request<PRResult>(`/task-attempts/${id}/pr`, {
      method: "POST",
      body: JSON.stringify(request || {}),
    });
  }

  getBranchStatus(id: string): Promise<BranchStatus> {
    return this.request<BranchStatus>(`/task-attempts/${id}/branch-status`);
  }

  // Executor Profile endpoints
  listExecutorProfiles(): Promise<ExecutorProfile[]> {
    return this.request<ExecutorProfile[]>("/executor-profiles");
  }
}
