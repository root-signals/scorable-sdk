import { createRequire } from "node:module";
import { getApiKey, getBaseUrl } from "./auth.js";
import { printError, printJson } from "./output.js";

const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

export async function apiRequest(
  method: string,
  endpoint: string,
  options?: {
    payload?: Record<string, unknown>;
    params?: Record<string, unknown>;
    apiKey?: string;
    baseUrl?: string;
  },
): Promise<unknown> {
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
    return null;
  }

  if (response.status === 204) return null;

  if (!response.ok) {
    printError(`API Error: ${response.status} for ${method} ${url}`);
    try {
      printJson(await response.json());
    } catch {
      printError(`Response content: ${await response.text().catch(() => "")}`);
    }
    return null;
  }

  try {
    return await response.json();
  } catch {
    printError(`Failed to decode JSON response from API for ${url}.`);
    return null;
  }
}
