import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import type { EvaluatorUpdateParams } from "@root-signals/scorable";

export function registerUpdateCommand(evaluator: Command): void {
  evaluator
    .command("update <evaluatorId>")
    .description("Update an existing evaluator (PATCH)")
    .option("--name <name>", "The new name for the evaluator")
    .option("--scoring-criteria <text>", "The new scoring criteria (prompt text)")
    .option("--models <json>", "JSON array of model names. E.g., '[\"gpt-4\"]'")
    .option("--objective-id <id>", "The new objective ID")
    .option("--objective-version-id <id>", "The new objective version ID")
    .action(
      async (
        evaluatorId: string,
        opts: {
          name?: string;
          scoringCriteria?: string;
          models?: string;
          objectiveId?: string;
          objectiveVersionId?: string;
        },
      ) => {
        const apiKey = await requireApiKey();

        const payload: EvaluatorUpdateParams = {};
        if (opts.name !== undefined) payload.name = opts.name;
        if (opts.scoringCriteria !== undefined) payload.prompt = opts.scoringCriteria;
        if (opts.objectiveId !== undefined) payload.objective_id = opts.objectiveId;
        if (opts.objectiveVersionId !== undefined)
          payload.objective_version_id = opts.objectiveVersionId;

        if (opts.models !== undefined) {
          try {
            payload.models = JSON.parse(opts.models) as string[];
          } catch {
            printError("Invalid JSON format for --models.");
            return;
          }
        }

        if (Object.keys(payload).length === 0) {
          printInfo("No update parameters provided. Aborting.");
          return;
        }

        const spinner = ora("Updating...").start();
        try {
          const client = getSdkClient(apiKey);
          const result = await client.evaluators.update(evaluatorId, payload);
          spinner.stop();
          printSuccess(`Evaluator ${evaluatorId} updated successfully!`);
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
