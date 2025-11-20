import { getApiUrl } from "./config.ts";
import type {
  ApiResponse,
  CreateProject,
  CreateTask,
  Project,
  Task,
  TaskWithAttemptStatus,
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
}
