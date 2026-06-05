import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerGetCommand(project: Command): void {
  project
    .command("get <projectId>")
    .description("Get a specific project by its ID")
    .action(async (projectId: string) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Fetching...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.projects.retrieve(projectId);
        spinner.stop();
        printSuccess(`Project '${result.name}' details:`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
