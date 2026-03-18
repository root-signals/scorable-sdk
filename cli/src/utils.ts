import type { Turn } from "@root-signals/scorable";

export function isTurnArray(v: unknown): v is Turn[] {
  return (
    Array.isArray(v) &&
    v.every(
      (t) =>
        typeof t === "object" &&
        t !== null &&
        "role" in t &&
        typeof (t as Record<string, unknown>).role === "string" &&
        "content" in t &&
        typeof (t as Record<string, unknown>).content === "string",
    )
  );
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
