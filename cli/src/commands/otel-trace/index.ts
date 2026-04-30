import { Command } from "commander";
import { registerListCommand } from "./list.js";
import { registerSpansCommand } from "./spans.js";

export function registerOtelTraceCommands(program: Command): void {
  const otelTrace = program
    .command("otel-trace")
    .description("Query OTEL traces ingested by Scorable");

  registerListCommand(otelTrace);
  registerSpansCommand(otelTrace);
}
