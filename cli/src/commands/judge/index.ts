import { Command } from "commander";
import { registerListCommand } from "./list.js";
import { registerGetCommand } from "./get.js";
import { registerCreateCommand } from "./create.js";
import { registerUpdateCommand } from "./update.js";
import { registerDeleteCommand } from "./delete.js";
import { registerExecuteCommand } from "./execute.js";
import { registerExecuteByNameCommand } from "./execute-by-name.js";
import { registerDuplicateCommand } from "./duplicate.js";
import { registerExecOpenaiCommand } from "./exec-openai.js";
import { registerExecOpenaiGenericCommand } from "./exec-openai-generic.js";

export function registerJudgeCommands(program: Command): void {
  const judge = new Command("judge").description("Judge management commands");

  registerListCommand(judge);
  registerGetCommand(judge);
  registerCreateCommand(judge);
  registerUpdateCommand(judge);
  registerDeleteCommand(judge);
  registerExecuteCommand(judge);
  registerExecuteByNameCommand(judge);
  registerDuplicateCommand(judge);
  registerExecOpenaiCommand(judge);
  registerExecOpenaiGenericCommand(judge);

  program.addCommand(judge);
}
