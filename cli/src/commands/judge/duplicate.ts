import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerDuplicateCommand(judge: Command): void {
  judge
    .command("duplicate <judgeId>")
    .description("Duplicate an existing judge")
    .action(async (judgeId: string) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Duplicating...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.judges.duplicate(judgeId);
        spinner.stop();
        printSuccess(`Judge ${judgeId} duplicated successfully!`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
