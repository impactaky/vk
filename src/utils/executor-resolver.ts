import type { ApiClient } from "../api/client.ts";

/**
 * Error thrown when executor resolution fails
 */
export class ExecutorResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutorResolverError";
  }
}

/**
 * Resolves an executor name or ID to a profile ID
 * @param nameOrId - Executor name or profile ID
 * @param client - API client instance
 * @returns The resolved executor profile ID
 * @throws ExecutorResolverError if resolution fails
 */
export async function resolveExecutor(
  nameOrId: string,
  client: ApiClient,
): Promise<string> {
  // Fetch all executor profiles
  const profiles = await client.listExecutorProfiles();

  // First, check if it's an exact ID match
  const idMatch = profiles.find((p) => p.id === nameOrId);
  if (idMatch) {
    return idMatch.id;
  }

  // Check for exact name match (case-sensitive)
  const exactNameMatches = profiles.filter((p) => p.name === nameOrId);
  if (exactNameMatches.length === 1) {
    return exactNameMatches[0].id;
  }

  if (exactNameMatches.length > 1) {
    throw new ExecutorResolverError(
      `Multiple executor profiles found with name "${nameOrId}". Please use the profile ID instead:\n` +
        exactNameMatches.map((p) => `  - ${p.name} (ID: ${p.id})`).join("\n"),
    );
  }

  // Check for partial name matches (case-insensitive)
  const partialMatches = profiles.filter((p) =>
    p.name.toLowerCase().includes(nameOrId.toLowerCase())
  );

  if (partialMatches.length === 1) {
    return partialMatches[0].id;
  }

  if (partialMatches.length > 1) {
    throw new ExecutorResolverError(
      `Multiple executor profiles match "${nameOrId}". Did you mean one of these?\n` +
        partialMatches.map((p) => `  - ${p.name} (ID: ${p.id})`).join("\n") +
        "\n\nPlease use the full name or profile ID.",
    );
  }

  // No matches found
  throw new ExecutorResolverError(
    `Executor profile "${nameOrId}" not found. Use "vk executor list" to see available executors.`,
  );
}
