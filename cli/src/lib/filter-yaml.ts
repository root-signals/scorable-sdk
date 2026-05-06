import { z } from "zod";
import yaml from "js-yaml";

const MatchCondition = z
  .object({
    column: z.string(),
    operator: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    key: z.string().optional(),
  })
  .strict();

const Match = z
  .object({
    conditions: z.array(MatchCondition).default([]),
  })
  .strict();

const Locator = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("span_attr"),
      key: z.string(),
      value_path: z.string().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("resource_attr"),
      key: z.string(),
      value_path: z.string().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("event_attr"),
      key: z.string(),
      event_name: z.string(),
      value_path: z.string().optional(),
    })
    .strict(),
]);

const TextRule = z
  .object({
    emit: z.literal("text"),
    match: Match.optional(),
    role: z.enum(["user", "assistant"]),
    locator: Locator,
    tool_name: z.string().optional(),
  })
  .strict();

const RequestResponseRule = z
  .object({
    emit: z.literal("request_response"),
    match: Match.optional(),
    input_locator: Locator,
    output_locator: Locator,
  })
  .strict();

const ToolPairRule = z
  .object({
    emit: z.literal("tool_pair"),
    match: Match.optional(),
    input_locator: Locator,
    output_locator: Locator,
    tool_name: z.string().optional(),
    tool_name_locator: Locator.optional(),
  })
  .strict();

const GenAiMessagesRule = z
  .object({
    emit: z.literal("genai_messages"),
    match: Match.optional(),
    input_locator: Locator,
    output_locator: Locator,
  })
  .strict();

const ExtractorRule = z.discriminatedUnion("emit", [
  TextRule,
  RequestResponseRule,
  ToolPairRule,
  GenAiMessagesRule,
]);

export const FilterYamlSchema = z
  .object({
    name: z.string(),
    evaluator_id: z.string().optional(),
    judge_id: z.string().optional(),
    filter_criteria: Match.default({ conditions: [] }),
    sampling_rate: z.number().min(0).max(1).optional(),
    delay_seconds: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
    extractor_rules: z.array(ExtractorRule).default([]),
  })
  .strict()
  .refine((v) => Boolean(v.evaluator_id) !== Boolean(v.judge_id), {
    message: "exactly one of evaluator_id or judge_id is required",
  });

export type FilterYaml = z.infer<typeof FilterYamlSchema>;

export function loadFilterYaml(source: string): FilterYaml {
  let raw: unknown;
  try {
    raw = yaml.load(source);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid YAML: ${msg}`);
  }
  const result = FilterYamlSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`);
    throw new Error(`Invalid filter YAML:\n${issues.join("\n")}`);
  }
  return result.data;
}
