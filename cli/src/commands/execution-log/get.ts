import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printJson, handleSdkError } from "../../output.js";

export function registerGetCommand(executionLog: Command): void {
  executionLog
    .command("get <logId>")
    .description("Get a specific execution log by its ID")
    .action(async (logId: string) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Fetching...").start();
      try {
        const client = getSdkClient(apiKey);
        const result = await client.executionLogs.get(logId);
        spinner.stop();
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
