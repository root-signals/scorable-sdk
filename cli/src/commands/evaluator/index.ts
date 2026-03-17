import { Command } from "commander";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerCreateCommand } from "./create.js";
import { registerUpdateCommand } from "./update.js";
import { registerDeleteCommand } from "./delete.js";
import { registerExecuteCommand } from "./execute.js";
import { registerExecuteByNameCommand } from "./execute-by-name.js";
import { registerDuplicateCommand } from "./duplicate.js";

export function registerEvaluatorCommands(program: Command): void {
  const evaluator = new Command("evaluator").description("Evaluator management commands");

  registerListCommand(evaluator);
  registerGetCommand(evaluator);
  registerCreateCommand(evaluator);
  registerUpdateCommand(evaluator);
  registerDeleteCommand(evaluator);
  registerExecuteCommand(evaluator);
  registerExecuteByNameCommand(evaluator);
  registerDuplicateCommand(evaluator);

  program.addCommand(evaluator);
}
