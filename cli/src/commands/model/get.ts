import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerGetCommand(model: Command): void {
  model
    .command("get <modelId>")
    .description("Get a specific model by its ID")
    .action(async (modelId: string) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Fetching...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.models.get(modelId);
        spinner.stop();
        printSuccess(`Model '${result.name}' details:`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
