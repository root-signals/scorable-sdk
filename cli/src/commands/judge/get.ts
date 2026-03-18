import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerGetCommand(judge: Command): void {
  judge
    .command("get <judgeId>")
    .description("Get a specific judge by its ID")
    .action(async (judgeId: string) => {
      const apiKey = await requireApiKey();
      printInfo(`Fetching judge with ID: ${judgeId}...`);

      try {
        const client = getSdkClient(apiKey);
        const result = await client.judges.get(judgeId);
        printSuccess(`Judge '${result.name}' details:`);
        printJson(result);
      } catch (e) {
        handleSdkError(e);
      }
    });
}
