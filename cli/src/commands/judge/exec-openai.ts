import { Command } from "commander";
import { requireApiKey } from "../../auth.js";
import {
  printInfo,
  printSuccess,
  printError,
  printWarning,
  printJson,
  handleSdkError,
} from "../../output.js";
import { apiRequest } from "../../client.js";

export function registerExecOpenaiCommand(judge: Command): void {
  judge
    .command("exec-openai <judgeIdInPath>")
    .description("Execute a specific judge via the OpenAI compatible API")
    .requiredOption("--model <model>", "LLM model for judge execution (e.g., gpt-4o)")
    .requiredOption("--messages <json>", "JSON string of the messages payload")
    .option("--extra-body <json>", "Optional JSON string for extra_body parameters")
    .action(
      async (
        judgeIdInPath: string,
        opts: { model: string; messages: string; extraBody?: string },
      ) => {
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
