import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import type { EvaluatorCreateParams } from "@root-signals/scorable";

export function registerCreateCommand(evaluator: Command): void {
  evaluator
    .command("create")
    .description("Create a new evaluator")
    .requiredOption("--name <name>", "The name for the new evaluator")
    .requiredOption(
      "--scoring-criteria <text>",
      "The scoring criteria prompt. Must contain {{ request }} and/or {{ response }} as placeholders.",
    )
    .option(
      "--intent <intent>",
      "The intent for the evaluator (mutually exclusive with --objective-id)",
    )
    .option("--objective-id <id>", "Objective ID (mutually exclusive with --intent)")
    .option(
      "--models <json>",
      "JSON array of model names, in priority order. E.g., '[\"gpt-5-mini\"]'",
    )
    .option("--overwrite", "Overwrite if evaluator with same name exists")
    .option("--objective-version-id <id>", "Objective version ID")
    .action(
      async (opts: {
        name: string;
        scoringCriteria: string;
        intent?: string;
        objectiveId?: string;
        models?: string;
        overwrite?: boolean;
        objectiveVersionId?: string;
      }) => {
        if (!opts.intent && !opts.objectiveId) {
          printError("Either --intent or --objective-id is required.");
          return;
        }

        if (
          !/\{\{\s*request\s*\}\}/.test(opts.scoringCriteria) &&
          !/\{\{\s*response\s*\}\}/.test(opts.scoringCriteria)
        ) {
          printError(
            "The --scoring-criteria must contain at least one of {{ request }} or {{ response }} as a placeholder.\n" +
              'Example: "Does the {{ response }} directly answer the user\'s question?"',
          );
          return;
        }

        const payload: EvaluatorCreateParams = {
          name: opts.name,
          predicate: opts.scoringCriteria,
        };

        if (opts.intent) payload.intent = opts.intent;
        if (opts.objectiveId) payload.objective_id = opts.objectiveId;
        if (opts.overwrite !== undefined) payload.overwrite = opts.overwrite;
        if (opts.objectiveVersionId) payload.objective_version_id = opts.objectiveVersionId;

        if (opts.models) {
          try {
            payload.models = JSON.parse(opts.models) as string[];
          } catch {
            printError("Invalid JSON format for --models.");
            return;
          }
        }

        const spinner = ora("Creating...").start();
        try {
          const apiKey = await requireApiKey();
          const client = getSdkClient(apiKey);
          const result = await client.evaluators.create(payload);
          spinner.stop();
          printSuccess("Evaluator created successfully!");
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
