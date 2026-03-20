import { Command } from "commander";
import ora from "ora";
import { loadSettings, saveSettings, createDemoKey } from "../../auth.js";
import { printSuccess, printError } from "../../output.js";
import { CliError } from "../../types.js";

export function registerAuthCommands(program: Command): void {
  const auth = program.command("auth").description("Manage authentication");

  auth
    .command("set-key [apiKey]")
    .description("Save an API key to ~/.scorable/settings.json")
    .option("--stdin", "Read the API key from stdin")
    .action(async (apiKey: string | undefined, opts: { stdin?: boolean }) => {
      let key: string | undefined;

      if (opts.stdin) {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
        key = Buffer.concat(chunks).toString().trim();
      } else if (apiKey) {
        key = apiKey.trim();
      } else if (process.stdin.isTTY && process.stdout.isTTY) {
        const { password } = await import("@inquirer/prompts");
        key = (await password({ message: "Enter your API key:" })).trim();
      } else {
        printError(
          "No API key provided. Pass it as an argument, use --stdin, or run interactively.",
        );
        throw new CliError(1, "No API key provided");
      }

      if (!key) {
        printError("API key must not be empty.");
        throw new CliError(1, "Empty API key");
      }

      const settings = loadSettings();
      settings["api_key"] = key;
      if (!saveSettings(settings)) {
        printError("Failed to save API key to ~/.scorable/settings.json");
        throw new CliError(1, "Failed to save API key");
      }
      printSuccess("API key saved to ~/.scorable/settings.json");
    });

  auth
    .command("demo-key")
    .description("Create a free demo API key and save it to ~/.scorable/settings.json")
    .action(async () => {
      const spinner = ora("Creating demo key...").start();
      try {
        const key = await createDemoKey();
        spinner.stop();

        const settings = loadSettings();
        settings["temporary_api_key"] = key;
        if (!saveSettings(settings)) {
          printError("Failed to save demo key to ~/.scorable/settings.json");
          throw new CliError(1, "Failed to save demo key");
        }

        printSuccess(`Demo key saved to ~/.scorable/settings.json`);
      } catch (e) {
        spinner.stop();
        if (e instanceof CliError) throw e;
        printError(`Failed to create demo key: ${e instanceof Error ? e.message : String(e)}`);
        throw new CliError(1, "Failed to create demo key");
      }
    });
}
