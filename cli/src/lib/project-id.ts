import { loadSettings } from "../auth.js";

export type ProjectIdSource = "flag" | "env" | "settings" | "none";

export interface ResolvedProjectId {
  /**
   * The resolved project id to send to the backend, or undefined to omit
   * (lets the backend apply its default resolution).
   */
  value: string | undefined;
  source: ProjectIdSource;
}

/**
 * Resolution order:
 *   1. --project-id <uuid>          (CLI flag, non-empty)
 *   2. --project-id ""              (explicit empty — opt out, do NOT send)
 *   3. SCORABLE_PROJECT_ID env var
 *   4. project_id in ~/.scorable/settings.json
 *   5. omitted — backend applies its standard resolution
 *
 * No local UUID validation; the backend rejects malformed ids with a 400.
 */
export function resolveProjectId(flagValue?: string): ResolvedProjectId {
  if (flagValue !== undefined) {
    if (flagValue === "") {
      // Explicit opt-out — do not inherit from env or settings.
      return { value: undefined, source: "flag" };
    }
    return { value: flagValue, source: "flag" };
  }

  const fromEnv = process.env["SCORABLE_PROJECT_ID"];
  if (fromEnv !== undefined && fromEnv !== "") {
    return { value: fromEnv, source: "env" };
  }

  const settings = loadSettings();
  const fromSettings = settings["project_id"];
  if (typeof fromSettings === "string" && fromSettings !== "") {
    return { value: fromSettings, source: "settings" };
  }

  return { value: undefined, source: "none" };
}

/**
 * Convenience: return only the value to send (undefined means "omit").
 */
export function resolveProjectIdValue(flagValue?: string): string | undefined {
  return resolveProjectId(flagValue).value;
}

/**
 * Common help text for the --project-id flag, shared across commands.
 */
export const PROJECT_ID_FLAG_DESC =
  'Project UUID to scope this operation. Pass "" to opt out of inherited defaults from SCORABLE_PROJECT_ID or ~/.scorable/settings.json.';
