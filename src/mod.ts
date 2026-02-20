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
 * const workspaces = await client.listAllWorkspaces();
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
  ConflictOp,
  CreateAndStartWorkspaceRequest,
  CreateAndStartWorkspaceResponse,
  CreatePRRequest,
  ExecutionProcess,
  ExecutionProcessRunReason,
  ExecutionProcessStatus,
  ExecutorConfig,
  ExecutorProfileID,
  FollowUpRequest,
  GitBranch,
  InitRepoRequest,
  LinkedIssue,
  Merge,
  MergeResult,
  MergeWorkspaceRequest,
  PRComment,
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
  WorkspaceRepoInput,
  WorkspaceStatus,
} from "./api/types.ts";

// Constants
export { VALID_EXECUTORS } from "./api/types.ts";
export type { BaseCodingAgent } from "./api/types.ts";
