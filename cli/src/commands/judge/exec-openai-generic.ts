import { Command } from "commander";
import { requireApiKey } from "../../auth.js";
import { printInfo, printSuccess, printError, printWarning, printJson } from "../../output.js";
import { CliError } from "../../types.js";
import { apiRequest } from "../../client.js";

export function registerExecOpenaiGenericCommand(judge: Command): void {
  judge
    .command("exec-openai-generic")
    .description("Execute a judge via the generic OpenAI API (judge is in the 'model' field)")
    .requiredOption("--model <model>", "Judge ID (or name) to use as the 'model' field")
    .requiredOption("--messages <json>", "JSON string of the messages payload")
    .option("--extra-body <json>", "Optional JSON string for extra_body parameters")
    .action(async (opts: { model: string; messages: string; extraBody?: string }) => {
      const apiKey = await requireApiKey();

      let messages: unknown;
      try {
        messages = JSON.parse(opts.messages);
      } catch {
        printError("Invalid JSON for --messages. Aborting.");
        return;
      }

      const payload: Record<string, unknown> = { model: opts.model, messages };

      if (opts.extraBody) {
        try {
          payload["extra_body"] = JSON.parse(opts.extraBody);
        } catch {
          printWarning("Invalid JSON for --extra-body. Skipping.");
        }
      }

      printInfo(`Executing a Judge using generic OpenAI endpoint. Judge ID/Name: ${opts.model}`);
      printInfo("Attempting to execute with OpenAI compatible payload:");
      printJson(payload);

      try {
        const result = await apiRequest("POST", "judges/openai/chat/completions", {
          payload,
          apiKey,
        });
        if (result) {
          printSuccess("OpenAI compatible execution successful!");
          printJson(result);
        }
      } catch (e) {
        if (e instanceof CliError) throw e;
        printError(e instanceof Error ? e.message : String(e));
      }
    });
}
