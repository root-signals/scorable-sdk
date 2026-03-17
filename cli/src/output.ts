import chalk from "chalk";
import Table from "cli-table3";
import type { Judge } from "./types.js";

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printError(msg: string): void {
  console.error(chalk.bold.red("Error:") + " " + msg);
}

export function printSuccess(msg: string): void {
  console.log(chalk.bold.green("Success:") + " " + msg);
}

export function printInfo(msg: string): void {
  console.log(chalk.bold.blue("Info:") + " " + msg);
}

export function printWarning(msg: string): void {
  console.log(chalk.bold.yellow("Warning:") + " " + msg);
}

export function printMessage(msg: string): void {
  console.log(msg);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function printJudgeTable(judges: Judge[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Name", "Intent", "Created At", "Status"],
    style: { head: ["cyan"] },
    colWidths: [38, 30, 52, 12, 10],
    wordWrap: true,
  });

  for (const j of judges) {
    const date = (j.created_at ?? "").slice(0, 10);
    table.push([j.id, j.name, truncate(j.intent ?? "", 50), date, j.status ?? ""]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}
