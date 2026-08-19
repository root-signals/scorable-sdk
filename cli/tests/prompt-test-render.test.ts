import { describe, it, expect } from "vitest";
import {
  buildSummaryRows,
  buildDetailRows,
  buildPromptLabels,
  renderSummaryTable,
  renderDetail,
  renderCsv,
  renderResults,
  summaryFitsAsColumns,
  SUMMARY_MAX_WIDTH,
} from "../src/commands/prompt-test/render.js";
import type { PromptTest } from "../src/types.js";

const ANSI = /\[[0-9;]*m/g;
const strip = (s: string): string => s.replace(ANSI, "");

function evaluators(names: string[]): Array<{ id: string; name: string }> {
  return names.map((name, i) => ({ id: `ev-${i}`, name }));
}

function task(opts: {
  vars?: Record<string, unknown>;
  output?: string;
  status?: string;
  cost?: string;
  latency?: number;
  scores?: Array<[string, number | null, string | null]>;
}) {
  return {
    id: `task-${Math.abs(JSON.stringify(opts).length)}`,
    status: opts.status ?? "completed",
    cost: opts.cost ?? "0.0010000",
    llm_output: opts.output ?? "some output",
    model_call_duration: opts.latency ?? 1.5,
    variables: opts.vars ?? { question: "why?" },
    evaluation_results: (opts.scores ?? [["groundedness", 0.9, "because reasons"]]).map(
      ([name, score, justification], i) => ({
        id: `ev-${i}`,
        name,
        score,
        justification,
      }),
    ),
  };
}

function experiment(
  overrides: Partial<PromptTest> & { prompt: string; model: string },
): PromptTest {
  return {
    id: `${overrides.prompt}-${overrides.model}`,
    tasks: [task({})],
    evaluators: evaluators(["groundedness"]),
    ...overrides,
  } as PromptTest;
}

describe("prompt-test summary aggregation", () => {
  it("keys rows on (prompt x model), not model alone", () => {
    // Regression guard: two prompts against the same model must stay separate rows.
    // Keying on model alone silently averages distinct prompts together.
    const experiments = [
      experiment({ prompt: "Prompt A", model: "gpt-5" }),
      experiment({ prompt: "Prompt B", model: "gpt-5" }),
      experiment({ prompt: "Prompt A", model: "gemini-3" }),
      experiment({ prompt: "Prompt B", model: "gemini-3" }),
    ];

    const rows = buildSummaryRows(experiments);
    expect(rows).toHaveLength(4);

    const keys = rows.map((r) => `${r.promptLabel}/${r.model}`);
    expect(new Set(keys).size).toBe(4);
    expect(keys).toEqual(["P1/gpt-5", "P2/gpt-5", "P1/gemini-3", "P2/gemini-3"]);
  });

  it("labels distinct prompts P1..Pn by first appearance", () => {
    const labels = buildPromptLabels([
      experiment({ prompt: "first", model: "a" }),
      experiment({ prompt: "second", model: "a" }),
      experiment({ prompt: "first", model: "b" }),
    ]);
    expect([...labels.values()]).toEqual(["P1", "P2"]);
  });

  it("computes mean score, cost, latency and failed count", () => {
    const exp = experiment({
      prompt: "p",
      model: "m",
      tasks: [
        task({ cost: "0.002", latency: 2, scores: [["groundedness", 1.0, "j"]] }),
        task({ cost: "0.004", latency: 4, scores: [["groundedness", 0.6, "j"]] }),
      ],
    });
    const [row] = buildSummaryRows([exp]);
    expect(row.tasks).toBe(2);
    expect(row.failed).toBe(0);
    expect(row.meanCost).toBeCloseTo(0.003);
    expect(row.meanLatency).toBeCloseTo(3);
    expect(row.scores.get("groundedness")).toBeCloseTo(0.8);
  });

  it("counts failed tasks and excludes null scores from the mean", () => {
    const exp = experiment({
      prompt: "p",
      model: "m",
      tasks: [
        task({ scores: [["groundedness", 0.8, "j"]] }),
        task({ status: "failed", output: "", scores: [["groundedness", null, null]] }),
      ],
    });
    const [row] = buildSummaryRows([exp]);
    expect(row.tasks).toBe(2);
    expect(row.failed).toBe(1);
    // The null score must not drag the mean toward zero.
    expect(row.scores.get("groundedness")).toBeCloseTo(0.8);
  });
});

describe("summary table width", () => {
  // The summary is the headline; if it wraps it is useless.
  for (const n of [1, 2, 3, 4, 6]) {
    it(`stays within ${SUMMARY_MAX_WIDTH} columns with ${n} evaluators`, () => {
      const names = Array.from({ length: n }, (_, i) => `evaluator-number-${i}`);
      const exp = experiment({
        prompt: "p",
        model: "some-model",
        evaluators: evaluators(names),
        tasks: [task({ scores: names.map((nm) => [nm, 0.9, "just"] as [string, number, string]) })],
      });

      const rendered = strip(renderSummaryTable([exp], false));
      for (const line of rendered.split("\n")) {
        expect(line.length).toBeLessThanOrEqual(SUMMARY_MAX_WIDTH);
      }
    });
  }

  it("uses columns for few evaluators and transposes for many", () => {
    expect(summaryFitsAsColumns(2)).toBe(true);
    expect(summaryFitsAsColumns(4)).toBe(false);

    const names = ["a", "b", "c", "d"];
    const exp = experiment({
      prompt: "p",
      model: "m",
      evaluators: evaluators(names),
      tasks: [task({ scores: names.map((nm) => [nm, 0.9, "j"] as [string, number, string]) })],
    });
    const rendered = strip(renderSummaryTable([exp], false));
    expect(rendered).toContain("Evaluator");
  });
});

describe("detail rendering", () => {
  it("prints the evaluator justification", () => {
    const exp = experiment({
      prompt: "p",
      model: "m",
      tasks: [
        task({ scores: [["groundedness", 0.9, "the model cited the supplied HRV numbers"]] }),
      ],
    });
    const out = strip(renderDetail([exp], false, false));
    expect(out).toContain("the model cited the supplied HRV numbers");
  });

  it("marks failed tasks distinctly instead of showing a blank output", () => {
    const exp = experiment({
      prompt: "p",
      model: "m",
      tasks: [task({ status: "failed", output: "", scores: [["groundedness", null, null]] })],
    });
    const out = strip(renderDetail([exp], false, false));
    expect(out).toContain("FAILED");
    expect(out).toContain("no output");
  });

  it("--full yields strictly more text than the truncated form", () => {
    const long = "x".repeat(400);
    const exp = experiment({
      prompt: "p",
      model: "m",
      tasks: [task({ output: long, scores: [["groundedness", 0.9, long]] })],
    });
    const brief = strip(renderDetail([exp], false, false));
    const full = strip(renderDetail([exp], true, false));
    expect(full.length).toBeGreaterThan(brief.length);
    expect(full).toContain(long);
    expect(brief).not.toContain(long);
  });
});

describe("full result rendering", () => {
  it("prints each prompt once, not once per row", () => {
    const prompt = "You are a helpful assistant answering {{question}} carefully";
    const experiments = [
      experiment({
        prompt,
        model: "gpt-5",
        tasks: [task({ vars: { question: "a" } }), task({ vars: { question: "b" } })],
      }),
      experiment({ prompt, model: "gemini-3", tasks: [task({ vars: { question: "c" } })] }),
    ];
    const out = strip(renderResults(experiments, false, false));
    const occurrences = out.split(prompt).length - 1;
    expect(occurrences).toBe(1);
  });
});

describe("csv output", () => {
  it("emits one row per (input x evaluator) with no ANSI codes", () => {
    const exp = experiment({
      prompt: "p",
      model: "m",
      evaluators: evaluators(["groundedness", "actionability"]),
      tasks: [
        task({
          vars: { question: "q1" },
          scores: [
            ["groundedness", 0.9, "j1"],
            ["actionability", 0.7, "j2"],
          ],
        }),
        task({
          vars: { question: "q2" },
          scores: [
            ["groundedness", 0.5, "j3"],
            ["actionability", 0.3, "j4"],
          ],
        }),
      ],
    });

    const csv = renderCsv([exp]);
    expect(csv).not.toMatch(ANSI);

    const lines = csv.trimEnd().split("\n");
    expect(lines[0]).toContain("prompt_label");
    expect(lines[0]).toContain("justification");
    // 2 inputs x 2 evaluators = 4 data rows.
    expect(lines).toHaveLength(5);
  });

  it("escapes commas, quotes and newlines in justifications", () => {
    const exp = experiment({
      prompt: "p",
      model: "m",
      tasks: [task({ scores: [["groundedness", 0.9, 'has, a "quote" and\nnewline']] })],
    });
    const csv = renderCsv([exp]);
    expect(csv).toContain('"has, a ""quote"" and\nnewline"');
  });
});
