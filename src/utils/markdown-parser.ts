/**
 * Markdown parser utility for extracting task title and description.
 * Uses @libs/markdown for parsing markdown content.
 */

export interface ParsedTask {
  title: string;
  description?: string;
}

export class MarkdownParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarkdownParseError";
  }
}

/**
 * Parse markdown content to extract task title and description.
 * The first heading becomes the title, and remaining content becomes the description.
 */
export function parseTaskFromMarkdown(content: string): ParsedTask {
  const lines = content.split("\n");
  let titleLine = -1;
  let title = "";

  // Find first heading (# or ##, etc.)
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^#+\s+(.+)$/);
    if (match) {
      title = match[1].trim();
      titleLine = i;
      break;
    }
  }

  if (titleLine === -1 || !title) {
    throw new MarkdownParseError(
      "Markdown file must contain a heading for the task title",
    );
  }

  // Get remaining content as description
  const descriptionLines = lines.slice(titleLine + 1);
  // Trim leading empty lines but preserve internal line feeds
  let description = descriptionLines.join("\n");
  // Remove leading whitespace/newlines
  description = description.replace(/^\s*\n/, "");
  // Remove only trailing whitespace (not newlines in the middle)
  description = description.trimEnd();

  return {
    title,
    description: description || undefined,
  };
}

/**
 * Read and parse a markdown file for task creation.
 */
export async function parseTaskFromFile(filePath: string): Promise<ParsedTask> {
  try {
    const content = await Deno.readTextFile(filePath);
    return parseTaskFromMarkdown(content);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new MarkdownParseError(`File not found: ${filePath}`);
    }
    if (error instanceof MarkdownParseError) {
      throw error;
    }
    throw new MarkdownParseError(`Failed to read file: ${filePath}`);
  }
}
