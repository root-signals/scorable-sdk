import { Command } from "commander";
import { registerUploadCommand } from "./upload.js";

export function registerFileCommands(program: Command): void {
  const file = program.command("file").description("Manage uploaded files");

  registerUploadCommand(file);
}
