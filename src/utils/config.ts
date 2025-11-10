import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { VkConfig } from "../types/config.ts";
import { DEFAULT_CONFIG } from "../types/config.ts";

const CONFIG_DIR = join(Deno.env.get("HOME") || "~", ".config", "vk");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<VkConfig> {
  try {
    const content = await Deno.readTextFile(CONFIG_FILE);
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

export async function saveConfig(config: VkConfig): Promise<void> {
  await ensureDir(CONFIG_DIR);
  await Deno.writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function getConfigValue(key: keyof VkConfig): Promise<string | undefined> {
  const config = await loadConfig();
  return config[key]?.toString();
}

export async function setConfigValue(key: keyof VkConfig, value: string): Promise<void> {
  const config = await loadConfig();
  if (key === "api_url" || key === "github_token" || key === "github_username") {
    config[key] = value;
  }
  await saveConfig(config);
}
