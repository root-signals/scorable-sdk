import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import type { UpdateJudgeData } from "@root-signals/scorable";

export function registerUpdateCommand(judge: Command): void {
  judge
    .command("update <judgeId>")
    .description("Update an existing judge (PATCH)")
    .option("--name <name>", "The new name for the judge")
    .option("--stage <stage>", "The new stage for the judge")
    .option(
      "--evaluator-references <json>",
      'JSON string to update evaluator references. Use "[]" to clear.',
    )
    .action(
      async (
        judgeId: string,
        opts: { name?: string; stage?: string; evaluatorReferences?: string },
      ) => {
        const apiKey = await requireApiKey();

        const payload: UpdateJudgeData = {};
        if (opts.name !== undefined) payload.name = opts.name;
        if (opts.stage !== undefined) payload.stage = opts.stage;

        if (opts.evaluatorReferences !== undefined) {
          try {
            payload.evaluator_references = JSON.parse(opts.evaluatorReferences) as Array<{
              id: string;
            }>;
          } catch {
            printError("Invalid JSON format for --evaluator-references.");
            return;
          }
        }

        if (Object.keys(payload).length === 0) {
          printInfo("No update parameters provided. Aborting.");
          return;
        }

        printInfo(`Attempting to update judge ${judgeId} with PATCH payload:`);
        printJson(payload);

        try {
          const client = getSdkClient(apiKey);
          const result = await client.judges.update(judgeId, payload);
          printSuccess(`Judge ${judgeId} updated successfully!`);
          printJson(result);
        } catch (e) {
          handleSdkError(e);
        }
      },
    );
}
