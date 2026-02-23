/**
 * API types for the vibe-kanban CLI.
 *
 * Contains all request/response types used to communicate with the
 * vibe-kanban API server.
 *
 * @module
 */

/** Standard API response wrapper for all endpoints. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** A project represents a collection of tasks and repositories. */
export interface Project {
  id: string;
  name: string;
  default_agent_working_dir: string | null;
  remote_project_id: string | null;
  created_at: string;
  updated_at: string;
}

/** An organization represents a tenant/grouping unit in the system. */
export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/** Repository configuration for creating projects with attached repositories. */
export interface CreateProjectRepo {
  display_name: string;
  git_repo_path: string;
}

/** Request body for creating a new project. */
export interface CreateProject {
  name: string;
  repositories: CreateProjectRepo[];
}

/** Request body for updating project properties. */
export interface UpdateProject {
  name?: string | null;
}

/** Join table linking projects to their repositories. */
export interface ProjectRepo {
  project_id: string;
  repo_id: string;
  is_main: boolean;
  created_at: string;
}

/** A task represents a unit of work within a project. */
export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  parent_workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Status of a task in its lifecycle. */
export type TaskStatus =
  | "todo"
  | "inprogress"
  | "inreview"
  | "done"
  | "cancelled";

/** Task with additional workspace/attempt status information. */
export interface TaskWithAttemptStatus extends Task {
  has_in_progress_attempt: boolean;
  last_attempt_failed: boolean;
  executor: string;
}

/** Request body for creating a new task. */
export interface CreateTask {
  project_id: string;
  title: string;
  description?: string;
  parent_workspace_id?: string | null;
  image_ids?: string[] | null;
}

/** Request body for updating task properties. */
export interface UpdateTask {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  parent_workspace_id?: string | null;
  image_ids?: string[] | null;
}

/**
 * Workspace (formerly TaskAttempt) represents an isolated development environment
 * for working on a task, with its own git branch and optional container.
 */
export interface Workspace {
  id: string;
  task_id: string;
  /** Docker container reference for the workspace environment. */
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

/** Request body for updating workspace properties. */
export interface UpdateWorkspace {
  name?: string | null;
  archived?: boolean;
  pinned?: boolean;
}

/** Join table linking workspaces to their repositories. */
export interface WorkspaceRepo {
  id: string;
  workspace_id: string;
  repo_id: string;
  target_branch: string;
  created_at: string;
  updated_at: string;
}

/** Status of a workspace's setup and execution lifecycle. */
export type WorkspaceStatus =
  | "SetupRunning"
  | "SetupComplete"
  | "SetupFailed"
  | "ExecutorRunning"
  | "ExecutorComplete"
  | "ExecutorFailed";

/** Session represents an active coding agent session within a workspace. */
export interface Session {
  id: string;
  workspace_id: string;
  executor: string | null;
  created_at: string;
  updated_at: string;
}

/** Status of an execution process within a session. */
export type ExecutionProcessStatus =
  | "running"
  | "completed"
  | "failed"
  | "killed";

/** Reason why an execution process was started. */
export type ExecutionProcessRunReason =
  | "setupscript"
  | "cleanupscript"
  | "codingagent"
  | "devserver";

/** Execution process represents a running script or coding agent within a session. */
export interface ExecutionProcess {
  id: string;
  session_id: string;
  run_reason: ExecutionProcessRunReason;
  status: ExecutionProcessStatus;
  exit_code: number | null;
  /** Whether this process was intentionally terminated/dropped by the user. */
  dropped: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** All supported coding agents in the vibe-kanban system. */
export type BaseCodingAgent =
  | "CLAUDE_CODE"
  | "AMP"
  | "GEMINI"
  | "CODEX"
  | "OPENCODE"
  | "CURSOR"
  | "QWEN_CODE"
  | "COPILOT"
  | "DROID";

/** Array of all valid executor names for validation purposes. */
export const VALID_EXECUTORS: BaseCodingAgent[] = [
  "CLAUDE_CODE",
  "AMP",
  "GEMINI",
  "CODEX",
  "OPENCODE",
  "CURSOR",
  "QWEN_CODE",
  "COPILOT",
  "DROID",
];

/** Identifies a specific coding agent executor and its variant. */
export interface ExecutorProfileID {
  executor: BaseCodingAgent;
  variant: string | null;
}

/** Input for attaching a repository to a workspace during creation. */
export interface WorkspaceRepoInput {
  repo_id: string;
  target_branch: string;
}

/** Request body for creating a new workspace. */
export interface CreateWorkspace {
  task_id: string;
  repos: WorkspaceRepoInput[];
}

/** Request body for renaming a workspace's git branch. */
export interface RenameBranchRequest {
  new_branch_name: string;
}

/** Request body for creating a pull request from a workspace. */
export interface CreatePRRequest {
  title?: string;
  body?: string;
}

/** Type of git operation that resulted in conflicts. */
export type ConflictOp = "rebase" | "merge" | "cherry_pick" | "revert";

/** Information about a merge commit in the git history. */
export interface Merge {
  oid: string;
  message: string;
}

/** Branch status for a single repository within a workspace. */
export interface RepoBranchStatus {
  repo_id: string;
  repo_name: string;
  commits_behind: number;
  commits_ahead: number;
  has_uncommitted_changes: boolean;
  head_oid: string;
  uncommitted_count: number;
  untracked_count: number;
  target_branch_name: string;
  remote_commits_behind: number;
  remote_commits_ahead: number;
  merges: Merge[];
  is_rebase_in_progress: boolean;
  /** The git operation that created conflicts, if any. */
  conflict_op: ConflictOp | null;
  conflicted_files: string[];
  is_target_remote: boolean;
}

/** Request body for merging a workspace branch with its target. */
export interface MergeWorkspaceRequest {
  commit_message?: string | null;
  use_pr?: boolean;
}

/** Request body for sending a follow-up message to a running session. */
export interface FollowUpRequest {
  prompt: string;
  executor_profile_id: ExecutorProfileID;
}

/** Pull request creation returns the URL of the created PR. */
export type PRResult = string;

/** Request body for attaching an existing pull request to a workspace. */
export interface AttachPRRequest {
  pr_url: string;
}

/** A comment on a pull request. */
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

/** Unified PR comment merging issue comments, review comments, and threads. */
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

/** A git repository registered with vibe-kanban. */
export interface Repo {
  id: string;
  path: string;
  name: string;
  display_name: string;
  setup_script: string | null;
  cleanup_script: string | null;
  archive_script: string | null;
  dev_server_script: string | null;
  default_target_branch: string | null;
  default_working_dir: string | null;
  created_at: string;
  updated_at: string;
}

/** Request body for updating repository configuration. */
export interface UpdateRepo {
  display_name?: string | null;
  setup_script?: string | null;
  cleanup_script?: string | null;
  archive_script?: string | null;
  dev_server_script?: string | null;
  default_target_branch?: string | null;
  default_working_dir?: string | null;
}

/** Request body for registering an existing git repository. */
export interface RegisterRepoRequest {
  path: string;
  display_name: string | null;
}

/** Request body for initializing a new git repository. */
export interface InitRepoRequest {
  repo_path: string;
}

/** Information about a git branch. */
export interface GitBranch {
  name: string;
  is_local: boolean;
}
