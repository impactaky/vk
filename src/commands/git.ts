
import { ApiClient } from "../utils/api-client.ts";
import { printError, printInfo, printJson, printSuccess } from "../utils/output.ts";
import type {
  BranchStatus,
  ChangeTargetBranchRequest,
  ChangeTargetBranchResponse,
  CreateGitHubPrRequest,
  PullRequestInfo,
  RebaseRequest,
  RenameBranchRequest,
  RenameBranchResponse,
} from "../types/api.ts";

export async function gitMerge(attemptId: string): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.post(`/task-attempts/${attemptId}/merge`);

    if (!response.success) {
      throw new Error(response.error || "Failed to merge task attempt");
    }

    printSuccess(`Successfully merged task attempt ${attemptId}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to merge task attempt",
    );
    Deno.exit(1);
  }
}

export async function gitPush(attemptId: string): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.post(`/task-attempts/${attemptId}/push`);

    if (!response.success) {
      throw new Error(response.error || "Failed to push branch");
    }

    printSuccess(`Successfully pushed branch for task attempt ${attemptId}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to push branch",
    );
    Deno.exit(1);
  }
}

export async function gitCreatePr(
  attemptId: string,
  options: {
    title: string;
    body?: string;
    target?: string;
  },
): Promise<void> {
  try {
    const client = await ApiClient.create();

    const requestData: CreateGitHubPrRequest = {
      title: options.title,
      body: options.body,
      target_branch: options.target,
    };

    const response = await client.post<PullRequestInfo>(
      `/task-attempts/${attemptId}/create-github-pr`,
      requestData,
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create GitHub PR");
    }

    printSuccess(`Created GitHub PR #${response.data.number}`);
    printInfo(`URL: ${response.data.url}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to create GitHub PR",
    );
    Deno.exit(1);
  }
}

export async function gitRebase(
  attemptId: string,
  options: {
    oldBase?: string;
    newBase?: string;
  },
): Promise<void> {
  try {
    const client = await ApiClient.create();

    const requestData: RebaseRequest = {
      old_base_branch: options.oldBase,
      new_base_branch: options.newBase,
    };

    const response = await client.post(
      `/task-attempts/${attemptId}/rebase`,
      requestData,
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to rebase task attempt");
    }

    printSuccess(`Successfully rebased task attempt ${attemptId}`);
    if (options.newBase) {
      printInfo(`New base branch: ${options.newBase}`);
    }
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to rebase task attempt",
    );
    Deno.exit(1);
  }
}

export async function gitChangeTarget(
  attemptId: string,
  options: {
    target: string;
  },
): Promise<void> {
  try {
    const client = await ApiClient.create();

    const requestData: ChangeTargetBranchRequest = {
      target_branch: options.target,
    };

    const response = await client.post<ChangeTargetBranchResponse>(
      `/task-attempts/${attemptId}/change-target-branch`,
      requestData,
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to change target branch");
    }

    printSuccess(response.data.message);
    if (response.data.updated_children_count !== undefined) {
      printInfo(`Updated ${response.data.updated_children_count} child attempts`);
    }
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to change target branch",
    );
    Deno.exit(1);
  }
}

export async function gitRenameBranch(
  attemptId: string,
  options: {
    name: string;
  },
): Promise<void> {
  try {
    const client = await ApiClient.create();

    const requestData: RenameBranchRequest = {
      new_branch_name: options.name,
    };

    const response = await client.post<RenameBranchResponse>(
      `/task-attempts/${attemptId}/rename-branch`,
      requestData,
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to rename branch");
    }

    printSuccess(response.data.message);
    printInfo(`Updated ${response.data.updated_children_count} child attempts`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to rename branch",
    );
    Deno.exit(1);
  }
}

export async function gitBranchStatus(
  attemptId: string,
  options: { json?: boolean },
): Promise<void> {
  try {
    const client = await ApiClient.create();
    const response = await client.get<BranchStatus>(
      `/task-attempts/${attemptId}/branch-status`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to get branch status");
    }

    if (options.json) {
      printJson(response.data);
      return;
    }

    const status = response.data;
    printInfo(`Branch Status for Task Attempt ${attemptId}:`);
    printInfo(`  Uncommitted changes: ${status.has_uncommitted_changes ? "Yes" : "No"}`);
    if (status.head_oid) {
      printInfo(`  Head commit: ${status.head_oid.substring(0, 8)}`);
    }
    if (status.ahead_count !== undefined) {
      printInfo(`  Ahead by: ${status.ahead_count} commits`);
    }
    if (status.behind_count !== undefined) {
      printInfo(`  Behind by: ${status.behind_count} commits`);
    }
    printInfo(`  Has conflicts: ${status.has_conflicts ? "Yes" : "No"}`);
    if (status.has_conflicts && status.conflict_op) {
      printInfo(`  Conflict type: ${status.conflict_op}`);
    }
    printInfo(`  Target branch exists: ${status.target_branch_exists ? "Yes" : "No"}`);
    if (status.target_branch_type) {
      printInfo(`  Target branch type: ${status.target_branch_type}`);
    }
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to get branch status",
    );
    Deno.exit(1);
  }
}
