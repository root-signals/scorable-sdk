import { describe, expect, it } from "vitest";
import { loadFilterYaml, FilterYamlSchema } from "../src/lib/filter-yaml.js";

const validYaml = `
name: my-filter
judge_id: 0193b6a0-e75d-7a47-9c6f-2f3e3b8f7c91
filter_criteria: {}
extractor_rules:
  - emit: request_response
    input_locator: { kind: span_attr, key: input.value }
    output_locator: { kind: span_attr, key: output.value }
`;

describe("filter yaml loader", () => {
  it("parses a complete filter spec", () => {
    const parsed = loadFilterYaml(validYaml);
    expect(parsed.name).toBe("my-filter");
    expect(parsed.extractor_rules).toHaveLength(1);
  });

  it("rejects unknown top-level fields", () => {
    const bad = validYaml + "\nunknown_field: 1";
    expect(() => loadFilterYaml(bad)).toThrow(/unknown_field/);
  });

  it("rejects invalid YAML", () => {
    expect(() => loadFilterYaml(":\n  - malformed")).toThrow();
  });

  it("requires either evaluator_id or judge_id", () => {
    const noTarget = `
name: x
filter_criteria: {}
extractor_rules:
  - emit: request_response
    input_locator: { kind: span_attr, key: i }
    output_locator: { kind: span_attr, key: o }
`;
    expect(() => loadFilterYaml(noTarget)).toThrow(/evaluator_id|judge_id/);
  });

  it("rejects both evaluator_id and judge_id set", () => {
    const both = `
name: x
evaluator_id: e1
judge_id: j1
filter_criteria: {}
extractor_rules:
  - emit: request_response
    input_locator: { kind: span_attr, key: i }
    output_locator: { kind: span_attr, key: o }
`;
    expect(() => loadFilterYaml(both)).toThrow(/evaluator_id|judge_id/);
  });

  it("rejects extractor_rule with unknown emit", () => {
    const badRule = `
name: x
judge_id: j1
filter_criteria: {}
extractor_rules:
  - emit: nope
    locator: { kind: span_attr, key: x }
`;
    expect(() => loadFilterYaml(badRule)).toThrow();
  });
});

// Reference the export so type-check covers it.
export const _schema = FilterYamlSchema;
