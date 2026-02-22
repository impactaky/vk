import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";
import { applyFilters } from "../utils/filter.ts";
import { handleCliError } from "../utils/error-handler.ts";

export const organizationCommand = new Command()
  .description("Manage organizations")
  .action(function () {
    this.showHelp();
  });

// List organizations
organizationCommand
  .command("list")
  .description("List all organizations")
  .option("--name <name:string>", "Filter by organization name")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const client = await ApiClient.create();
      let organizations = await client.listOrganizations();

      const filters: Record<string, unknown> = {};
      if (options.name !== undefined) {
        filters.name = options.name;
      }

      organizations = applyFilters(organizations, filters);

      if (options.json) {
        console.log(JSON.stringify(organizations, null, 2));
        return;
      }

      if (organizations.length === 0) {
        console.log("No organizations found.");
        return;
      }

      const table = new Table()
        .header(["ID", "Name", "Created", "Updated"])
        .body(organizations.map((org) => [
          org.id,
          org.name,
          org.created_at,
          org.updated_at,
        ]));

      table.render();
    } catch (error) {
      handleCliError(error);
      throw error;
    }
  });
