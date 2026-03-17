import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson } from "../../output.js";
import { CliError } from "../../types.js";

export function registerDuplicateCommand(judge: Command): void {
  judge
    .command("duplicate <judgeId>")
    .description("Duplicate an existing judge")
    .action(async (judgeId: string) => {
      const apiKey = await requireApiKey();
      printInfo(`Duplicating judge ID: ${judgeId}...`);

      try {
        const client = getSdkClient(apiKey);
        const result = await client.judges.duplicate(judgeId);
        printSuccess(`Judge ${judgeId} duplicated successfully!`);
        printJson(result);
      } catch (e) {
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message : String(e));
      }
    });
}
