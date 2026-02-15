/**
 * Configuration utilities for the vibe-kanban CLI.
 *
 * Handles loading and saving configuration from ~/.config/vibe-kanban/vk-config.json,
 * with environment variable overrides (VK_API_URL).
 *
 * @module
 */

import { join } from "@std/path";

/** CLI configuration stored in ~/.config/vibe-kanban/vk-config.json. */
export interface Config {
  apiUrl: string;
  /** User's preferred shell for workspace sessions. */
  shell?: string;
  /** Default executor profile used when commands don't provide one. */
  defaultExecutor?: string;
}

const CONFIG_FILE = "vk-config.json";

function getConfigPath(): string {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";
  return join(home, ".config", "vibe-kanban", CONFIG_FILE);
}

/**
 * Load CLI configuration from file or use defaults.
 * VK_API_URL environment variable overrides the file setting.
 */
export async function loadConfig(): Promise<Config> {
  const configPath = getConfigPath();
  let config: Config;
  try {
    const content = await Deno.readTextFile(configPath);
    config = JSON.parse(content);
  } catch {
    config = {
      apiUrl: "http://localhost:3000",
    };
  }

  // Environment variable overrides config file
  const envApiUrl = Deno.env.get("VK_API_URL");
  if (envApiUrl) {
    config.apiUrl = envApiUrl;
  }

  return config;
}

/** Save CLI configuration to ~/.config/vibe-kanban/vk-config.json. */
export async function saveConfig(config: Config): Promise<void> {
  const configPath = getConfigPath();
  const dir = configPath.substring(0, configPath.lastIndexOf("/"));

  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));
}

/** Get the configured API URL, respecting VK_API_URL environment variable override. */
export async function getApiUrl(): Promise<string> {
  const config = await loadConfig();
  return config.apiUrl;
}
