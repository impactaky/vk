import { assertEquals, assertRejects } from "@std/assert";
import {
  MarkdownParseError,
  parseTaskFromMarkdown,
} from "./markdown-parser.ts";

Deno.test("parseTaskFromMarkdown - extracts title from h1", async () => {
  const content = `# Fix authentication bug

Users cannot log in when using SSO.
Check the OAuth callback handler.`;

  const result = await parseTaskFromMarkdown(content);

  assertEquals(result.title, "Fix authentication bug");
  assertEquals(
    result.description,
    "Users cannot log in when using SSO.\nCheck the OAuth callback handler.",
  );
});

Deno.test("parseTaskFromMarkdown - extracts title from h2", async () => {
  const content = `## Update dependencies

- Update deno to latest version
- Run tests`;

  const result = await parseTaskFromMarkdown(content);

  assertEquals(result.title, "Update dependencies");
  assertEquals(
    result.description,
    "- Update deno to latest version\n- Run tests",
  );
});

Deno.test("parseTaskFromMarkdown - handles title only", async () => {
  const content = `# Simple task`;

  const result = await parseTaskFromMarkdown(content);

  assertEquals(result.title, "Simple task");
  assertEquals(result.description, undefined);
});

Deno.test("parseTaskFromMarkdown - handles content before heading", async () => {
  const content = `Some preamble text

# Actual title

Description here`;

  const result = await parseTaskFromMarkdown(content);

  assertEquals(result.title, "Actual title");
  assertEquals(result.description, "Description here");
});

Deno.test("parseTaskFromMarkdown - throws on no heading", async () => {
  const content = `This is just plain text without a heading.`;

  await assertRejects(
    () => parseTaskFromMarkdown(content),
    MarkdownParseError,
    "Markdown file must contain a heading for the task title",
  );
});

Deno.test("parseTaskFromMarkdown - throws on empty content", async () => {
  const content = ``;

  await assertRejects(
    () => parseTaskFromMarkdown(content),
    MarkdownParseError,
    "Markdown file must contain a heading for the task title",
  );
});

Deno.test("parseTaskFromMarkdown - trims whitespace from title", async () => {
  const content = `#    Lots of spaces

Description`;

  const result = await parseTaskFromMarkdown(content);

  assertEquals(result.title, "Lots of spaces");
});

Deno.test("parseTaskFromMarkdown - preserves markdown in description", async () => {
  const content = `# Task title

## Subtask
- Item 1
- Item 2

\`\`\`typescript
const x = 1;
\`\`\``;

  const result = await parseTaskFromMarkdown(content);

  assertEquals(result.title, "Task title");
  assertEquals(
    result.description,
    `## Subtask
- Item 1
- Item 2

\`\`\`typescript
const x = 1;
\`\`\``,
  );
});
