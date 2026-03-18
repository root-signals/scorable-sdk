import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printJson, handleSdkError } from "../../output.js";

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
        handleSdkError(e);
      }
    });
}
