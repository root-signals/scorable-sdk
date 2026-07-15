import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";
import type { CreateCalibrationRunData } from "@root-signals/scorable";

export function registerCalibrationRunCommands(program: Command): void {
  const run = new Command("calibration-run").description("Calibration run commands");

  run
    .command("create")
    .description("Start a calibration run against a labelled dataset")
    .requiredOption("--evaluator-id <id>", "The saved evaluator to calibrate")
    .requiredOption("--dataset-id <id>", "Dataset whose published annotations to calibrate against")
    .option("--score-config-id <id>", "Score config (defaults to the dataset's continuous scores)")
    .action(async (opts: { evaluatorId: string; datasetId: string; scoreConfigId?: string }) => {
      const payload: CreateCalibrationRunData = {
        evaluatorId: opts.evaluatorId,
        datasetId: opts.datasetId,
      };
      if (opts.scoreConfigId) payload.scoreConfigId = opts.scoreConfigId;

      const spinner = ora("Starting calibration run...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        const result = await client.calibrationRuns.create(payload);
        spinner.stop();
        printSuccess(`Calibration run ${result.id} started (status: ${result.status}).`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  run
    .command("get <id>")
    .description("Get a calibration run (poll for status and metrics)")
    .action(async (id: string) => {
      const spinner = ora("Fetching calibration run...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        const result = await client.calibrationRuns.get(id);
        spinner.stop();
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  run
    .command("list")
    .description("List calibration runs")
    .option("--evaluator-id <id>", "Filter by evaluator external id")
    .action(async (opts: { evaluatorId?: string }) => {
      const spinner = ora("Listing calibration runs...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        const result = await client.calibrationRuns.list(
          opts.evaluatorId ? { evaluatorId: opts.evaluatorId } : {},
        );
        spinner.stop();
        printJson(result.results);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  run
    .command("items <id>")
    .description("List the per-example results of a calibration run")
    .action(async (id: string) => {
      const spinner = ora("Fetching calibration run items...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        const result = await client.calibrationRuns.listItems(id);
        spinner.stop();
        printJson(result.results);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  program.addCommand(run);
}
