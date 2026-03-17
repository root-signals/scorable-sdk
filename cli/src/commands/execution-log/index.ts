import { Command } from "commander";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";

export function registerExecutionLogCommands(program: Command): void {
  const executionLog = new Command("execution-log").description("Execution log commands");

  registerListCommand(executionLog);
  registerGetCommand(executionLog);

  program.addCommand(executionLog);
}
