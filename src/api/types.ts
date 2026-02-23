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

/** An organization represents a tenant/grouping unit in the system. */
export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
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
  | "CURSOR_AGENT"
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
  "CURSOR_AGENT",
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

/** Executor configuration accepted by create-and-start workspace APIs. */
export type ExecutorConfig = ExecutorProfileID;

/** Request body for creating and starting a new workspace. */
export interface CreateAndStartWorkspaceRequest {
  prompt: string;
  executor_config: ExecutorConfig;
  repos: WorkspaceRepoInput[];
  name?: string;
  linked_issue?: string;
  image_ids?: string[];
}

/** @deprecated Use CreateAndStartWorkspaceRequest. */
export type CreateWorkspace = CreateAndStartWorkspaceRequest;

/** Response body for creating and starting a new workspace. */
export interface CreateAndStartWorkspaceResponse {
  workspace: Workspace;
  execution_process: ExecutionProcess;
}

/** Request body for renaming a workspace's git branch. */
export interface RenameBranchRequest {
  new_branch_name: string;
}

/** Request body for creating a pull request from a workspace. */
export interface CreatePRRequest {
  repo_id: string;
  title: string;
  body?: string;
}

/** @deprecated Use RepoBranchStatus instead - API now returns array of repo statuses */
export interface BranchStatus {
  ahead: number;
  behind: number;
  has_conflicts: boolean;
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

/** Result of attempting to merge a workspace branch. */
export interface MergeResult {
  success: boolean;
  message?: string;
}

/** Request body for merging a workspace branch with its target. */
export interface MergeWorkspaceRequest {
  repo_id: string;
}

/** Request body for pushing a workspace branch to remote. */
export interface PushWorkspaceRequest {
  repo_id: string;
}

/** Request body for rebasing a workspace branch. */
export interface RebaseWorkspaceRequest {
  repo_id: string;
  old_base_branch?: string;
  new_base_branch?: string;
}

/** Pull request creation returns the URL of the created PR. */
export type PRResult = string;

/** Result payload when attaching an existing PR to a workspace. */
export interface PRAttachResult {
  pr_attached: boolean;
  pr_url: string;
  pr_number: number;
  pr_status: string;
}

/** Request body for sending a follow-up message to a running session. */
export interface FollowUpRequest {
  prompt: string;
  executor_profile_id: ExecutorProfileID;
}

/** Request body for attaching an existing pull request to a workspace. */
export interface AttachPRRequest {
  repo_id: string;
  pr_number: number;
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

/** Response payload for PR comments endpoint. */
export interface PRCommentsResponse {
  comments: UnifiedPRComment[];
}

/** A git repository registered with vibe-kanban. */
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
  default_working_dir: string | null;
  created_at: string;
  updated_at: string;
}

/** Request body for updating repository configuration. */
export interface UpdateRepo {
  display_name?: string | null;
  setup_script?: string | null;
  cleanup_script?: string | null;
  copy_files?: string | null;
  parallel_setup_script?: boolean | null;
  dev_server_script?: string | null;
}

/** Request body for registering an existing git repository. */
export interface RegisterRepoRequest {
  path: string;
  display_name: string | null;
}

/** Request body for initializing a new git repository. */
export interface InitRepoRequest {
  parent_path: string;
  folder_name: string;
}

/** Information about a git branch. */
export interface GitBranch {
  name: string;
  is_current: boolean;
  is_remote: boolean;
  last_commit_date: string;
}
