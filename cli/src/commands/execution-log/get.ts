import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printError, printJson } from "../../output.js";
import { CliError } from "../../types.js";

export function registerGetCommand(executionLog: Command): void {
  executionLog
    .command("get <logId>")
    .description("Get a specific execution log by its ID")
    .action(async (logId: string) => {
      const apiKey = await requireApiKey();
      printInfo(`Fetching execution log with ID: ${logId}...`);

      try {
        const client = getSdkClient(apiKey);
        const result = await client.executionLogs.get(logId);
        printJson(result);
      } catch (e) {
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message || String(e) : String(e));
      }
    });
}
