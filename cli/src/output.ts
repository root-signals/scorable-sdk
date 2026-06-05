import chalk from "chalk";
import Table from "cli-table3";
import { ScorableError } from "@root-signals/scorable";
import { CliError } from "./types.js";
import type {
  Judge,
  EvaluatorListItem,
  ExecutionLogList,
  ModelList,
  Project,
} from "@root-signals/scorable";

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

function extractBackendMessage(details: unknown): string | undefined {
  // DRF error bodies come in a handful of shapes — prefer the most specific one.
  if (!details || typeof details !== "object") return undefined;
  const d = details as Record<string, unknown>;
  if (typeof d["detail"] === "string") return d["detail"];
  if (typeof d["title"] === "string") return d["title"];
  if (typeof d["error"] === "string") return d["error"];
  if (typeof d["message"] === "string") return d["message"];
  // DRF non_field_errors / field-level lists — join the first one we find.
  for (const v of Object.values(d)) {
    if (Array.isArray(v) && v.length && typeof v[0] === "string") {
      return v[0] as string;
    }
  }
  return undefined;
}

export function handleSdkError(e: unknown): never {
  if (e instanceof CliError) throw e;
  let message: string;
  if (e instanceof ScorableError) {
    // Surface the raw backend body when available so 400/422/409 messages flow through verbatim.
    const detail = extractBackendMessage(e.details);
    message = detail ?? e.detail ?? e.title ?? e.message ?? `API Error ${e.status}: ${e.code}`;
  } else if (e instanceof Error) {
    message = e.message || String(e);
  } else {
    message = String(e);
  }
  // Force single-line output for scriptability.
  const oneLine = message.replace(/\s*\n\s*/g, " ").trim();
  printError(oneLine);
  throw new CliError(1, oneLine);
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

function projectIdCell(value: string | null | undefined): string {
  return value ?? "";
}

export function printJudgeTable(judges: Judge[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Name", "Intent", "Project ID", "Created At"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [38, 24, 40, 38, 12],
    wordWrap: true,
  });

  for (const j of judges) {
    const date = (j.created_at ?? "").slice(0, 10);
    table.push([j.id, j.name, truncate(j.intent ?? "", 38), projectIdCell(j.project_id), date]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}

export function printEvaluatorTable(evaluators: EvaluatorListItem[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Name", "Project ID", "Created At"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [38, 30, 38, 12],
    wordWrap: true,
  });

  for (const e of evaluators) {
    const date = (e.created_at ?? "").slice(0, 10);
    table.push([e.id, e.name, projectIdCell(e.project_id), date]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}

export function printProjectTable(projects: Project[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Name", "Description", "Created At"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [38, 30, 40, 12],
    wordWrap: true,
  });

  for (const p of projects) {
    const date = (p.created_at ?? "").slice(0, 10);
    const name = p.is_default ? `${p.name} (default)` : p.name;
    table.push([p.id, name, truncate(p.description ?? "", 38), date]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}

export function printModelTable(models: ModelList[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Name", "Provider", "Visibility"].map((h) => chalk.bold.cyan(h)),
    chars: UNICODE_CHARS,
    colWidths: [38, 32, 22, 18],
    wordWrap: true,
  });

  for (const m of models) {
    const provider = m.provider?.name ?? "";
    table.push([m.id, m.name, provider, m.visibility ?? ""]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}

export function printExecutionLogTable(logs: ExecutionLogList[], nextCursor?: string): void {
  const table = new Table({
    head: ["ID", "Item Name", "Type", "Score", "Project ID", "Created At"].map((h) =>
      chalk.bold.cyan(h),
    ),
    chars: UNICODE_CHARS,
    colWidths: [38, 24, 15, 8, 38, 12],
    wordWrap: true,
  });

  for (const l of logs) {
    const date = (l.created_at ?? "").slice(0, 10);
    const score = l.score != null ? String(l.score) : "";
    table.push([
      l.id,
      truncate(l.executed_item_name, 22),
      l.execution_type,
      score,
      projectIdCell(l.project_id),
      date,
    ]);
  }

  console.log(table.toString());

  if (nextCursor) {
    const cursor = nextCursor.split("cursor=")[1] ?? nextCursor;
    printInfo(`Next page available. Use --cursor "${cursor}"`);
  }
}
