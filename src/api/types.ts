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
  setup_script?: string;
  dev_script?: string;
  cleanup_script?: string;
  copy_files?: string[];
  use_existing_repo: boolean;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
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
  image_ids?: string[];
}

export interface UpdateTask {
  title?: string;
  description?: string;
  status?: TaskStatus;
  parent_task_attempt?: string;
  image_ids?: string[];
}
