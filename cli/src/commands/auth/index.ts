import { Command } from "commander";
import ora from "ora";
import { loadSettings, saveSettings, createDemoKey } from "../../auth.js";
import { printSuccess, printError, printInfo, printMessage } from "../../output.js";
import { resolveProjectId } from "../../lib/project-id.js";
import { CliError } from "../../types.js";

// Keys owned by the auth surface that `auth logout` clears.
const AUTH_SETTINGS_KEYS = ["api_key", "temporary_api_key", "project_id"] as const;

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
    .command("set-project <projectId>")
    .description("Persist a project_id to ~/.scorable/settings.json")
    .action((projectId: string) => {
      if (!projectId.trim()) {
        printError("Project ID must not be empty.");
        throw new CliError(1, "Empty project id");
      }
      const settings = loadSettings();
      settings["project_id"] = projectId.trim();
      if (!saveSettings(settings)) {
        printError("Failed to save project_id to ~/.scorable/settings.json");
        throw new CliError(1, "Failed to save project_id");
      }
      printSuccess(`project_id saved to ~/.scorable/settings.json`);
    });

  auth
    .command("unset-project")
    .description("Remove the persisted project_id from ~/.scorable/settings.json")
    .action(() => {
      const settings = loadSettings();
      if (!("project_id" in settings)) {
        printInfo("No project_id was set.");
        return;
      }
      delete settings["project_id"];
      if (!saveSettings(settings)) {
        printError("Failed to update ~/.scorable/settings.json");
        throw new CliError(1, "Failed to update settings");
      }
      printSuccess("project_id removed from ~/.scorable/settings.json");
    });

  auth
    .command("show-project")
    .description("Print the resolved project_id and its source (flag/env/settings/none)")
    .action(() => {
      // No flag value here — flag resolution is per-invocation on other commands.
      const resolved = resolveProjectId(undefined);
      if (resolved.value === undefined) {
        printMessage("project_id: <none> (source: none)");
        return;
      }
      printMessage(`project_id: ${resolved.value} (source: ${resolved.source})`);
    });

  auth
    .command("logout")
    .description("Clear the auth section of ~/.scorable/settings.json (api keys + project_id)")
    .action(() => {
      const settings = loadSettings();
      let touched = false;
      for (const k of AUTH_SETTINGS_KEYS) {
        if (k in settings) {
          delete settings[k];
          touched = true;
        }
      }
      if (!touched) {
        printInfo("Already logged out.");
        return;
      }
      if (!saveSettings(settings)) {
        printError("Failed to update ~/.scorable/settings.json");
        throw new CliError(1, "Failed to update settings");
      }
      printSuccess("Logged out — cleared api_key, temporary_api_key, and project_id.");
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
