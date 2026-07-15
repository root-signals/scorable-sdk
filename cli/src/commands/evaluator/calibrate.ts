import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";

export function registerCalibrateCommand(evaluator: Command): void {
  evaluator
    .command("calibrate <evaluatorId>")
    .description("Start a calibration run for a saved evaluator against a labelled dataset")
    .requiredOption("--dataset-id <id>", "Dataset whose published annotations to calibrate against")
    .option(
      "--score-config-id <id>",
      "Score config to calibrate against (defaults to the dataset's continuous scores)",
    )
    .action(async (evaluatorId: string, opts: { datasetId: string; scoreConfigId?: string }) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Starting calibration run...").start();
      try {
        const client = getSdkClient(apiKey);
        const run = await client.evaluators.calibrateRun(evaluatorId, {
          datasetId: opts.datasetId,
          ...(opts.scoreConfigId !== undefined ? { scoreConfigId: opts.scoreConfigId } : {}),
        });
        spinner.stop();
        printSuccess(
          `Calibration run ${run.id} started (status: ${run.status}). ` +
            `Poll 'scorable calibration-run get ${run.id}' for metrics.`,
        );
        printJson(run);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
