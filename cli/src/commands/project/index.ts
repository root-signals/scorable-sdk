import { Command } from "commander";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerCreateCommand } from "./create.js";
import { registerUpdateCommand } from "./update.js";
import { registerDeleteCommand } from "./delete.js";
import { registerSetDefaultCommand } from "./set-default.js";

export function registerProjectCommands(program: Command): void {
  const project = new Command("project").description("Project management commands");

  registerListCommand(project);
  registerGetCommand(project);
  registerCreateCommand(project);
  registerUpdateCommand(project);
  registerDeleteCommand(project);
  registerSetDefaultCommand(project);

  program.addCommand(project);
}
