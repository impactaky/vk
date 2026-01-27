import { getApiUrl } from "./config.ts";
import type {
  ApiResponse,
  AttachPRRequest,
  BranchStatus,
  CreateProject,
  CreatePRRequest,
  CreateTask,
  CreateWorkspace,
  FollowUpRequest,
  GitBranch,
  InitRepoRequest,
  MergeResult,
  MergeWorkspaceRequest,
  Project,
  PRResult,
  PushWorkspaceRequest,
  RebaseWorkspaceRequest,
  RegisterRepoRequest,
  RenameBranchRequest,
  Repo,
  Task,
  TaskWithAttemptStatus,
  UnifiedPRComment,
  UpdateProject,
  UpdateRepo,
  UpdateTask,
  UpdateWorkspace,
  Workspace,
  WorkspaceRepo,
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
      throw new Error(result.error || result.message || "Unknown API error");
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

  // Project repository management
  // Note: API returns Repo[] (full repository objects), not ProjectRepo[]
  listProjectRepos(projectId: string): Promise<Repo[]> {
    return this.request<Repo[]>(`/projects/${projectId}/repositories`);
  }

  addProjectRepo(
    projectId: string,
    displayName: string,
    gitRepoPath: string,
  ): Promise<Repo> {
    return this.request<Repo>(`/projects/${projectId}/repositories`, {
      method: "POST",
      body: JSON.stringify({
        display_name: displayName,
        git_repo_path: gitRepoPath,
      }),
    });
  }

  removeProjectRepo(projectId: string, repoId: string): Promise<void> {
    return this.request<void>(
      `/projects/${projectId}/repositories/${repoId}`,
      {
        method: "DELETE",
      },
    );
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

  // Workspace endpoints (formerly attempt, endpoint still uses /task-attempts)
  listWorkspaces(taskId: string): Promise<Workspace[]> {
    return this.request<Workspace[]>(`/task-attempts?task_id=${taskId}`);
  }

  getWorkspace(id: string): Promise<Workspace> {
    return this.request<Workspace>(`/task-attempts/${id}`);
  }

  async searchWorkspacesByBranch(branchName: string): Promise<Workspace[]> {
    // The API doesn't support filtering by branch directly
    // Fetch all workspaces and filter client-side
    const allWorkspaces = await this.request<Workspace[]>(`/task-attempts`);
    return allWorkspaces.filter((workspace) => workspace.branch === branchName);
  }

  createWorkspace(workspace: CreateWorkspace): Promise<Workspace> {
    return this.request<Workspace>("/task-attempts", {
      method: "POST",
      body: JSON.stringify(workspace),
    });
  }

  updateWorkspace(id: string, update: UpdateWorkspace): Promise<Workspace> {
    return this.request<Workspace>(`/task-attempts/${id}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  deleteWorkspace(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}`, {
      method: "DELETE",
    });
  }

  getWorkspaceRepos(workspaceId: string): Promise<WorkspaceRepo[]> {
    return this.request<WorkspaceRepo[]>(
      `/task-attempts/${workspaceId}/repos`,
    );
  }

  renameBranch(id: string, request: RenameBranchRequest): Promise<Workspace> {
    return this.request<Workspace>(`/task-attempts/${id}/rename-branch`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  mergeWorkspace(id: string, request: MergeWorkspaceRequest): Promise<MergeResult> {
    return this.request<MergeResult>(`/task-attempts/${id}/merge`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  pushWorkspace(id: string, request: PushWorkspaceRequest): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/push`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  rebaseWorkspace(id: string, request: RebaseWorkspaceRequest): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/rebase`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  stopWorkspace(id: string): Promise<void> {
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

  // Force push workspace branch to remote
  forcePushWorkspace(id: string, request: PushWorkspaceRequest): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/push/force`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Abort git conflicts for a workspace
  abortConflicts(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/conflicts/abort`, {
      method: "POST",
    });
  }

  // Send follow-up message to a running workspace
  followUp(id: string, request: FollowUpRequest): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/follow-up`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Attach an existing PR to a workspace
  attachPR(id: string, request: AttachPRRequest): Promise<PRResult> {
    return this.request<PRResult>(`/task-attempts/${id}/pr/attach`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Get PR comments for a workspace
  getPRComments(id: string): Promise<UnifiedPRComment[]> {
    return this.request<UnifiedPRComment[]>(`/task-attempts/${id}/pr/comments`);
  }

  // Repository endpoints
  listRepos(): Promise<Repo[]> {
    return this.request<Repo[]>("/repos");
  }

  getRepo(id: string): Promise<Repo> {
    return this.request<Repo>(`/repos/${id}`);
  }

  updateRepo(id: string, update: UpdateRepo): Promise<Repo> {
    return this.request<Repo>(`/repos/${id}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  registerRepo(request: RegisterRepoRequest): Promise<Repo> {
    return this.request<Repo>("/repos", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  initRepo(request: InitRepoRequest): Promise<Repo> {
    return this.request<Repo>("/repos/init", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  getRepoBranches(id: string): Promise<GitBranch[]> {
    return this.request<GitBranch[]>(`/repos/${id}/branches`);
  }
}
