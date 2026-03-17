import { Command } from "commander";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess } from "../../output.js";
import { CliError } from "../../types.js";

export function registerDeleteCommand(judge: Command): void {
  judge
    .command("delete <judgeId>")
    .description("Delete a judge by its ID")
    .option("--yes", "Skip confirmation prompt")
    .action(async (judgeId: string, opts: { yes?: boolean }) => {
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
          message: "Are you sure you want to delete this judge?",
          default: false,
        });
        if (!ok) {
          throw new CliError(1, "Aborted");
        }
      }

      printInfo(`Deleting judge ${judgeId}...`);

      try {
        const client = getSdkClient(apiKey);
        await client.judges.delete(judgeId);
        printSuccess(`Judge ${judgeId} deleted successfully.`);
      } catch (e) {
        if (e instanceof CliError) throw e;
        throw new CliError(1, e instanceof Error ? e.message : String(e));
      }
    });
}
