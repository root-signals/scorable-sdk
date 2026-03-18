import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerGetCommand(judge: Command): void {
  judge
    .command("get <judgeId>")
    .description("Get a specific judge by its ID")
    .action(async (judgeId: string) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Fetching...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.judges.get(judgeId);
        spinner.stop();
        printSuccess(`Judge '${result.name}' details:`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
