import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printInfo, printJson, handleSdkError } from "../../output.js";
import type { UpdateProjectParams } from "@root-signals/scorable";

export function registerUpdateCommand(project: Command): void {
  project
    .command("update <projectId>")
    .description("Update an existing project (PATCH)")
    .option("--name <name>", "New project name")
    .option("--description <text>", "New project description")
    .option(
      "--is-default",
      "Promote this project to org default. Atomically clears the previous default. Clearing the default directly is not supported by the backend; promote another project instead.",
      false,
    )
    .action(
      async (
        projectId: string,
        opts: { name?: string; description?: string; isDefault?: boolean },
      ) => {
        const apiKey = await requireApiKey();

        const payload: UpdateProjectParams = {};
        if (opts.name !== undefined) payload.name = opts.name;
        if (opts.description !== undefined) payload.description = opts.description;
        if (opts.isDefault) payload.is_default = true;

        if (Object.keys(payload).length === 0) {
          printInfo("No update parameters provided. Aborting.");
          return;
        }

        const spinner = ora("Updating...").start();
        try {
          const client = getSdkClient(apiKey);
          const result = await client.projects.update(projectId, payload);
          spinner.stop();
          printSuccess(`Project ${projectId} updated successfully!`);
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
