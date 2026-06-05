import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerSetDefaultCommand(project: Command): void {
  project
    .command("set-default <projectId>")
    .description("Promote a project to the org default. Atomically clears the previous default.")
    .action(async (projectId: string) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Updating default project...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.projects.update(projectId, { is_default: true });
        spinner.stop();
        printSuccess(`Project ${projectId} is now the org default.`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
