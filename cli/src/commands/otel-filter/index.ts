import { Command } from "commander";
import { registerCreateCommand } from "./create.js";
import { registerListCommand } from "./list.js";
import { registerDeleteCommand } from "./delete.js";

export function registerOtelFilterCommands(program: Command): void {
  const otelFilter = program
    .command("otel-filter")
    .description("Manage OTEL trace evaluation filters");

  registerCreateCommand(otelFilter);
  registerListCommand(otelFilter);
  registerDeleteCommand(otelFilter);
}
