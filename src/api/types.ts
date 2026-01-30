// API Response types matching vibe-kanban API

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Project types - updated to match latest API
export interface Project {
  id: string;
  name: string;
  default_agent_working_dir: string | null;
  remote_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRepo {
  display_name: string;
  git_repo_path: string;
}

export interface CreateProject {
  name: string;
  repositories: CreateProjectRepo[];
}

export interface UpdateProject {
  name?: string | null;
}

// Project-Repository relationship
export interface ProjectRepo {
  project_id: string;
  repo_id: string;
  is_main: boolean;
  created_at: string;
}

// Task types - updated to match latest API
export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  parent_workspace_id: string | null;
  shared_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus =
  | "todo"
  | "inprogress"
  | "inreview"
  | "done"
  | "cancelled";

export interface TaskWithAttemptStatus extends Task {
  has_in_progress_attempt: boolean;
  last_attempt_failed: boolean;
  executor: string;
}

export interface CreateTask {
  project_id: string;
  title: string;
  description?: string;
  image_ids?: string[] | null;
}

export interface UpdateTask {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  parent_workspace_id?: string | null;
  image_ids?: string[] | null;
}

// Workspace types (formerly TaskAttempt) - updated to match latest API
export interface Workspace {
  id: string;
  task_id: string;
  container_ref: string | null;
  branch: string;
  agent_working_dir: string | null;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  pinned: boolean;
  name: string | null;
}

export interface UpdateWorkspace {
  name?: string | null;
  archived?: boolean;
  pinned?: boolean;
}

// Workspace-Repository relationship
export interface WorkspaceRepo {
  workspace_id: string;
  repo_id: string;
  worktree_path: string | null;
  branch: string;
  created_at: string;
}

export type WorkspaceStatus =
  | "SetupRunning"
  | "SetupComplete"
  | "SetupFailed"
  | "ExecutorRunning"
  | "ExecutorComplete"
  | "ExecutorFailed";

// All supported coding agents in vibe-kanban
export type BaseCodingAgent =
  | "CLAUDE_CODE"
  | "AMP"
  | "GEMINI"
  | "CODEX"
  | "OPENCODE"
  | "CURSOR_AGENT"
  | "QWEN_CODE"
  | "COPILOT"
  | "DROID";

export const VALID_EXECUTORS: BaseCodingAgent[] = [
  "CLAUDE_CODE",
  "AMP",
  "GEMINI",
  "CODEX",
  "OPENCODE",
  "CURSOR_AGENT",
  "QWEN_CODE",
  "COPILOT",
  "DROID",
];

export interface ExecutorProfileID {
  executor: BaseCodingAgent;
  variant: string | null;
}

export interface CreateWorkspace {
  task_id: string;
  executor_profile_id: ExecutorProfileID;
  base_branch: string;
}

export interface RenameBranchRequest {
  new_branch_name: string;
}

export interface CreatePRRequest {
  title?: string;
  body?: string;
}

export interface BranchStatus {
  ahead: number;
  behind: number;
  has_conflicts: boolean;
}

export interface MergeResult {
  success: boolean;
  message?: string;
}

// Git operation request types (require repo_id for multi-repo workspaces)
export interface MergeWorkspaceRequest {
  repo_id: string;
}

export interface PushWorkspaceRequest {
  repo_id: string;
}

export interface RebaseWorkspaceRequest {
  repo_id: string;
  old_base_branch?: string;
  new_base_branch?: string;
}

// PR creation returns just the URL string
export type PRResult = string;

// Session types
export interface Session {
  id: string;
  workspace_id: string;
  executor_profile_id: ExecutorProfileID;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export type SessionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

// Execution process returned from follow-up
export interface ExecutionProcess {
  id: string;
  session_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Follow-up request for sending messages to running sessions
export interface CreateFollowUpAttempt {
  prompt: string;
}

// Attach existing PR to a workspace
export interface AttachPRRequest {
  pr_number: number;
}

// PR comment types
export interface PRComment {
  id: number;
  body: string;
  user: string;
  created_at: string;
  updated_at: string;
  path?: string;
  line?: number;
  side?: string;
}

export interface UnifiedPRComment {
  id: number;
  body: string;
  user: string;
  created_at: string;
  updated_at: string;
  comment_type: "issue" | "review" | "review_thread";
  path?: string;
  line?: number;
  side?: string;
  in_reply_to_id?: number;
}

// Repository types
export interface Repo {
  id: string;
  path: string;
  name: string;
  display_name: string;
  setup_script: string | null;
  cleanup_script: string | null;
  copy_files: string | null;
  parallel_setup_script: boolean;
  dev_server_script: string | null;
  default_target_branch: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateRepo {
  display_name?: string | null;
  setup_script?: string | null;
  cleanup_script?: string | null;
  copy_files?: string | null;
  parallel_setup_script?: boolean | null;
  dev_server_script?: string | null;
}

export interface RegisterRepoRequest {
  path: string;
  display_name: string | null;
}

export interface InitRepoRequest {
  parent_path: string;
  folder_name: string;
}

export interface GitBranch {
  name: string;
  is_current: boolean;
  is_remote: boolean;
}
