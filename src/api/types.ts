// API Response types matching vibe-kanban API

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  repositories: Repo[];
  description?: string;
  hex_color?: string;
  is_archived?: boolean;
  setup_script?: string;
  dev_script?: string;
  cleanup_script?: string;
  copy_files?: string[];
  remote_project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProject {
  name: string;
  repositories: string[];
  description?: string;
  hex_color?: string;
}

export interface UpdateProject {
  name?: string;
  description?: string;
  hex_color?: string;
  is_archived?: boolean;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: number;
  due_date?: string;
  labels?: string[];
  percent_done?: number;
  hex_color?: string;
  is_favorite?: boolean;
  shared_task_id?: string;
  parent_task_attempt?: string;
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
  has_merged_attempt: boolean;
  last_attempt_failed: boolean;
  executor?: string;
}

export interface CreateTask {
  project_id: string;
  title: string;
  description?: string;
  priority?: number;
  due_date?: string;
  labels?: string[];
  hex_color?: string;
  is_favorite?: boolean;
  image_ids?: string[];
}

export interface UpdateTask {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
  due_date?: string;
  labels?: string[];
  percent_done?: number;
  hex_color?: string;
  is_favorite?: boolean;
  parent_task_attempt?: string;
  image_ids?: string[];
}

export interface TaskAttempt {
  id: string;
  task_id: string;
  container_ref?: string;
  branch: string;
  target_branch: string;
  executor: string;
  worktree_deleted: boolean;
  setup_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type TaskAttemptStatus =
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

export interface CreateAttempt {
  task_id: string;
  executor_profile_id: ExecutorProfileID;
  base_branch: string;
  target_branch?: string;
}

export interface ChangeTargetBranchRequest {
  target_branch: string;
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

// PR creation returns just the URL string
export type PRResult = string;

// Follow-up request for sending messages to running attempts
export interface FollowUpRequest {
  message: string;
}

// Attach existing PR to an attempt
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
