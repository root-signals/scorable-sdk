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

export function registerExecOpenaiCommand(judge: Command): void {
  judge
    .command("exec-openai <judgeIdInPath>")
    .description("Execute a specific judge via the OpenAI compatible API")
    .requiredOption("--model <model>", "LLM model for judge execution (e.g., gpt-5.5)")
    .requiredOption("--messages <json>", "JSON string of the messages payload")
    .option("--extra-body <json>", "Optional JSON string for extra_body parameters")
    .action(
      async (
        judgeIdInPath: string,
        opts: { model: string; messages: string; extraBody?: string },
      ) => {
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

        printInfo(
          `Executing Judge ID (via path): ${judgeIdInPath} using OpenAI chat completions format.`,
        );
        printInfo("Attempting to execute with OpenAI compatible payload:");
        printJson(payload);

        try {
          const result = await apiRequest(
            "POST",
            `judges/${judgeIdInPath}/openai/chat/completions`,
            {
              payload,
              apiKey,
            },
          );
          if (result) {
            printSuccess("OpenAI compatible execution successful!");
            printJson(result);
          }
        } catch (e) {
          handleSdkError(e);
        }
      },
    );
}
