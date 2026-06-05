import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";
import type { CreateProjectParams } from "@root-signals/scorable";

export function registerCreateCommand(project: Command): void {
  project
    .command("create")
    .description("Create a new project")
    .requiredOption("--name <name>", "Project name")
    .option("--description <text>", "Project description")
    .option(
      "--is-default",
      "Mark this project as the org default (atomically clears any previous default).",
      false,
    )
    .action(async (opts: { name: string; description?: string; isDefault?: boolean }) => {
      const apiKey = await requireApiKey();

      const payload: CreateProjectParams = { name: opts.name };
      if (opts.description !== undefined) payload.description = opts.description;
      if (opts.isDefault) payload.is_default = true;

      const spinner = ora("Creating...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.projects.create(payload);
        spinner.stop();
        printSuccess("Project created successfully!");
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
