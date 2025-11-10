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
  copy_files?: boolean;
  use_existing_repo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  parent_task_attempt?: string;
  created_at: string;
  updated_at: string;
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

export interface TaskWithAttemptStatus extends Task {
  has_in_progress_attempt: boolean;
  has_merged_attempt: boolean;
  last_attempt_failed: boolean;
  executor?: string;
}

export interface TaskAttempt {
  id: string;
  task_id: string;
  executor: string;
  base_branch: string;
  branch: string;
  container_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProject {
  name: string;
  git_repo_path: string;
  setup_script?: string;
  dev_script?: string;
  cleanup_script?: string;
  copy_files?: boolean;
  use_existing_repo: boolean;
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

export interface CreateTaskAttempt {
  task_id: string;
  executor_profile_id: ExecutorProfileId;
  base_branch: string;
}

export interface ExecutorProfileId {
  executor: string;
  variant?: string;
}

export interface DeviceFlowStartResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export enum DevicePollStatus {
  SLOW_DOWN = "SLOW_DOWN",
  AUTHORIZATION_PENDING = "AUTHORIZATION_PENDING",
  SUCCESS = "SUCCESS",
}

export enum CheckTokenResponse {
  VALID = "VALID",
  INVALID = "INVALID",
}

export interface CreateGitHubPrRequest {
  title: string;
  body?: string;
  target_branch?: string;
}

export interface PullRequestInfo {
  url: string;
  number: number;
}

export interface RebaseRequest {
  old_base_branch?: string;
  new_base_branch?: string;
}

export interface ChangeTargetBranchRequest {
  target_branch: string;
}

export interface ChangeTargetBranchResponse {
  message: string;
  updated_children_count?: number;
}

export interface RenameBranchRequest {
  new_branch_name: string;
}

export interface RenameBranchResponse {
  message: string;
  updated_children_count: number;
}

export interface BranchStatus {
  has_uncommitted_changes: boolean;
  head_oid?: string;
  ahead_count?: number;
  behind_count?: number;
  has_conflicts: boolean;
  conflict_op?: string;
  target_branch_exists: boolean;
  target_branch_type?: string;
}

export enum ConflictOp {
  MERGE = "MERGE",
  REBASE = "REBASE",
}

export interface GitOperationError {
  type: "merge_conflicts" | "rebase_in_progress";
  message: string;
  op?: ConflictOp;
}
