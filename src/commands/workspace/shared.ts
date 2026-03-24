import { parseArgsStringToArgv } from "string-argv";
import type { ApiClient } from "../../api/client.ts";
import { getRepositoryId } from "../../utils/repository-resolver.ts";

export type PromptSourceOptions = {
  description?: string;
  file?: string;
};

export type RepoOptionValue = string | string[] | undefined;

const EDITOR_INSTRUCTIONS = [
  "# Enter the workspace prompt.",
  "# Lines starting with # are ignored.",
  "# Save and close the editor to continue.",
].join("\n");

function getConfiguredEditor(): string {
  const editor = Deno.env.get("GIT_EDITOR") ?? Deno.env.get("VISUAL") ??
    Deno.env.get("EDITOR");
  if (!editor || editor.trim().length === 0) {
    throw new Error(
      "Option --description or --file is required unless GIT_EDITOR, VISUAL, or EDITOR is set.",
    );
  }
  return editor.trim();
}

function normalizeEditorPrompt(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n")
    .trim();
}

async function resolvePromptFromEditor(): Promise<string> {
  const [command, ...args] = parseArgsStringToArgv(getConfiguredEditor());
  if (!command) {
    throw new Error("Editor command is empty.");
  }

  const tempFile = await Deno.makeTempFile({
    prefix: "vk-workspace-prompt-",
    suffix: ".md",
  });

  try {
    await Deno.writeTextFile(tempFile, `${EDITOR_INSTRUCTIONS}\n`);

    const result = await new Deno.Command(command, {
      args: [...args, tempFile],
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    }).output();

    if (result.code !== 0) {
      throw new Error(`Editor exited with status ${result.code}.`);
    }

    const prompt = normalizeEditorPrompt(await Deno.readTextFile(tempFile));
    if (prompt.length === 0) {
      throw new Error("Editor content must contain non-comment text.");
    }

    return prompt;
  } finally {
    await Deno.remove(tempFile).catch(() => undefined);
  }
}

export async function resolvePrompt(
  options: PromptSourceOptions,
): Promise<string> {
  if (options.description && options.file) {
    throw new Error("Options --description and --file are mutually exclusive.");
  }

  if (options.file) {
    const prompt = await Deno.readTextFile(options.file);
    if (prompt.trim().length === 0) {
      throw new Error("Option --file must contain non-empty text.");
    }
    return prompt;
  }

  if (options.description) {
    if (options.description.trim().length === 0) {
      throw new Error("Option --description must be non-empty.");
    }
    return options.description;
  }

  return await resolvePromptFromEditor();
}

function normalizeRepoOptionValues(repoOption: RepoOptionValue): string[] {
  const values = Array.isArray(repoOption) ? repoOption : [repoOption];
  return values
    .flatMap((value) => (value ? value.split(",") : []))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export async function resolveWorkspaceRepoInputs(
  repoOption: RepoOptionValue,
  targetBranch: string,
  client: ApiClient,
): Promise<Array<{ repo_id: string; target_branch: string }>> {
  const requestedRepos = normalizeRepoOptionValues(repoOption);
  const repoIds = requestedRepos.length > 0
    ? await Promise.all(
      requestedRepos.map((repo) => getRepositoryId(repo, client)),
    )
    : [await getRepositoryId(undefined, client)];

  return repoIds.map((repo_id) => ({ repo_id, target_branch: targetBranch }));
}
