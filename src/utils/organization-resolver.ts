import type { ApiClient } from "../api/client.ts";

export class OrganizationResolverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationResolverError";
  }
}

/**
 * Resolve organization by ID or name from all organizations
 * @param idOrName The organization ID or name to resolve
 * @param client API client instance
 * @returns The resolved organization ID
 */
async function resolveOrganizationByIdOrName(
  idOrName: string,
  client: ApiClient,
): Promise<string> {
  const organizations = await client.listOrganizations();

  // Strategy 1: Exact ID match
  const idMatch = organizations.find((org) => org.id === idOrName);
  if (idMatch) {
    return idMatch.id;
  }

  // Strategy 2: Name match
  const nameMatches = organizations.filter((org) => org.name === idOrName);
  if (nameMatches.length === 1) {
    return nameMatches[0].id;
  }
  if (nameMatches.length > 1) {
    throw new OrganizationResolverError(
      `Multiple organizations found with name "${idOrName}". Use organization ID instead:\n` +
        nameMatches.map((org) => `  - ${org.id}`).join("\n"),
    );
  }

  // No match found
  throw new OrganizationResolverError(
    `Organization not found: "${idOrName}". Use 'vk organization list' to see available organizations.`,
  );
}

/**
 * Get organization ID, either from explicit ID/name
 * @param explicitOrgIdOrName The explicitly provided organization ID or name (if any)
 * @param client API client instance
 * @returns The organization ID to use
 */
export async function getOrganizationId(
  explicitOrgIdOrName: string | undefined,
  client: ApiClient,
): Promise<string> {
  if (explicitOrgIdOrName) {
    return await resolveOrganizationByIdOrName(explicitOrgIdOrName, client);
  }

  throw new OrganizationResolverError(
    "Organization ID or name is required. Use 'vk organization list' to see available organizations.",
  );
}
