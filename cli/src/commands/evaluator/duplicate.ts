import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printJson, handleSdkError } from "../../output.js";
import { resolveProjectIdValue, PROJECT_ID_FLAG_DESC } from "../../lib/project-id.js";

export function registerDuplicateCommand(evaluator: Command): void {
  evaluator
    .command("duplicate <evaluatorId>")
    .description("Duplicate an existing evaluator")
    .option("--project-id <uuid>", PROJECT_ID_FLAG_DESC)
    .action(async (evaluatorId: string, opts: { projectId?: string }) => {
      const apiKey = await requireApiKey();
      const spinner = ora("Duplicating...").start();
      try {
        const client = getSdkClient(apiKey);
        const projectId = resolveProjectIdValue(opts.projectId);
        const result = await client.evaluators.duplicate(
          evaluatorId,
          projectId !== undefined ? { projectId } : {},
        );
        spinner.stop();
        printSuccess(`Evaluator ${evaluatorId} duplicated successfully!`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
