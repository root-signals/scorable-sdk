import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson } from "../../output.js";
import { CliError } from "../../types.js";

export function registerDuplicateCommand(evaluator: Command): void {
  evaluator
    .command("duplicate <evaluatorId>")
    .description("Duplicate an existing evaluator")
    .action(async (evaluatorId: string) => {
      const apiKey = await requireApiKey();
      printInfo(`Duplicating evaluator ID: ${evaluatorId}...`);

      try {
        const client = getSdkClient(apiKey);
        const result = await client.evaluators.duplicate(evaluatorId);
        printSuccess(`Evaluator ${evaluatorId} duplicated successfully!`);
        printJson(result);
      } catch (e) {
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message : String(e));
      }
    });
}
