// Bundle entry point — used by `npm run bundle` to produce dist/scorable.
// Unlike src/index.ts, this unconditionally runs the CLI (no import.meta.url guard needed).
import { createCli } from "./index.js";

createCli()
  .parseAsync(process.argv)
  .catch((e: unknown) => {
    if (e && typeof e === "object" && "exitCode" in e) {
      process.exit((e as { exitCode: number }).exitCode);
    }
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      String((e as { code: unknown }).code).startsWith("commander.")
    ) {
      process.exit((e as { exitCode?: number }).exitCode ?? 1);
    }
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  });
