import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerDuplicateCommand(evaluator: Command): void {
  evaluator
    .command("duplicate <evaluatorId>")
    .description("Duplicate an existing evaluator")
    .action(async (evaluatorId: string) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Duplicating...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.evaluators.duplicate(evaluatorId);
        spinner.stop();
        printSuccess(`Evaluator ${evaluatorId} duplicated successfully!`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
