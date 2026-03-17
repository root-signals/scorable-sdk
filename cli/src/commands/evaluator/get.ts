import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson } from "../../output.js";
import { CliError } from "../../types.js";

export function registerGetCommand(evaluator: Command): void {
  evaluator
    .command("get <evaluatorId>")
    .description("Get a specific evaluator by its ID")
    .action(async (evaluatorId: string) => {
      const apiKey = await requireApiKey();
      printInfo(`Fetching evaluator with ID: ${evaluatorId}...`);

      try {
        const client = getSdkClient(apiKey);
        const result = await client.evaluators.get(evaluatorId);
        printSuccess(`Evaluator '${result.name}' details:`);
        printJson(result);
      } catch (e) {
        if (e instanceof CliError) throw e;
        const message = e instanceof Error ? e.message || String(e) : String(e);
        printError(message);
        return;
      }
    });
}
