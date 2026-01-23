import { join } from "@std/path";

export interface Config {
  apiUrl: string;
}

const CONFIG_FILE = "vk-config.json";

function getConfigPath(): string {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";
  return join(home, ".config", "vibe-kanban", CONFIG_FILE);
}

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

export async function getApiUrl(): Promise<string> {
  const config = await loadConfig();
  return config.apiUrl;
}
