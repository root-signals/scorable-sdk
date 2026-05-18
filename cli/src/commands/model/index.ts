import { Command } from "commander";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerCreateCommand } from "./create.js";
import { registerUpdateCommand } from "./update.js";
import { registerDeleteCommand } from "./delete.js";

export function registerModelCommands(program: Command): void {
  const model = new Command("model").description("Custom model management commands");

  registerListCommand(model);
  registerGetCommand(model);
  registerCreateCommand(model);
  registerUpdateCommand(model);
  registerDeleteCommand(model);

  program.addCommand(model);
}
