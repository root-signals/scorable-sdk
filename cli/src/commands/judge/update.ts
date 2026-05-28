import { Command } from "commander";
import ora from "ora";
import { z } from "zod";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { parseJsonArg } from "../../utils.js";
import type { UpdateJudgeData } from "@root-signals/scorable";

const EvaluatorRefsSchema = z.array(z.object({ id: z.string() }).passthrough());

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
          const r = parseJsonArg(opts.evaluatorReferences, EvaluatorRefsSchema);
          if (!r.ok) {
            printError(
              'Invalid JSON format for --evaluator-references. Expected an array of objects with an "id" string.',
            );
            return;
          }
          payload.evaluator_references = r.value;
        }

        if (Object.keys(payload).length === 0) {
          printInfo("No update parameters provided. Aborting.");
          return;
        }

        const spinner = ora("Updating...").start();
        try {
          const client = getSdkClient(apiKey);
          const result = await client.judges.update(judgeId, payload);
          spinner.stop();
          printSuccess(`Judge ${judgeId} updated successfully!`);
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
