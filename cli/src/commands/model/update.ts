import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printInfo, printSuccess, printJson, handleSdkError } from "../../output.js";
import type { UpdateModelData } from "@root-signals/scorable";

async function readKeyFromStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString().trim();
}

export function registerUpdateCommand(model: Command): void {
  model
    .command("update <modelId>")
    .description("Update an existing model (PATCH — only provided fields are sent)")
    .option("--name <name>", "New model name")
    .option("--model <model>", "Underlying model identifier")
    .option("--url <url>", "API base URL")
    .option(
      "--key <value>",
      "Provider API key. Pass '-' to read the key from stdin (avoids shell history leak)",
    )
    .option("--max-token-count <number>", "Maximum total tokens", parseInt)
    .option("--max-output-token-count <number>", "Maximum output tokens", parseInt)
    .action(
      async (
        modelId: string,
        opts: {
          name?: string;
          model?: string;
          url?: string;
          key?: string;
          maxTokenCount?: number;
          maxOutputTokenCount?: number;
        },
      ) => {
        const apiKey = await requireApiKey();

        const payload: Partial<UpdateModelData> = {};
        if (opts.name !== undefined) payload.name = opts.name;
        if (opts.model !== undefined) payload.model = opts.model;
        if (opts.url !== undefined) payload.url = opts.url;
        if (opts.maxTokenCount !== undefined) payload.max_token_count = opts.maxTokenCount;
        if (opts.maxOutputTokenCount !== undefined) {
          payload.max_output_token_count = opts.maxOutputTokenCount;
        }
        if (opts.key !== undefined) {
          payload.default_key = opts.key === "-" ? await readKeyFromStdin() : opts.key;
        }

        if (Object.keys(payload).length === 0) {
          printInfo("No update parameters provided. Aborting.");
          return;
        }

        const spinner = ora("Updating...").start();
        try {
          const client = getSdkClient(apiKey);
          const result = await client.models.patch(modelId, payload);
          spinner.stop();
          printSuccess(`Model ${modelId} updated successfully!`);
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );
}
