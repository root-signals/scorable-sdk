import { createRequire } from "node:module";
import { getApiKey, getBaseUrl } from "./auth.js";
import { printError, printJson } from "./output.js";

const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

interface RequestOptions {
  payload?: Record<string, unknown>;
  params?: Record<string, unknown>;
  apiKey?: string;
  baseUrl?: string;
}

export interface ApiRequestResult {
  ok: boolean;
  status: number;
  data: unknown;
}

// Returns the full HTTP outcome — `ok` is `false` on network/HTTP/decode errors
// (in which case the helper has already printed an error to stderr) and `true`
// on 2xx responses including 204 No Content (where `data` is `null`). Use this
// when the caller needs to distinguish success-with-no-body from a failure
// (e.g. DELETE handlers, where both currently surface as `null` from
// `apiRequest`).
export async function apiRequestStatus(
  method: string,
  endpoint: string,
  options?: RequestOptions,
): Promise<ApiRequestResult> {
  const apiKey = options?.apiKey ?? getApiKey();
  const baseUrl = options?.baseUrl ?? getBaseUrl();

  const seg = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
  const url = new URL(`${baseUrl}/${seg}`);

  if (options?.params) {
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Api-Key ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": `scorable/${version}`,
  };

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.payload ? JSON.stringify(options.payload) : undefined,
    });
  } catch (e) {
    printError(`Request failed: ${e instanceof Error ? e.message : String(e)}`);
    return { ok: false, status: 0, data: null };
  }

  if (response.status === 204) return { ok: true, status: 204, data: null };

  if (!response.ok) {
    printError(`API Error: ${response.status} for ${method} ${url}`);
    try {
      printJson(await response.json());
    } catch {
      printError(`Response content: ${await response.text().catch(() => "")}`);
    }
    return { ok: false, status: response.status, data: null };
  }

  try {
    return { ok: true, status: response.status, data: await response.json() };
  } catch {
    printError(`Failed to decode JSON response from API for ${url}.`);
    return { ok: false, status: response.status, data: null };
  }
}

// Convenience wrapper preserving the original `data | null` contract: returns
// `null` on both 204 and any failure. Prefer `apiRequestStatus` when the
// caller needs to tell those apart.
export async function apiRequest(
  method: string,
  endpoint: string,
  options?: RequestOptions,
): Promise<unknown> {
  const result = await apiRequestStatus(method, endpoint, options);
  return result.ok ? result.data : null;
}
