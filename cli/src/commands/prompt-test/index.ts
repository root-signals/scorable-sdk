import { Command } from "commander";
import { registerInitCommand } from "./init.js";
import { registerRunCommand } from "./run.js";

function buildPtGroup(name: string): Command {
  const pt = new Command(name).description("Prompt testing management commands");
  registerInitCommand(pt);
  registerRunCommand(pt);
  return pt;
}

export function registerPromptTestCommands(program: Command): void {
  program.addCommand(buildPtGroup("pt"));
  program.addCommand(buildPtGroup("prompt-test"));
}
