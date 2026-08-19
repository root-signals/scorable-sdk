// Rendering for prompt-test results.
//
// Split into pure builders (buildSummaryRows / buildDetailRows) and renderers so the
// aggregation logic is testable without capturing stdout or hitting the network.

import chalk from "chalk";
import Table from "cli-table3";
import { truncate } from "../../output.js";
import { toCsv } from "../../lib/output-format.js";
import type { PromptTest, PromptTestTask } from "../../types.js";

export const UNICODE_CHARS = {
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

/** Max width for the summary table. It is the headline; it must not wrap. */
export const SUMMARY_MAX_WIDTH = 100;

const PROMPT_PREVIEW = 96;
const OUTPUT_PREVIEW = 88;
const JUSTIFICATION_PREVIEW = 72;

export interface SummaryRow {
  promptLabel: string;
  model: string;
  tasks: number;
  failed: number;
  meanCost: number | null;
  meanLatency: number | null;
  /** Mean score per evaluator name; null when no scored task produced a value. */
  scores: Map<string, number | null>;
}

export interface DetailRow {
  promptLabel: string;
  model: string;
  status: string;
  variables: Record<string, unknown>;
  output: string;
  evaluations: Array<{ name: string; score: number | null; justification: string | null }>;
}

function isFailed(task: PromptTestTask): boolean {
  return task.status === "failed";
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Assign stable P1..Pn labels to distinct prompt texts, in first-seen order.
 * Experiments are keyed by (prompt, model), so the label must come from the prompt
 * text rather than the experiment index.
 */
export function buildPromptLabels(experiments: PromptTest[]): Map<string, string> {
  const labels = new Map<string, string>();
  for (const exp of experiments) {
    if (!labels.has(exp.prompt)) labels.set(exp.prompt, `P${labels.size + 1}`);
  }
  return labels;
}

/** Evaluator display names, de-duplicated by id, in stable sorted-by-id order. */
export function collectEvaluatorNames(experiments: PromptTest[]): string[] {
  const byId = new Map<string, string>();
  for (const exp of experiments) {
    for (const e of exp.evaluators) if (!byId.has(e.id)) byId.set(e.id, e.name);
  }
  return [...byId.keys()].sort().map((id) => byId.get(id)!);
}

/**
 * One row per (prompt x model) -- never per model alone. Two prompts run against the
 * same model are different experiments and must not be averaged together.
 */
export function buildSummaryRows(experiments: PromptTest[]): SummaryRow[] {
  const labels = buildPromptLabels(experiments);
  const evaluatorNames = collectEvaluatorNames(experiments);

  return experiments.map((exp) => {
    const costs: number[] = [];
    const latencies: number[] = [];
    const scoresByName = new Map<string, number[]>();

    for (const task of exp.tasks) {
      const cost = task.cost != null ? Number(task.cost) : NaN;
      if (Number.isFinite(cost)) costs.push(cost);
      if (task.model_call_duration != null) latencies.push(task.model_call_duration);

      for (const r of task.evaluation_results) {
        if (r.score == null) continue;
        const bucket = scoresByName.get(r.name) ?? [];
        bucket.push(r.score);
        scoresByName.set(r.name, bucket);
      }
    }

    const scores = new Map<string, number | null>();
    for (const name of evaluatorNames) scores.set(name, mean(scoresByName.get(name) ?? []));

    return {
      promptLabel: labels.get(exp.prompt)!,
      model: exp.model,
      tasks: exp.tasks.length,
      failed: exp.tasks.filter(isFailed).length,
      meanCost: mean(costs),
      meanLatency: mean(latencies),
      scores,
    };
  });
}

export function buildDetailRows(experiments: PromptTest[]): DetailRow[] {
  const labels = buildPromptLabels(experiments);
  const rows: DetailRow[] = [];

  for (const exp of experiments) {
    for (const task of exp.tasks) {
      rows.push({
        promptLabel: labels.get(exp.prompt)!,
        model: exp.model,
        status: task.status,
        variables: task.variables,
        output: task.llm_output ?? "",
        evaluations: task.evaluation_results.map((r) => ({
          name: r.name,
          score: r.score,
          justification: r.justification,
        })),
      });
    }
  }
  return rows;
}

function fmtScore(score: number | null): string {
  return score == null ? "N/A" : score.toFixed(2);
}

/** Red/amber/green bands, matching the thresholds used by the demo UIs. */
function colourScore(score: number | null): string {
  const text = fmtScore(score);
  if (score == null) return chalk.dim(text);
  if (score >= 0.8) return chalk.green(text);
  if (score >= 0.5) return chalk.yellow(text);
  return chalk.red(text);
}

function fmtCost(cost: number | null): string {
  return cost == null ? "N/A" : `$${cost.toFixed(4)}`;
}

function fmtLatency(latency: number | null): string {
  return latency == null ? "N/A" : `${latency.toFixed(2)}s`;
}

const FIXED_COLS = [8, 14, 7, 8, 10, 10];
const EVAL_COL = 15;
const TRANSPOSED_COLS = [8, 14, 20, 7, 8, 10, 14, 9];

function tableWidth(colWidths: number[]): number {
  return colWidths.reduce((a, b) => a + b, 0) + colWidths.length + 1;
}

/**
 * One column per evaluator only while the table still fits SUMMARY_MAX_WIDTH; past that
 * it transposes to one row per (prompt x model x evaluator), which is width-stable for
 * any evaluator count. Decided on measured width, never a hardcoded evaluator count.
 */
export function summaryFitsAsColumns(evaluatorCount: number): boolean {
  const widths = [...FIXED_COLS, ...Array(evaluatorCount).fill(EVAL_COL)];
  return tableWidth(widths) <= SUMMARY_MAX_WIDTH;
}

export function renderSummaryTable(experiments: PromptTest[], colour = true): string {
  const rows = buildSummaryRows(experiments);
  const evaluatorNames = collectEvaluatorNames(experiments);
  const paint = (s: string) => (colour ? chalk.bold.cyan(s) : s);
  const score = (v: number | null) => (colour ? colourScore(v) : fmtScore(v));

  if (summaryFitsAsColumns(evaluatorNames.length)) {
    const table = new Table({
      head: ["Prompt", "Model", "Tasks", "Failed", "Cost", "Latency", ...evaluatorNames].map(paint),
      chars: UNICODE_CHARS,
      style: { head: [] },
      colWidths: [...FIXED_COLS, ...evaluatorNames.map(() => EVAL_COL)],
      wordWrap: true,
    });
    for (const r of rows) {
      table.push([
        r.promptLabel,
        truncate(r.model, 12),
        String(r.tasks),
        String(r.failed),
        fmtCost(r.meanCost),
        fmtLatency(r.meanLatency),
        ...evaluatorNames.map((n) => score(r.scores.get(n) ?? null)),
      ]);
    }
    return table.toString();
  }

  const table = new Table({
    head: ["Prompt", "Model", "Evaluator", "Tasks", "Failed", "Cost", "Latency", "Score"].map(
      paint,
    ),
    chars: UNICODE_CHARS,
    style: { head: [] },
    colWidths: TRANSPOSED_COLS,
    wordWrap: true,
  });
  for (const r of rows) {
    for (const name of evaluatorNames) {
      table.push([
        r.promptLabel,
        truncate(r.model, 12),
        truncate(name, 18),
        String(r.tasks),
        String(r.failed),
        fmtCost(r.meanCost),
        fmtLatency(r.meanLatency),
        score(r.scores.get(name) ?? null),
      ]);
    }
  }
  return table.toString();
}

function formatVariables(variables: Record<string, unknown>, full: boolean): string {
  return Object.entries(variables)
    .map(([k, v]) => {
      const s = typeof v === "string" ? v : JSON.stringify(v);
      return `${k}: ${full ? s : truncate(s, OUTPUT_PREVIEW)}`;
    })
    .join("\n      ");
}

export function renderDetail(experiments: PromptTest[], full: boolean, colour = true): string {
  const rows = buildDetailRows(experiments);
  const lines: string[] = [];
  const dim = (s: string) => (colour ? chalk.dim(s) : s);
  const bold = (s: string) => (colour ? chalk.bold(s) : s);
  const score = (v: number | null) => (colour ? colourScore(v) : fmtScore(v));

  for (const r of rows) {
    const failed = r.status === "failed";
    const header = `[${r.promptLabel} · ${r.model}]`;
    const status = failed
      ? colour
        ? chalk.red(" FAILED")
        : " FAILED"
      : r.status !== "completed"
        ? ` ${r.status}`
        : "";
    lines.push(`  ${bold(header)}${status}`);
    lines.push(`      ${formatVariables(r.variables, full)}`);

    if (failed) {
      lines.push(`      ${dim("no output — task failed")}`);
    } else {
      const out = full ? r.output : truncate(r.output.replace(/\s+/g, " "), OUTPUT_PREVIEW);
      lines.push(`      ${dim("output:")} ${out}`);
    }

    for (const e of r.evaluations) {
      const just = e.justification ?? "";
      const shown = full ? just : truncate(just.replace(/\s+/g, " "), JUSTIFICATION_PREVIEW);
      const name = truncate(e.name, 24).padEnd(24);
      lines.push(`      ${name} ${score(e.score)}  ${dim(shown)}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function renderPromptHeadings(experiments: PromptTest[], full: boolean): string {
  const labels = buildPromptLabels(experiments);
  const lines: string[] = [];
  for (const [prompt, label] of labels) {
    const text = full ? prompt : truncate(prompt.replace(/\s+/g, " "), PROMPT_PREVIEW);
    lines.push(`${label}  ${text}`);
  }
  return lines.join("\n");
}

/** Flat one-row-per-(prompt, model, input, evaluator) shape for spreadsheets. No ANSI. */
export function renderCsv(experiments: PromptTest[]): string {
  const headers = [
    "prompt_label",
    "prompt",
    "model",
    "input_vars",
    "status",
    "cost",
    "latency_s",
    "evaluator",
    "score",
    "justification",
    "llm_output",
  ];
  const labels = buildPromptLabels(experiments);
  const rows: unknown[][] = [];

  for (const exp of experiments) {
    for (const task of exp.tasks) {
      const vars = JSON.stringify(task.variables);
      const base = [
        labels.get(exp.prompt)!,
        exp.prompt,
        exp.model,
        vars,
        task.status,
        task.cost ?? "",
        task.model_call_duration ?? "",
      ];
      if (!task.evaluation_results.length) {
        rows.push([...base, "", "", "", task.llm_output ?? ""]);
        continue;
      }
      for (const r of task.evaluation_results) {
        rows.push([...base, r.name, r.score ?? "", r.justification ?? "", task.llm_output ?? ""]);
      }
    }
  }
  return toCsv(headers, rows);
}

export function renderResults(experiments: PromptTest[], full: boolean, colour = true): string {
  const parts = [
    renderPromptHeadings(experiments, full),
    "",
    colour ? chalk.bold("Summary") : "Summary",
    renderSummaryTable(experiments, colour),
    "",
    colour ? chalk.bold("Detail") : "Detail",
    renderDetail(experiments, full, colour),
  ];
  return parts.join("\n");
}
