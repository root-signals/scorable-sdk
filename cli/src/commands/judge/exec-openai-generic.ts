import { Command } from "commander";
import { z } from "zod";
import { requireApiKey } from "../../auth.js";
import {
  printInfo,
  printSuccess,
  printError,
  printWarning,
  printJson,
  handleSdkError,
} from "../../output.js";
import { parseJsonArg } from "../../utils.js";
import { apiRequest } from "../../client.js";

const MessagesSchema = z.array(z.object({ role: z.string() }).passthrough());
const ExtraBodySchema = z.record(z.string(), z.unknown());

export function registerExecOpenaiGenericCommand(judge: Command): void {
  judge
    .command("exec-openai-generic")
    .description("Execute a judge via the generic OpenAI API (judge is in the 'model' field)")
    .requiredOption("--model <model>", "Judge ID (or name) to use as the 'model' field")
    .requiredOption("--messages <json>", "JSON string of the messages payload")
    .option("--extra-body <json>", "Optional JSON string for extra_body parameters")
    .action(async (opts: { model: string; messages: string; extraBody?: string }) => {
      const apiKey = await requireApiKey();

      const messagesResult = parseJsonArg(opts.messages, MessagesSchema);
      if (!messagesResult.ok) {
        printError(
          "Invalid JSON for --messages. Expected an array of objects each with a string `role`. Aborting.",
        );
        return;
      }

      const payload: Record<string, unknown> = {
        model: opts.model,
        messages: messagesResult.value,
      };

      if (opts.extraBody) {
        const extraResult = parseJsonArg(opts.extraBody, ExtraBodySchema);
        if (extraResult.ok) {
          payload["extra_body"] = extraResult.value;
        } else {
          printWarning("Invalid JSON for --extra-body (expected an object). Skipping.");
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
        handleSdkError(e);
      }
    });
}
