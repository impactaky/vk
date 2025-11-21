// API Response types matching vibe-kanban API

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  git_repo_path: string;
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
  git_repo_path: string;
  description?: string;
  hex_color?: string;
  setup_script?: string;
  dev_script?: string;
  cleanup_script?: string;
  copy_files?: string[];
  use_existing_repo: boolean;
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

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

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

export interface CreateAttempt {
  task_id: string;
  executor_profile_id: string;
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
