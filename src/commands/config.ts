import { getConfigValue, loadConfig, setConfigValue } from "../utils/config.ts";
import { printError, printInfo, printSuccess } from "../utils/output.ts";
import type { VkConfig } from "../types/config.ts";

export async function configSet(key: string, value: string): Promise<void> {
  try {
    if (!isValidConfigKey(key)) {
      printError(`Invalid configuration key: ${key}`);
      printInfo("Valid keys: api_url, github_token, github_username");
      Deno.exit(1);
    }

    await setConfigValue(key as keyof VkConfig, value);
    printSuccess(`Set ${key} = ${value}`);
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to set configuration",
    );
    Deno.exit(1);
  }
}

export async function configGet(key: string): Promise<void> {
  try {
    if (!isValidConfigKey(key)) {
      printError(`Invalid configuration key: ${key}`);
      printInfo("Valid keys: api_url, github_token, github_username");
      Deno.exit(1);
    }

    const value = await getConfigValue(key as keyof VkConfig);
    if (value !== undefined) {
      printInfo(value);
    } else {
      printInfo(`${key} is not set`);
    }
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to get configuration",
    );
    Deno.exit(1);
  }
}

export async function configList(): Promise<void> {
  try {
    const config = await loadConfig();
    printInfo("Current configuration:");
    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined) {
        printInfo(`  ${key}: ${value}`);
      }
    }
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to list configuration",
    );
    Deno.exit(1);
  }
}

function isValidConfigKey(key: string): boolean {
  return ["api_url", "github_token", "github_username"].includes(key);
}
