/**
 * API client for the vibe-kanban CLI.
 *
 * Provides methods for communicating with the vibe-kanban API server,
 * handling all HTTP requests, responses, and error handling.
 *
 * @module
 */

import { getApiUrl } from "./config.ts";
import { isVerbose, verboseLog } from "../utils/verbose.ts";
import type {
  ApiResponse,
  AttachPRRequest,
  CreateAndStartWorkspaceRequest,
  CreateAndStartWorkspaceResponse,
  CreatePRRequest,
  FollowUpRequest,
  GitBranch,
  InitRepoRequest,
  MergeResult,
  MergeWorkspaceRequest,
  Organization,
  PRAttachResult,
  PRCommentsResponse,
  PRResult,
  PushWorkspaceRequest,
  RebaseWorkspaceRequest,
  RegisterRepoRequest,
  RenameBranchRequest,
  Repo,
  RepoBranchStatus,
  Session,
  UnifiedPRComment,
  UpdateRepo,
  UpdateWorkspace,
  Workspace,
  WorkspaceRepo,
} from "./types.ts";

/** API client for communicating with the vibe-kanban server. */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /** Create an ApiClient using the configured API URL from config file or environment. */
  static async create(): Promise<ApiClient> {
    const apiUrl = await getApiUrl();
    return new ApiClient(apiUrl);
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/api${path}`;
    const method = options.method || "GET";

    // Verbose: Log request details
    if (isVerbose()) {
      verboseLog(`--- API Request ---`);
      verboseLog(`${method} ${url}`);
      if (options.body) {
        verboseLog(`Request Body: ${options.body}`);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Clone response to read body for verbose logging
    const responseText = await response.clone().text();

    // Verbose: Log response details
    if (isVerbose()) {
      verboseLog(`--- API Response ---`);
      verboseLog(`Status: ${response.status} ${response.statusText}`);
      verboseLog(`Response Body: ${responseText}`);
      verboseLog(`-------------------`);
    }

    if (!response.ok) {
      throw new Error(`API error (${response.status}): ${responseText}`);
    }

    const result: ApiResponse<T> = JSON.parse(responseText);
    if (!result.success) {
      throw new Error(result.error || result.message || "Unknown API error");
    }

    return result.data as T;
  }

  /** List all organizations. Calls GET /api/organizations. */
  listOrganizations(): Promise<Organization[]> {
    return (async () => {
      const response = await this.request<
        Organization[] | { organizations: Organization[] }
      >("/organizations");
      if (Array.isArray(response)) {
        return response;
      }
      if (
        response &&
        "organizations" in response &&
        Array.isArray(response.organizations)
      ) {
        return response.organizations;
      }
      return [];
    })();
  }

  /** Get a single organization by ID. Calls GET /api/organizations/:id. */
  getOrganization(id: string): Promise<Organization> {
    return (async () => {
      const response = await this.request<
        Organization | { organization: Organization }
      >(`/organizations/${id}`);
      if (response && "organization" in response) {
        return response.organization;
      }
      return response;
    })();
  }

  /** List workspaces (attempts). Calls GET /api/task-attempts with optional task_id filter. */
  listWorkspaces(taskId?: string): Promise<Workspace[]> {
    const query = taskId ? `?task_id=${taskId}` : "";
    return this.request<Workspace[]>(`/task-attempts${query}`);
  }

  /** Backward-compatible alias for task-attempt naming. */
  listTaskAttempts(taskId?: string): Promise<Workspace[]> {
    return this.listWorkspaces(taskId);
  }

  /** Get a single workspace by ID. Calls GET /api/task-attempts/:id. */
  getWorkspace(id: string): Promise<Workspace> {
    return this.request<Workspace>(`/task-attempts/${id}`);
  }

  /** Backward-compatible alias for task-attempt naming. */
  getTaskAttempt(id: string): Promise<Workspace> {
    return this.getWorkspace(id);
  }

  /**
   * Search for workspaces by branch name.
   * Fetches all workspaces and filters client-side (API doesn't support branch filtering).
   */
  async searchWorkspacesByBranch(branchName: string): Promise<Workspace[]> {
    const allWorkspaces = await this.request<Workspace[]>(`/task-attempts`);
    return allWorkspaces.filter((workspace) => workspace.branch === branchName);
  }

  /** Create and start a new workspace for a prompt. Calls POST /api/task-attempts/create-and-start. */
  createWorkspace(
    workspace: CreateAndStartWorkspaceRequest,
  ): Promise<CreateAndStartWorkspaceResponse> {
    return this.request<CreateAndStartWorkspaceResponse>(
      "/task-attempts/create-and-start",
      {
        method: "POST",
        body: JSON.stringify(workspace),
      },
    );
  }

  /** Update workspace properties. Calls PUT /api/task-attempts/:id. */
  updateWorkspace(id: string, update: UpdateWorkspace): Promise<Workspace> {
    return this.request<Workspace>(`/task-attempts/${id}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  /** Delete a workspace. Calls DELETE /api/task-attempts/:id. */
  deleteWorkspace(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}`, {
      method: "DELETE",
    });
  }

  /** Get all repositories attached to a workspace. Calls GET /api/task-attempts/:id/repos. */
  getWorkspaceRepos(workspaceId: string): Promise<WorkspaceRepo[]> {
    return this.request<WorkspaceRepo[]>(
      `/task-attempts/${workspaceId}/repos`,
    );
  }

  /** Rename a workspace's git branch. Calls POST /api/task-attempts/:id/rename-branch. */
  renameBranch(id: string, request: RenameBranchRequest): Promise<Workspace> {
    return this.request<Workspace>(`/task-attempts/${id}/rename-branch`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Merge workspace branch with its target branch. Calls POST /api/task-attempts/:id/merge. */
  mergeWorkspace(
    id: string,
    request: MergeWorkspaceRequest,
  ): Promise<MergeResult> {
    return this.request<MergeResult>(`/task-attempts/${id}/merge`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Push workspace branch to remote. Calls POST /api/task-attempts/:id/push. */
  pushWorkspace(id: string, request: PushWorkspaceRequest): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/push`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Rebase workspace branch onto a new base. Calls POST /api/task-attempts/:id/rebase. */
  rebaseWorkspace(id: string, request: RebaseWorkspaceRequest): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/rebase`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Stop a running workspace session. Calls POST /api/task-attempts/:id/stop. */
  stopWorkspace(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/stop`, {
      method: "POST",
    });
  }

  /** Create a pull request from a workspace. Calls POST /api/task-attempts/:id/pr. */
  createPR(id: string, request: CreatePRRequest): Promise<PRResult> {
    return this.request<PRResult>(`/task-attempts/${id}/pr`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Get branch status for all repositories in a workspace. Calls GET /api/task-attempts/:id/branch-status. */
  getBranchStatus(id: string): Promise<RepoBranchStatus[]> {
    return this.request<RepoBranchStatus[]>(
      `/task-attempts/${id}/branch-status`,
    );
  }

  /** Force push workspace branch to remote. Calls POST /api/task-attempts/:id/push/force. */
  forcePushWorkspace(id: string, request: PushWorkspaceRequest): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/push/force`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Abort ongoing git conflicts in a workspace. Calls POST /api/task-attempts/:id/conflicts/abort. */
  abortConflicts(id: string): Promise<void> {
    return this.request<void>(`/task-attempts/${id}/conflicts/abort`, {
      method: "POST",
    });
  }

  /** Attach an existing pull request to a workspace. Calls POST /api/task-attempts/:id/pr/attach. */
  attachPR(id: string, request: AttachPRRequest): Promise<PRAttachResult> {
    return this.request<PRAttachResult>(`/task-attempts/${id}/pr/attach`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Get all comments on a workspace's pull request. Calls GET /api/task-attempts/:id/pr/comments. */
  async getPRComments(id: string, repoId: string): Promise<PRCommentsResponse> {
    const response = await this.request<
      PRCommentsResponse | UnifiedPRComment[]
    >(
      `/task-attempts/${id}/pr/comments?repo_id=${repoId}`,
    );
    return Array.isArray(response) ? { comments: response } : response;
  }

  /** List all sessions for a workspace. Calls GET /api/sessions?workspace_id=:id. */
  listSessions(workspaceId: string): Promise<Session[]> {
    return this.request<Session[]>(`/sessions?workspace_id=${workspaceId}`);
  }

  /** Get a single session by ID. Calls GET /api/sessions/:id. */
  getSession(id: string): Promise<Session> {
    return this.request<Session>(`/sessions/${id}`);
  }

  /** Send a follow-up message to a running session. Calls POST /api/sessions/:id/follow-up. */
  sessionFollowUp(sessionId: string, request: FollowUpRequest): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}/follow-up`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** List all registered repositories. Calls GET /api/repos. */
  listRepos(): Promise<Repo[]> {
    return this.request<Repo[]>("/repos");
  }

  /** Get a single repository by ID. Calls GET /api/repos/:id. */
  getRepo(id: string): Promise<Repo> {
    return this.request<Repo>(`/repos/${id}`);
  }

  /** Update repository configuration. Calls PUT /api/repos/:id. */
  updateRepo(id: string, update: UpdateRepo): Promise<Repo> {
    return this.request<Repo>(`/repos/${id}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  /** Register an existing git repository with vibe-kanban. Calls POST /api/repos. */
  registerRepo(request: RegisterRepoRequest): Promise<Repo> {
    return this.request<Repo>("/repos", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Initialize a new git repository. Calls POST /api/repos/init. */
  initRepo(request: InitRepoRequest): Promise<Repo> {
    return this.request<Repo>("/repos/init", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /** Get all branches for a repository. Calls GET /api/repos/:id/branches. */
  getRepoBranches(id: string): Promise<GitBranch[]> {
    return this.request<GitBranch[]>(`/repos/${id}/branches`);
  }
}
