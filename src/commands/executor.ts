import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { ApiClient } from "../api/client.ts";

export const executorCommand = new Command()
  .description("Manage executor profiles")
  .action(function () {
    this.showHelp();
  });

// List executor profiles
executorCommand
  .command("list")
  .description("List available executor profiles")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    const client = await ApiClient.create();
    const profiles = await client.listExecutorProfiles();

    if (options.json) {
      console.log(JSON.stringify(profiles, null, 2));
      return;
    }

    if (profiles.length === 0) {
      console.log("No executor profiles found.");
      return;
    }

    const table = new Table()
      .header(["ID", "Name", "Type"])
      .body(
        profiles.map((p) => [p.id, p.name, p.executor_type]),
      );

    table.render();
  });
