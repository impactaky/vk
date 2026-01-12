import { assertEquals, assertThrows } from "@std/assert";
import { parseExecutorString } from "../src/utils/executor-parser.ts";

Deno.test("parseExecutorString - valid format with uppercase", () => {
  const result = parseExecutorString("CLAUDE_CODE:DEFAULT");
  assertEquals(result, { executor: "CLAUDE_CODE", variant: "DEFAULT" });
});

Deno.test("parseExecutorString - valid format with different variant", () => {
  const result = parseExecutorString("CLAUDE_CODE:AGGRESSIVE");
  assertEquals(result, { executor: "CLAUDE_CODE", variant: "AGGRESSIVE" });
});

Deno.test("parseExecutorString - invalid executor name", () => {
  assertThrows(
    () => parseExecutorString("custom_executor:standard"),
    Error,
    'Invalid executor name: "custom_executor"',
  );
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
