import { Command } from "@cliffy/command";
import { loadConfig, saveConfig } from "../api/config.ts";

export const configCommand = new Command()
  .description("Manage CLI configuration")
  .action(function () {
    this.showHelp();
  });

// Show config
configCommand
  .command("show")
  .description("Show current configuration")
  .action(async () => {
    const config = await loadConfig();
    console.log(`API URL: ${config.apiUrl}`);
    console.log(`Shell: ${config.shell || "(default: bash)"}`);
  });

// Set config value
configCommand
  .command("set")
  .description("Set a configuration value. Available keys: api-url, shell")
  .arguments("<key:string> <value:string>")
  .action(async (_options, key, value) => {
    const config = await loadConfig();

    switch (key) {
      case "api-url":
        config.apiUrl = value;
        break;
      case "shell":
        config.shell = value;
        break;
      default:
        console.error(`Unknown configuration key: ${key}`);
        console.log("Available keys: api-url, shell");
        Deno.exit(1);
    }

    await saveConfig(config);
    console.log(`Configuration updated: ${key} = ${value}`);
  });
