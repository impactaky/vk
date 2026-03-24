import { assertEquals } from "@std/assert";
import { CliError, reportCliError } from "./error-handler.ts";

Deno.test("reportCliError formats CliError details without forcing prefix", () => {
  const stderrLines: string[] = [];
  const stdoutLines: string[] = [];

  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...args: unknown[]) => {
    stderrLines.push(args.map(String).join(" "));
  };
  console.log = (...args: unknown[]) => {
    stdoutLines.push(args.map(String).join(" "));
  };

  try {
    const exitCode = reportCliError(
      new CliError("Unknown configuration key: nope", {
        details: ["Available keys: api-url, shell"],
      }),
    );

    assertEquals(exitCode, 1);
    assertEquals(stderrLines, ["Unknown configuration key: nope"]);
    assertEquals(stdoutLines, ["Available keys: api-url, shell"]);
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
});

Deno.test("reportCliError prefixes generic errors", () => {
  const stderrLines: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    stderrLines.push(args.map(String).join(" "));
  };

  try {
    const exitCode = reportCliError(new Error("boom"));
    assertEquals(exitCode, 1);
    assertEquals(stderrLines, ["Error: boom"]);
  } finally {
    console.error = originalError;
  }
});
