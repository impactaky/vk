import { parseTaskFromFile, type ParsedTask } from "./markdown-parser.ts";

function getEditorCommand(): string {
  return (
    Deno.env.get("VISUAL") ||
    Deno.env.get("EDITOR") ||
    (Deno.build.os === "windows" ? "notepad" : "vim")
  );
}

function getShellInvocation(
  editorCommand: string,
  filePath: string,
): { command: string; args: string[] } {
  const quotedFilePath = JSON.stringify(filePath);

  if (Deno.build.os === "windows") {
    return {
      command: "cmd",
      args: ["/c", `${editorCommand} ${quotedFilePath}`],
    };
  }

  return {
    command: "sh",
    args: ["-c", `${editorCommand} ${quotedFilePath}`],
  };
}

async function launchEditor(filePath: string): Promise<void> {
  const editorCommand = getEditorCommand();
  const { command, args } = getShellInvocation(editorCommand, filePath);

  try {
    const process = new Deno.Command(command, {
      args,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    const status = await process.spawn().status;
    if (!status.success) {
      throw new Error(`Editor exited with code ${status.code}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Editor binary not found: ${editorCommand}`);
    }
    throw error;
  }
}

export async function parseTaskFromEditor(
  initialContent = "# Task title\n\n",
): Promise<ParsedTask> {
  const tempPath = await Deno.makeTempFile({ prefix: "vk-task-", suffix: ".md" });
  try {
    await Deno.writeTextFile(tempPath, initialContent);
    await launchEditor(tempPath);
    return await parseTaskFromFile(tempPath);
  } finally {
    await Deno.remove(tempPath);
  }
}
