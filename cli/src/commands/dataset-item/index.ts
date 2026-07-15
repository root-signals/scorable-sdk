import { Command } from "commander";
import ora from "ora";
import { z } from "zod";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import { parseJsonArg } from "../../utils.js";
import type { DatasetItemRequest, PatchedDatasetItemRequest } from "@root-signals/scorable";

export function registerDatasetItemCommands(program: Command): void {
  const item = new Command("dataset-item").description("Dataset item commands");

  item
    .command("add <datasetId>")
    .description("Add a single item to a dataset")
    .requiredOption("--response <text>", "The response text")
    .option("--request <text>", "The request/prompt text")
    .option("--expected-output <text>", "The expected output")
    .option("--metadata <json>", "Metadata JSON object")
    .option("--change-note <text>", "Change note for this version")
    .action(
      async (
        datasetId: string,
        opts: {
          response: string;
          request?: string;
          expectedOutput?: string;
          metadata?: string;
          changeNote?: string;
        },
      ) => {
        const body: DatasetItemRequest = { response: opts.response };
        if (opts.request !== undefined) body.request = opts.request;
        if (opts.expectedOutput !== undefined) body.expected_output = opts.expectedOutput;
        if (opts.changeNote !== undefined) body.change_note = opts.changeNote;
        if (opts.metadata !== undefined) {
          const r = parseJsonArg(opts.metadata, z.record(z.string(), z.unknown()));
          if (!r.ok) {
            printError("Invalid JSON for --metadata. Expected an object.");
            return;
          }
          body.metadata = r.value;
        }

        const spinner = ora("Adding item...").start();
        try {
          const client = getSdkClient(await requireApiKey());
          const result = await client.datasets.addItem(datasetId, body);
          spinner.stop();
          printSuccess("Dataset item added!");
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );

  item
    .command("add-bulk <datasetId>")
    .description("Bulk add items to a dataset (at most 5000)")
    .requiredOption("--items <json>", "JSON array of item objects")
    .action(async (datasetId: string, opts: { items: string }) => {
      const r = parseJsonArg(opts.items, z.array(z.record(z.string(), z.unknown())));
      if (!r.ok) {
        printError("Invalid JSON for --items. Expected an array of item objects.");
        return;
      }
      const spinner = ora("Bulk adding items...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        const result = await client.datasets.addItems(datasetId, r.value as DatasetItemRequest[]);
        spinner.stop();
        printSuccess(`Added ${result.length} dataset items.`);
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  item
    .command("list <datasetId>")
    .description("List the latest-version items of a dataset (with embedded annotations)")
    .option("--include-archived", "Include archived items", false)
    .action(async (datasetId: string, opts: { includeArchived?: boolean }) => {
      const spinner = ora("Listing items...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        const result = await client.datasets.listItems(datasetId, {
          includeArchived: opts.includeArchived ?? false,
        });
        spinner.stop();
        printJson(result.results);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  item
    .command("get <datasetId> <itemId>")
    .description("Get a single dataset item")
    .action(async (datasetId: string, itemId: string) => {
      const spinner = ora("Fetching item...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        const result = await client.datasets.getItem(datasetId, itemId);
        spinner.stop();
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  item
    .command("update <datasetId> <itemId>")
    .description("Edit a dataset item (creates a new version)")
    .option("--response <text>", "The response text")
    .option("--request <text>", "The request/prompt text")
    .option("--expected-output <text>", "The expected output")
    .option("--metadata <json>", "Metadata JSON object")
    .option("--change-note <text>", "Change note for this version")
    .action(
      async (
        datasetId: string,
        itemId: string,
        opts: {
          response?: string;
          request?: string;
          expectedOutput?: string;
          metadata?: string;
          changeNote?: string;
        },
      ) => {
        const body: PatchedDatasetItemRequest = {};
        if (opts.response !== undefined) body.response = opts.response;
        if (opts.request !== undefined) body.request = opts.request;
        if (opts.expectedOutput !== undefined) body.expected_output = opts.expectedOutput;
        if (opts.changeNote !== undefined) body.change_note = opts.changeNote;
        if (opts.metadata !== undefined) {
          const r = parseJsonArg(opts.metadata, z.record(z.string(), z.unknown()));
          if (!r.ok) {
            printError("Invalid JSON for --metadata. Expected an object.");
            return;
          }
          body.metadata = r.value;
        }

        const spinner = ora("Updating item...").start();
        try {
          const client = getSdkClient(await requireApiKey());
          const result = await client.datasets.updateItem(datasetId, itemId, body);
          spinner.stop();
          printSuccess("Dataset item updated!");
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );

  item
    .command("archive <datasetId> <itemId>")
    .description("Archive (soft-delete) a dataset item")
    .action(async (datasetId: string, itemId: string) => {
      const spinner = ora("Archiving item...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        await client.datasets.archiveItem(datasetId, itemId);
        spinner.stop();
        printSuccess(`Dataset item ${itemId} archived.`);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  program.addCommand(item);
}
