import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import Table from "cli-table3";
import { requireApiKey } from "../../auth.js";
import { apiRequest } from "../../client.js";
import { printJson, printMessage, printInfo, handleSdkError } from "../../output.js";
import { buildTimeFilters, parseOutputFormat, resolveTimeWindow, toCsv } from "./shared.js";

interface TraceRecord {
  trace_id: string;
  root_span_name: string;
  first_span_at: string;
  last_span_at: string;
  span_count: number;
  input_preview: string;
  output_preview: string;
}

interface PaginatedTraces {
  next: string | null;
  previous: string | null;
  results: TraceRecord[];
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

function printTraceTable(traces: TraceRecord[]): void {
  const table = new Table({
    head: ["Trace ID", "Root Span", "Spans", "First Span"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [34, 42, 7, 22],
    wordWrap: true,
  });

  for (const t of traces) {
    const ts = (t.first_span_at ?? "").slice(0, 19).replace("T", " ");
    table.push([t.trace_id, truncate(t.root_span_name ?? "", 40), String(t.span_count), ts]);
  }
  console.log(table.toString());
}

function printTraceCsv(traces: TraceRecord[]): void {
  const headers = [
    "trace_id",
    "root_span_name",
    "span_count",
    "first_span_at",
    "last_span_at",
    "input_preview",
    "output_preview",
  ];
  const rows = traces.map((t) => [
    t.trace_id,
    t.root_span_name,
    t.span_count,
    t.first_span_at,
    t.last_span_at,
    t.input_preview,
    t.output_preview,
  ]);
  process.stdout.write(toCsv(headers, rows));
}

export function registerListCommand(otelTrace: Command): void {
  otelTrace
    .command("list")
    .description("List ingested OTEL traces, optionally filtered")
    .option(
      "--filter <expr>",
      "Filter expression (repeatable). Format: `column;type;key;operator;value`. See examples below.",
      (value: string, previous: string[] = []) => [...previous, value],
      [] as string[],
    )
    .option(
      "--since <duration>",
      "Only traces from the last <duration>. Forms: 30s, 5m, 2h, 7d. Mutually exclusive with --start-time/--end-time.",
    )
    .option(
      "--start-time <iso>",
      "Earliest first_span_at, inclusive (ISO 8601, e.g. 2026-04-30T00:00:00Z)",
    )
    .option("--end-time <iso>", "Latest first_span_at, exclusive (ISO 8601). Defaults to now.")
    .option("--service-name <name>", "Match resource.service.name (=). Shortcut for --filter.")
    .option(
      "--has-error",
      "Only traces where some span ended with status ERROR. Shortcut for --filter.",
    )
    .option("--root-name <substr>", "Substring match on the root span name. Shortcut for --filter.")
    .option("--span-name <substr>", "Substring match on any span's name. Shortcut for --filter.")
    .option("--agent-name <name>", "Match gen_ai.agent.name (=). Shortcut for --filter.")
    .option("--model <name>", "Match gen_ai.request.model (=). Shortcut for --filter.")
    .option("--tool <name>", "Match gen_ai.tool.name (=). Shortcut for --filter.")
    .option("--page-size <n>", "Number of traces per page", (v) => parseInt(v, 10), 25)
    .option("--cursor <cursor>", "Pagination cursor (from a previous `next` response)")
    .option("--output <format>", "Output format: table | json | csv", "table")
    .addHelpText(
      "after",
      `
Filtering — three layers, pick the lowest one that fits

  1. Convenience flags (covers ~80% of queries):
       --service-name <name>     resource.service.name = <name>
       --has-error               at least one span errored
       --root-name <substr>      root span name contains <substr>
       --span-name <substr>      any span name contains <substr>
       --agent-name <name>       gen_ai.agent.name = <name>
       --model <name>            gen_ai.request.model = <name>
       --tool <name>             gen_ai.tool.name = <name>
     All composable with each other and with --filter (AND-combined).

  2. Time-window shortcuts:
       --since 30s | 5m | 2h | 7d
       --start-time / --end-time  ISO 8601 (inclusive start, exclusive end)
     Mutually exclusive group; compile down to first_span_at filters.

  3. Raw --filter (full power, anything the matcher supports):
     One expression per --filter, repeatable, AND-combined.

Raw filter expression format
  column;type;key;operator;value

  column  - what to match against (see "Columns" below)
  type    - value type: string | number | boolean | datetime | stringOptions
  key     - same as column for built-ins; for sentinel columns
            (resource, attribute) this is the attribute name
  operator - one of: = != contains "starts with" "any of" "none of"
             > >= < <= (numeric and datetime)
  value   - the value to match. For "any of" / "none of",
            pipe-separate multiple values: ok|error|unset.
            For datetime, ISO 8601: 2026-04-30T00:00:00Z

Columns
  Trace-record level (per-trace metadata):
    name             root span name
    span_count       total spans in trace
    first_span_at    earliest span timestamp (datetime)
    last_span_at     latest span timestamp (datetime)
    input_preview    first input message snippet
    output_preview   final output snippet

  Span level (matches if any span in the trace satisfies):
    span_name        span name (e.g. "agent run", "execute_tool")
    has_error        boolean: span ended with status code ERROR
    kind             1=INTERNAL 2=SERVER 3=CLIENT 4=PRODUCER 5=CONSUMER
    status           OK | ERROR | UNSET (use "any of" / "none of")

  Sentinel columns (key carries the attribute name):
    resource         resource attribute, e.g. service.name
    <attribute-key>  any span attribute. If your instrumentation follows the
                     OpenTelemetry GenAI semantic conventions (pydantic-ai,
                     OpenLLMetry, Logfire, OpenAI/Anthropic SDKs with otel
                     all do), every documented attribute is filterable here
                     without extra setup. Common ones:

                       Request:    gen_ai.request.model
                                   gen_ai.request.temperature
                                   gen_ai.request.max_tokens
                       Response:   gen_ai.response.model
                                   gen_ai.response.finish_reasons
                       Agent/Op:   gen_ai.agent.name / .id / .version
                                   gen_ai.operation.name (chat|embeddings|...)
                                   gen_ai.workflow.name
                                   gen_ai.provider.name (openai|aws.bedrock|...)
                       Tools:      gen_ai.tool.name / .type / .call.id
                       Tracking:   gen_ai.conversation.id
                       Tokens:     gen_ai.usage.input_tokens
                                   gen_ai.usage.output_tokens
                                   gen_ai.usage.reasoning.output_tokens
                                   gen_ai.usage.cache_read.input_tokens

                     Full registry:
                       https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/

Examples — convenience flags (the common case)

  # All traces from a specific service, last hour
  $ scorable otel-trace list --since 1h --service-name my_agent

  # Errored traces in the last 24h, exported as CSV for spreadsheet analysis
  $ scorable otel-trace list --since 24h --has-error --output csv > errors.csv

  # All traces of a specific pydantic-ai agent on a specific model
  $ scorable otel-trace list --agent-name my_agent --model gpt-5-mini

  # Drill into traces that hit a specific tool
  $ scorable otel-trace list --since 7d --tool fetch_customer_data

  # Mix shortcuts and raw filter — they AND together
  $ scorable otel-trace list \\
      --service-name my_agent \\
      --filter 'gen_ai.usage.input_tokens;number;gen_ai.usage.input_tokens;>;1000'

Examples — raw --filter (when shortcuts don't fit)

  # Numeric comparison (no shortcut)
  $ scorable otel-trace list \\
      --filter 'gen_ai.usage.input_tokens;number;gen_ai.usage.input_tokens;>;1000'

  # "any of" semantics with pipe-separated values
  $ scorable otel-trace list \\
      --filter 'kind;stringOptions;kind;any of;3|5'

  # Multi-turn debugging — every trace in a single conversation
  $ scorable otel-trace list \\
      --filter 'gen_ai.conversation.id;string;gen_ai.conversation.id;=;conv_5j66'

  # Expensive runs — over 5k input tokens
  $ scorable otel-trace list --since 24h \\
      --filter 'gen_ai.usage.input_tokens;number;gen_ai.usage.input_tokens;>;5000'

  # Filter by provider — e.g. only Bedrock traffic
  $ scorable otel-trace list \\
      --filter 'gen_ai.provider.name;string;gen_ai.provider.name;=;aws.bedrock'

  # Specific time range (inclusive start, exclusive end)
  $ scorable otel-trace list \\
      --start-time 2026-04-30T00:00:00Z \\
      --end-time 2026-05-01T00:00:00Z

  # Pagination — pass the cursor returned in the next-page hint
  $ scorable otel-trace list --since 7d --cursor cD0yMDI2LTA0LTMwKzEx...

  # Pipe JSON to jq for ad-hoc analysis
  $ scorable otel-trace list --since 1h --output json | jq '.results[].trace_id'`,
    )
    .action(
      async (opts: {
        filter: string[];
        since?: string;
        startTime?: string;
        endTime?: string;
        serviceName?: string;
        hasError?: boolean;
        rootName?: string;
        spanName?: string;
        agentName?: string;
        model?: string;
        tool?: string;
        pageSize?: number;
        cursor?: string;
        output?: string;
      }) => {
        let format;
        let timeFilters: string[];
        try {
          format = parseOutputFormat(opts.output);
          const window = resolveTimeWindow({
            since: opts.since,
            startTime: opts.startTime,
            endTime: opts.endTime,
          });
          timeFilters = buildTimeFilters(window);
        } catch (e) {
          handleSdkError(e);
        }

        const shortcutFilters: string[] = [];
        if (opts.serviceName)
          shortcutFilters.push(`resource;string;service.name;=;${opts.serviceName}`);
        if (opts.hasError) shortcutFilters.push("has_error;boolean;has_error;=;true");
        if (opts.rootName) shortcutFilters.push(`name;string;name;contains;${opts.rootName}`);
        if (opts.spanName)
          shortcutFilters.push(`span_name;string;span_name;contains;${opts.spanName}`);
        if (opts.agentName)
          shortcutFilters.push(`gen_ai.agent.name;string;gen_ai.agent.name;=;${opts.agentName}`);
        if (opts.model)
          shortcutFilters.push(`gen_ai.request.model;string;gen_ai.request.model;=;${opts.model}`);
        if (opts.tool)
          shortcutFilters.push(`gen_ai.tool.name;string;gen_ai.tool.name;=;${opts.tool}`);

        const params: Record<string, unknown> = {};
        const allFilters = [...timeFilters, ...shortcutFilters, ...opts.filter];
        if (allFilters.length > 0) params.filters = allFilters.join(",");
        if (opts.pageSize !== undefined) params.page_size = opts.pageSize;
        if (opts.cursor) params.cursor = opts.cursor;

        const showSpinner = format === "table";
        const spinner = showSpinner ? ora("Fetching traces...").start() : null;
        try {
          const apiKey = await requireApiKey();
          const result = (await apiRequest("GET", "v1/otel/traces", {
            params,
            apiKey,
          })) as PaginatedTraces | null;
          spinner?.stop();
          if (!result) return;

          if (format === "json") {
            printJson(result);
            return;
          }
          if (format === "csv") {
            printTraceCsv(result.results ?? []);
            return;
          }

          if (!result.results || result.results.length === 0) {
            printMessage("No traces found.");
            return;
          }

          printTraceTable(result.results);

          if (result.next) {
            const cursor = new URL(result.next).searchParams.get("cursor");
            if (cursor) printInfo(`Next page available. Use --cursor "${cursor}"`);
          }
        } catch (e) {
          spinner?.stop();
          handleSdkError(e);
        }
      },
    );
}
