import { assertEquals } from "@std/assert";
import { OrganizationResolverError } from "./organization-resolver.ts";

Deno.test("OrganizationResolverError - is instance of Error", () => {
  const error = new OrganizationResolverError("test message");
  assertEquals(error.name, "OrganizationResolverError");
  assertEquals(error.message, "test message");
  assertEquals(error instanceof Error, true);
});
