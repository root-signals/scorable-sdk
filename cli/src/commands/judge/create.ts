import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import type { CreateJudgeData } from "@root-signals/scorable";

export function registerCreateCommand(judge: Command): void {
  judge
    .command("create")
    .description("Create a new judge")
    .requiredOption("--name <name>", "The name for the new judge")
    .requiredOption("--intent <intent>", "The intent for the new judge")
    .option("--stage <stage>", "The stage for the new judge")
    .option(
      "--evaluator-references <json>",
      'JSON string for evaluator references. E.g., \'[{"id": "eval-id"}]\'',
    )
    .action(
      async (opts: {
        name: string;
        intent: string;
        stage?: string;
        evaluatorReferences?: string;
      }) => {
        const apiKey = await requireApiKey();

        const payload: CreateJudgeData = { name: opts.name, intent: opts.intent };
        if (opts.stage) payload.stage = opts.stage;

        if (opts.evaluatorReferences) {
          try {
            payload.evaluator_references = JSON.parse(opts.evaluatorReferences) as Array<{
              id: string;
            }>;
          } catch {
            printError("Invalid JSON format for --evaluator-references.");
            return;
          }
        }

        printInfo("Attempting to create judge with payload:");
        printJson(payload);

        try {
          const client = getSdkClient(apiKey);
          const result = await client.judges.create(payload);
          printSuccess("Judge created successfully!");
          printJson(result);
        } catch (e) {
          handleSdkError(e);
        }
      },
    );
}
