import { Command } from "commander";
import ora from "ora";
import { requireApiKey, getSdkClient } from "../../auth.js";
import { printSuccess, printError, printJson, handleSdkError } from "../../output.js";
import type { CreateAnnotationData, AnnotationListParams } from "@root-signals/scorable";

export function registerAnnotationCommands(program: Command): void {
  const annotation = new Command("annotation").description("Annotation (labelling) commands");

  annotation
    .command("create")
    .description("Create an annotation on a dataset item or execution log")
    .option(
      "--dataset-item-id <id>",
      "Dataset item to annotate (mutually exclusive with --execution-log-id)",
    )
    .option(
      "--execution-log-id <id>",
      "Execution log to annotate (mutually exclusive with --dataset-item-id)",
    )
    .option("--value <number>", "Score for continuous configs", parseFloat)
    .option("--category <label>", "Label for binary/categorical configs")
    .option("--rationale <text>", "Optional free-text justification")
    .option("--status <status>", "draft or published (default published)")
    .option(
      "--score-config-id <id>",
      "Score config; defaults to the global identity 'Score' config",
    )
    .action(
      async (opts: {
        datasetItemId?: string;
        executionLogId?: string;
        value?: number;
        category?: string;
        rationale?: string;
        status?: string;
        scoreConfigId?: string;
      }) => {
        if (!opts.datasetItemId === !opts.executionLogId) {
          printError("Exactly one of --dataset-item-id or --execution-log-id must be provided.");
          return;
        }
        const payload: CreateAnnotationData = {};
        if (opts.datasetItemId) payload.datasetItemId = opts.datasetItemId;
        if (opts.executionLogId) payload.executionLogId = opts.executionLogId;
        if (opts.value !== undefined) payload.value = opts.value;
        if (opts.category !== undefined) payload.category = opts.category;
        if (opts.rationale !== undefined) payload.rationale = opts.rationale;
        if (opts.status !== undefined)
          payload.status = opts.status as CreateAnnotationData["status"];
        if (opts.scoreConfigId) payload.scoreConfigId = opts.scoreConfigId;

        const spinner = ora("Creating annotation...").start();
        try {
          const client = getSdkClient(await requireApiKey());
          const result = await client.annotations.create(payload);
          spinner.stop();
          printSuccess("Annotation created!");
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );

  annotation
    .command("list")
    .description("List annotations")
    .option("--dataset <id>", "Filter by the dataset the annotated items belong to")
    .option("--score-config <id>", "Filter by score config id")
    .option("--status <status>", "Filter by draft or published")
    .option("--dataset-item <id>", "Filter by dataset item id")
    .option("--execution-log <id>", "Filter by execution log id")
    .action(
      async (opts: {
        dataset?: string;
        scoreConfig?: string;
        status?: string;
        datasetItem?: string;
        executionLog?: string;
      }) => {
        const params: AnnotationListParams = {};
        if (opts.dataset) params.dataset = opts.dataset;
        if (opts.scoreConfig) params.score_config = opts.scoreConfig;
        if (opts.status) params.status = opts.status as AnnotationListParams["status"];
        if (opts.datasetItem) params.dataset_item = opts.datasetItem;
        if (opts.executionLog) params.execution_log = opts.executionLog;

        const spinner = ora("Listing annotations...").start();
        try {
          const client = getSdkClient(await requireApiKey());
          const result = await client.annotations.list(params);
          spinner.stop();
          printJson(result.results);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );

  annotation
    .command("get <id>")
    .description("Get an annotation by ID")
    .action(async (id: string) => {
      const spinner = ora("Fetching annotation...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        const result = await client.annotations.get(id);
        spinner.stop();
        printJson(result);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  annotation
    .command("update <id>")
    .description("Update an annotation (target is immutable)")
    .option("--value <number>", "New score for continuous configs", parseFloat)
    .option("--category <label>", "New label for binary/categorical configs")
    .option("--rationale <text>", "New rationale")
    .option("--status <status>", "draft or published")
    .action(
      async (
        id: string,
        opts: { value?: number; category?: string; rationale?: string; status?: string },
      ) => {
        const payload: Parameters<ReturnType<typeof getSdkClient>["annotations"]["update"]>[1] = {};
        if (opts.value !== undefined) payload.value = opts.value;
        if (opts.category !== undefined) payload.category = opts.category;
        if (opts.rationale !== undefined) payload.rationale = opts.rationale;
        if (opts.status !== undefined) payload.status = opts.status as typeof payload.status;

        const spinner = ora("Updating annotation...").start();
        try {
          const client = getSdkClient(await requireApiKey());
          const result = await client.annotations.update(id, payload);
          spinner.stop();
          printSuccess("Annotation updated!");
          printJson(result);
        } catch (e) {
          spinner.stop();
          handleSdkError(e);
        }
      },
    );

  annotation
    .command("delete <id>")
    .description("Delete an annotation")
    .action(async (id: string) => {
      const spinner = ora("Deleting annotation...").start();
      try {
        const client = getSdkClient(await requireApiKey());
        await client.annotations.delete(id);
        spinner.stop();
        printSuccess(`Annotation ${id} deleted.`);
      } catch (e) {
        spinner.stop();
        handleSdkError(e);
      }
    });

  program.addCommand(annotation);
}
