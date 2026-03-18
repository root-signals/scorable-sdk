import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerGetCommand(evaluator: Command): void {
  evaluator
    .command("get <evaluatorId>")
    .description("Get a specific evaluator by its ID")
    .action(async (evaluatorId: string) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Fetching...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.evaluators.get(evaluatorId);
        spinner.stop();
        printSuccess(`Evaluator '${result.name}' details:`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
