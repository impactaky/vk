import { ApiClient } from "../utils/api-client.ts";
import { loadConfig, saveConfig } from "../utils/config.ts";
import { printError, printInfo, printSuccess } from "../utils/output.ts";
import type {
  CheckTokenResponse,
  DeviceFlowStartResponse,
  DevicePollStatus,
} from "../types/api.ts";

export async function authLogin(): Promise<void> {
  try {
    const client = await ApiClient.create();

    printInfo("Starting GitHub authentication...");
    const startResponse = await client.post<DeviceFlowStartResponse>(
      "/auth/github/device/start",
    );

    if (!startResponse.success || !startResponse.data) {
      throw new Error("Failed to start authentication flow");
    }

    const { user_code, verification_uri, interval } = startResponse.data;

    printInfo(`\nPlease visit: ${verification_uri}`);
    printInfo(`And enter code: ${user_code}\n`);
    printInfo("Waiting for authentication...");

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5 second intervals

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));

      const pollResponse = await client.post<DevicePollStatus>("/auth/github/device/poll");

      if (!pollResponse.success || !pollResponse.data) {
        throw new Error("Failed to poll authentication status");
      }

      if (pollResponse.data === "SUCCESS") {
        printSuccess("Authentication successful!");

        const checkResponse = await client.get<CheckTokenResponse>("/auth/github/check");
        if (checkResponse.success) {
          const config = await loadConfig();
          await saveConfig(config);
          printSuccess("Logged in successfully");
        }
        return;
      } else if (pollResponse.data === "AUTHORIZATION_PENDING") {
        attempts++;
      } else if (pollResponse.data === "SLOW_DOWN") {
        await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        attempts++;
      }
    }

    printError("Authentication timed out. Please try again.");
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Authentication failed",
    );
    Deno.exit(1);
  }
}

export async function authStatus(): Promise<void> {
  try {
    const config = await loadConfig();

    if (!config.github_token) {
      printInfo("Not logged in. Run 'vk auth login' to authenticate.");
      return;
    }

    const client = await ApiClient.create();
    const response = await client.get<CheckTokenResponse>("/auth/github/check");

    if (response.success && response.data === "VALID") {
      printSuccess(
        `Logged in${config.github_username ? ` as ${config.github_username}` : ""}`,
      );
    } else {
      printInfo("Token is invalid. Run 'vk auth login' to re-authenticate.");
    }
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to check authentication status",
    );
    Deno.exit(1);
  }
}

export async function authLogout(): Promise<void> {
  try {
    const config = await loadConfig();
    config.github_token = undefined;
    config.github_username = undefined;
    await saveConfig(config);
    printSuccess("Logged out successfully");
  } catch (error) {
    printError(
      error instanceof Error ? error.message : "Failed to logout",
    );
    Deno.exit(1);
  }
}
