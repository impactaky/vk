import { assertEquals, assertThrows } from "@std/assert";
import type { ExecutorProfileID } from "../src/api/types.ts";

/**
 * Parse executor string in format "<name>:<variant>" into ExecutorProfileID
 * This is a copy of the function from src/commands/attempt.ts for testing purposes
 */
function parseExecutorString(executorString: string): ExecutorProfileID {
  const parts = executorString.split(":");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid executor format: "${executorString}". Expected format: <name>:<variant> (e.g., CLAUDE_CODE:DEFAULT)`,
    );
  }

  const [executor, variant] = parts;
  if (!executor || !variant) {
    throw new Error(
      `Invalid executor format: "${executorString}". Both name and variant must be non-empty.`,
    );
  }

  return { executor, variant };
}

Deno.test("parseExecutorString - valid format with uppercase", () => {
  const result = parseExecutorString("CLAUDE_CODE:DEFAULT");
  assertEquals(result, { executor: "CLAUDE_CODE", variant: "DEFAULT" });
});

Deno.test("parseExecutorString - valid format with different variant", () => {
  const result = parseExecutorString("CLAUDE_CODE:AGGRESSIVE");
  assertEquals(result, { executor: "CLAUDE_CODE", variant: "AGGRESSIVE" });
});

Deno.test("parseExecutorString - valid format with lowercase", () => {
  const result = parseExecutorString("custom_executor:standard");
  assertEquals(result, { executor: "custom_executor", variant: "standard" });
});

Deno.test("parseExecutorString - invalid format without colon", () => {
  assertThrows(
    () => parseExecutorString("CLAUDE_CODE"),
    Error,
    'Invalid executor format: "CLAUDE_CODE". Expected format: <name>:<variant>',
  );
});

Deno.test("parseExecutorString - invalid format with multiple colons", () => {
  assertThrows(
    () => parseExecutorString("CLAUDE_CODE:DEFAULT:EXTRA"),
    Error,
    'Invalid executor format: "CLAUDE_CODE:DEFAULT:EXTRA". Expected format: <name>:<variant>',
  );
});

Deno.test("parseExecutorString - invalid format with empty name", () => {
  assertThrows(
    () => parseExecutorString(":DEFAULT"),
    Error,
    'Invalid executor format: ":DEFAULT". Both name and variant must be non-empty.',
  );
});

Deno.test("parseExecutorString - invalid format with empty variant", () => {
  assertThrows(
    () => parseExecutorString("CLAUDE_CODE:"),
    Error,
    'Invalid executor format: "CLAUDE_CODE:". Both name and variant must be non-empty.',
  );
});

Deno.test("parseExecutorString - invalid format with empty string", () => {
  assertThrows(
    () => parseExecutorString(""),
    Error,
    'Invalid executor format: "". Expected format: <name>:<variant>',
  );
});
