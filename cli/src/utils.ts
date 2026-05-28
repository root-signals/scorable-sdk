import { z, type ZodType } from "zod";
import type { Turn } from "@root-signals/scorable";

const TurnSchema = z.object({
  role: z.enum(["user", "assistant", "tool"]),
  content: z.string().nullable().optional(),
  contexts: z.array(z.string()).nullable().optional(),
  tool_calls: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  tool_call_id: z.string().nullable().optional(),
});

const TurnArraySchema = z.array(TurnSchema);
const ToolCatalogSchema = z.array(z.record(z.string(), z.unknown()));

export function isTurnArray(v: unknown): v is Turn[] {
  return TurnArraySchema.safeParse(v).success;
}

export function isToolCatalog(v: unknown): v is Record<string, unknown>[] {
  return ToolCatalogSchema.safeParse(v).success;
}

export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === "string");
}

export function isStringRecord(v: unknown): v is Record<string, string> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v as Record<string, unknown>).every((val) => typeof val === "string")
  );
}

// Parse a JSON-string CLI argument and validate it against a zod schema.
// Callers print their own error message so existing wording stays stable.
export type JsonArgResult<T> = { ok: true; value: T } | { ok: false };

export function parseJsonArg<T>(raw: string, schema: ZodType<T>): JsonArgResult<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) return { ok: false };
  return { ok: true, value: result.data };
}
