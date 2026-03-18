import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, handleSdkError } from "../../output.js";
import { CliError } from "../../types.js";

export function registerDeleteCommand(evaluator: Command): void {
  evaluator
    .command("delete <evaluatorId>")
    .description("Delete an evaluator by its ID")
    .option("--yes", "Skip confirmation prompt")
    .action(async (evaluatorId: string, opts: { yes?: boolean }) => {
      const apiKey = await requireApiKey();

      if (!opts.yes) {
        if (!process.stdin.isTTY && !process.stdout.isTTY) {
          throw new CliError(
            1,
            "Refusing to prompt for confirmation in a non-interactive environment. Pass --yes to skip the prompt.",
          );
        }
        const { confirm } = await import("@inquirer/prompts");
        const ok = await confirm({
          message: "Are you sure you want to delete this evaluator?",
          default: false,
        });
        if (!ok) {
          throw new CliError(1, "Aborted");
        }
      }

      const spinner = ora("Deleting...").start();
      try {
        const client = getSdkClient(apiKey);
        await client.evaluators.delete(evaluatorId);
        spinner.stop();
        printSuccess(`Evaluator ${evaluatorId} deleted successfully.`);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
