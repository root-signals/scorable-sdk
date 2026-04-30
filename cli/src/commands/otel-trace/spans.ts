import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import Table from "cli-table3";
import { requireApiKey } from "../../auth.js";
import { apiRequest } from "../../client.js";
import { printJson, printMessage, handleSdkError } from "../../output.js";
import { parseOutputFormat, toCsv } from "./shared.js";

interface SpanRow {
  trace_id: string;
  span_id: string;
  parent_span_id: string;
  timestamp: string;
  span: {
    name?: string;
    kind?: number;
    has_error?: boolean;
    status?: { code?: number };
    [key: string]: unknown;
  };
}

const UNICODE_CHARS = {
  top: "─",
  "top-mid": "┬",
  "top-left": "┌",
  "top-right": "┐",
  bottom: "─",
  "bottom-mid": "┴",
  "bottom-left": "└",
  "bottom-right": "┘",
  left: "│",
  "left-mid": "├",
  mid: "─",
  "mid-mid": "┼",
  right: "│",
  "right-mid": "┤",
  middle: "│",
};

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function printSpanTable(spans: SpanRow[]): void {
  const table = new Table({
    head: ["Span ID", "Parent", "Name", "Error", "Timestamp"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [18, 18, 38, 7, 22],
    wordWrap: true,
  });

  for (const s of spans) {
    const ts = (s.timestamp ?? "").slice(0, 19).replace("T", " ");
    const parent = s.parent_span_id || chalk.dim("(root)");
    const errorMark = s.span?.has_error ? chalk.red("✖") : "";
    table.push([s.span_id, parent, truncate(s.span?.name ?? "", 36), errorMark, ts]);
  }
  console.log(table.toString());
}

function printSpanCsv(spans: SpanRow[]): void {
  const headers = [
    "span_id",
    "parent_span_id",
    "name",
    "kind",
    "has_error",
    "status_code",
    "timestamp",
  ];
  const rows = spans.map((s) => [
    s.span_id,
    s.parent_span_id,
    s.span?.name ?? "",
    s.span?.kind ?? "",
    s.span?.has_error ?? "",
    s.span?.status?.code ?? "",
    s.timestamp,
  ]);
  process.stdout.write(toCsv(headers, rows));
}

export function registerSpansCommand(otelTrace: Command): void {
  otelTrace
    .command("spans <trace_id>")
    .description("List all spans for a given trace")
    .option("--output <format>", "Output format: table | json | csv", "table")
    .addHelpText(
      "after",
      `
Output formats
  table  Default. Pretty-printed columnar view: span_id, parent, name, error, timestamp.
  json   Full payload — including attributes, events, links, status, kind, resource_attributes.
         Use this for debugging or scripting.
  csv    Flattened columns: span_id, parent_span_id, name, kind, has_error, status_code, timestamp.
         Useful for spreadsheet analysis.

Examples
  # Tabular overview of all spans in a trace
  $ scorable otel-trace spans 7b6e5bd99494c4ee46fbfd39b194c499

  # Full span data for jq-piping
  $ scorable otel-trace spans 7b6e5bd99494c4ee46fbfd39b194c499 --output json | jq '.[0].span'

  # Inspect just the span attributes
  $ scorable otel-trace spans <trace_id> --output json | \\
      jq '.[].span | {name, attributes}'

  # Pull resource attributes (e.g. service.name) from the first span
  $ scorable otel-trace spans <trace_id> --output json | jq '.[0].span.resource_attributes'

  # CSV for a quick latency / error overview
  $ scorable otel-trace spans <trace_id> --output csv > spans.csv

Tip
  Find a trace_id first with \`scorable otel-trace list\`, then drill down here.`,
    )
    .action(async (traceId: string, opts: { output?: string }) => {
      let format;
      try {
        format = parseOutputFormat(opts.output);
      } catch (e) {
        handleSdkError(e);
      }

      const showSpinner = format === "table";
      const spinner = showSpinner ? ora(`Fetching spans for trace ${traceId}...`).start() : null;
      try {
        const apiKey = await requireApiKey();
        const result = (await apiRequest(
          "GET",
          `v1/otel/traces/${encodeURIComponent(traceId)}/spans`,
          { apiKey },
        )) as SpanRow[] | null;
        spinner?.stop();

        if (result === null) return;
        if (!Array.isArray(result)) {
          throw new Error("Unexpected spans response: expected an array.");
        }
        const spans = result;

        if (format === "json") {
          printJson(spans);
          return;
        }
        if (format === "csv") {
          printSpanCsv(spans);
          return;
        }

        if (spans.length === 0) {
          printMessage(`No spans found for trace ${traceId}.`);
          return;
        }
        printSpanTable(spans);
      } catch (e) {
        spinner?.stop();
        handleSdkError(e);
      }
    });
}
