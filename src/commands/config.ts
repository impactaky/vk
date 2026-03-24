import { Command } from "@cliffy/command";
import { loadConfig, saveConfig } from "../api/config.ts";
import { parseExecutorString } from "../utils/executor-parser.ts";
import { CliError } from "../utils/error-handler.ts";

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
    console.log(`NATS Host: ${config.natsHost || "localhost"}`);
    console.log(`NATS Port: ${config.natsPort || 4222}`);
    console.log(`NATS Subject: ${config.natsSubject || "vk.notify"}`);
    console.log(`Shell: ${config.shell || "(default: bash)"}`);
    console.log(`Default executor: ${config.defaultExecutor || "(not set)"}`);
  });

// Set config value
configCommand
  .command("set")
  .description(
    "Set a configuration value. Available keys: api-url, shell, default-executor, nats-host, nats-port, nats-subject",
  )
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
      case "default-executor":
        parseExecutorString(value);
        config.defaultExecutor = value;
        break;
      case "nats-host":
        config.natsHost = value;
        break;
      case "nats-port": {
        const parsedPort = Number(value);
        if (Number.isNaN(parsedPort) || parsedPort <= 0) {
          throw new CliError(
            "Invalid value for nats-port. Must be a positive integer.",
          );
        }
        config.natsPort = parsedPort;
        break;
      }
      case "nats-subject":
        config.natsSubject = value;
        break;
      default:
        throw new CliError(`Unknown configuration key: ${key}`, {
          details: [
            "Available keys: api-url, shell, default-executor, nats-host, nats-port, nats-subject",
          ],
        });
    }

    await saveConfig(config);
    console.log(`Configuration updated: ${key} = ${value}`);
  });
