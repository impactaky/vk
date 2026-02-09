/**
 * @vibe-kanban/cli - CLI and library for managing vibe-kanban workflows.
 *
 * This module exports the API client, configuration utilities, and all
 * TypeScript types used by the vibe-kanban CLI.
 *
 * @example
 * ```ts
 * import { ApiClient } from "@vibe-kanban/cli";
 *
 * const client = await ApiClient.create();
 * const projects = await client.listProjects();
 * ```
 *
 * @module
 */

// API Client
export { ApiClient } from "./api/client.ts";

// Configuration
export { getApiUrl, loadConfig, saveConfig } from "./api/config.ts";
export type { Config } from "./api/config.ts";

// Types - re-export everything from types.ts
export type {
  ApiResponse,
  AttachPRRequest,
  BranchStatus,
  ConflictOp,
  CreateProject,
  CreateProjectRepo,
  CreatePRRequest,
  CreateTask,
  CreateWorkspace,
  ExecutionProcess,
  ExecutionProcessRunReason,
  ExecutionProcessStatus,
  ExecutorProfileID,
  FollowUpRequest,
  GitBranch,
  InitRepoRequest,
  Merge,
  MergeResult,
  MergeWorkspaceRequest,
  PRComment,
  Project,
  ProjectRepo,
  PRResult,
  PushWorkspaceRequest,
  RebaseWorkspaceRequest,
  RegisterRepoRequest,
  RenameBranchRequest,
  Repo,
  RepoBranchStatus,
  Session,
  Task,
  TaskStatus,
  TaskWithAttemptStatus,
  UnifiedPRComment,
  UpdateProject,
  UpdateRepo,
  UpdateTask,
  UpdateWorkspace,
  Workspace,
  WorkspaceRepo,
  WorkspaceRepoInput,
  WorkspaceStatus,
} from "./api/types.ts";

// Constants
export { VALID_EXECUTORS } from "./api/types.ts";
export type { BaseCodingAgent } from "./api/types.ts";
