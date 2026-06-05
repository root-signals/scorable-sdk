import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, handleSdkError } from "../../output.js";
import { CliError } from "../../types.js";

export function registerDeleteCommand(project: Command): void {
  project
    .command("delete <projectId>")
    .description("Delete a project by its ID")
    .option("--yes", "Skip confirmation prompt")
    .action(async (projectId: string, opts: { yes?: boolean }) => {
      const apiKey = await requireApiKey();

      if (!opts.yes) {
        if (!process.stdin.isTTY || !process.stdout.isTTY) {
          throw new CliError(
            1,
            "Refusing to prompt for confirmation in a non-interactive environment. Pass --yes to skip the prompt.",
          );
        }
        const { confirm } = await import("@inquirer/prompts");
        const ok = await confirm({
          message: "Are you sure you want to delete this project?",
          default: false,
        });
        if (!ok) {
          throw new CliError(1, "Aborted");
        }
      }

      const spinner = ora("Deleting...").start();
      try {
        const client = getSdkClient(apiKey);
        await client.projects.delete(projectId);
        spinner.stop();
        printSuccess(`Project ${projectId} deleted successfully.`);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });
}
