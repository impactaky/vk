/**
 * CLI command integration tests.
 */

import { assert, assertEquals } from "@std/assert";
import { join } from "@std/path";
import { config } from "./helpers/test-server.ts";

Deno.test("CLI: vk config set/get shell persists value", async () => {
  const testHome = `/tmp/test-home-${Date.now()}`;
  const configPath = join(
    testHome,
    ".config",
    "vibe-kanban",
    "vk-config.json",
  );

  try {
    const setCommand = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "config",
        "set",
        "shell",
        "zsh",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: testHome,
      },
    });

    const setResult = await setCommand.output();
    const setStdout = new TextDecoder().decode(setResult.stdout);
    const setStderr = new TextDecoder().decode(setResult.stderr);

    assertEquals(
      setResult.code,
      0,
      `config set command failed: ${setStderr}`,
    );
    assert(setStdout.includes("Configuration updated: shell = zsh"));

    const getCommand = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "config",
        "show",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: testHome,
      },
    });

    const getResult = await getCommand.output();
    const getStdout = new TextDecoder().decode(getResult.stdout);
    const getStderr = new TextDecoder().decode(getResult.stderr);

    assertEquals(
      getResult.code,
      0,
      `config show command failed: ${getStderr}`,
    );
    assert(getStdout.includes("Shell: zsh"));

    const configContent = await Deno.readTextFile(configPath);
    const parsed = JSON.parse(configContent);
    assertEquals(parsed.shell, "zsh");
  } finally {
    try {
      await Deno.remove(testHome, { recursive: true });
    } catch {
      // Ignore cleanup errors.
    }
  }
});

Deno.test("CLI: vk config set rejects invalid nats-port with exit code 1", async () => {
  const testHome = `/tmp/test-home-invalid-port-${Date.now()}`;

  try {
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/main.ts",
        "config",
        "set",
        "nats-port",
        "nope",
      ],
      stdout: "piped",
      stderr: "piped",
      env: {
        VK_API_URL: config.apiUrl,
        HOME: testHome,
      },
    });

    const result = await command.output();
    const stderrText = new TextDecoder().decode(result.stderr).trim();

    assertEquals(result.code, 1);
    assertEquals(
      stderrText,
      "Invalid value for nats-port. Must be a positive integer.",
    );
  } finally {
    try {
      await Deno.remove(testHome, { recursive: true });
    } catch {
      // Ignore cleanup errors.
    }
  }
});
