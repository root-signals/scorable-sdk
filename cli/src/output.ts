import chalk from "chalk";
import Table from "cli-table3";
import { CliError } from "./types.js";
import type { Judge, EvaluatorListItem, ExecutionLogList } from "@root-signals/scorable";

const UNICODE_CHARS = {
  top: "─",
  "top-mid": "┬",
  "top-left": "┌",
  "top-right": "┐",
  bottom: "─",
  "bottom-mid": "┴",
  "bottom-left": "└",
  "bottom-right": "┘",
  left: "│",
  "left-mid": "├",
  mid: "─",
  "mid-mid": "┼",
  right: "│",
  "right-mid": "┤",
  middle: "│",
};

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printError(msg: string): void {
  console.error(chalk.red("✖") + " " + msg);
}

export function handleSdkError(e: unknown): never {
  if (e instanceof CliError) throw e;
  const message = e instanceof Error ? e.message || String(e) : String(e);
  printError(message);
  throw new CliError(1, message);
}

export function printSuccess(msg: string): void {
  console.log(chalk.green("✔") + " " + msg);
}

export function printInfo(msg: string): void {
  console.log(chalk.cyan("›") + " " + msg);
}

export function printWarning(msg: string): void {
  console.log(chalk.yellow("⚠") + " " + msg);
}

export function printMessage(msg: string): void {
  console.log(msg);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function printJudgeTable(judges: Judge[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Name", "Intent", "Created At"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [38, 30, 52, 12],
    wordWrap: true,
  });

  for (const j of judges) {
    const date = (j.created_at ?? "").slice(0, 10);
    table.push([j.id, j.name, truncate(j.intent ?? "", 50), date]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}

export function printEvaluatorTable(evaluators: EvaluatorListItem[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Name", "Created At"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [38, 30, 12],
    wordWrap: true,
  });

  for (const e of evaluators) {
    const date = (e.created_at ?? "").slice(0, 10);
    table.push([e.id, e.name, date]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}

export function printExecutionLogTable(logs: ExecutionLogList[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Item Name", "Type", "Score", "Created At"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [38, 30, 15, 8, 12],
    wordWrap: true,
  });

  for (const l of logs) {
    const date = (l.created_at ?? "").slice(0, 10);
    const score = l.score != null ? String(l.score) : "";
    table.push([l.id, truncate(l.executed_item_name, 28), l.execution_type, score, date]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}
