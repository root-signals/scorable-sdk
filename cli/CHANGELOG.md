## 0.15.0

- Bump `@root-signals/scorable` to `^0.12.0` for the annotation-store resources.
- New `scorable dataset-item` command group: `add`, `add-bulk`, `list`, `get`, `update`, `archive` — build labelled datasets programmatically.
- New `scorable annotation` command group: `create`, `list`, `get`, `update`, `delete`. Label a dataset item (or execution log) with an expected score; omitting `--score-config-id` uses the global identity "Score" config.
- New `scorable calibration-run` command group: `create`, `get`, `list`, `items` — start a calibration run against a labelled dataset and read its per-example results (human/evaluator scores, disagreement, request/response).
- New `scorable evaluator calibrate <id> --dataset-id <id>` to start a calibration run for a saved evaluator.
- `evaluator create` / `evaluator update` accept `--demonstration-dataset <id>` to attach a labelled dataset as few-shot demonstrations.

## 0.14.0

- Bump `@root-signals/scorable` to `^0.11.0` for the new `projects` resource and `projectId` support.
- New `scorable project` command group: `list`, `get`, `create`, `update`, `delete`, `set-default`. `project create` and `project update` accept `--is-default` to promote a project as the org default (the previous default is unset atomically).
- `project list` appends `(default)` to the default project's name.
- `--project-id <uuid>` added to every command that creates, executes, lists, or filters a project-scoped resource: `evaluator` (`execute`, `execute-by-name`, `create`, `update`, `duplicate`, `import-yaml`, `list`), `judge` (`execute`, `execute-by-name`, `create`, `update`, `duplicate`, `generate`, `list`, `exec-openai`, `exec-openai-generic`), and `execution-log list`. Pass `--project-id ""` to opt out of an inherited default for a single invocation.
- OpenAI-compatible commands (`judge exec-openai`, `judge exec-openai-generic`) translate `--project-id` to the `X-Project-Id` HTTP header per request (the OpenAI wire format can't carry it in the body).
- `--project-id` resolution order: CLI flag → `SCORABLE_PROJECT_ID` env var → `project_id` in `~/.scorable/settings.json` → omitted (backend resolves to org default).
- New `auth` subcommands for managing the persistent project preference: `auth set-project <uuid>` writes to settings; `auth unset-project` removes it; `auth show-project` prints the resolved project_id and its source. `auth logout` now also clears the saved project_id.
- New `project_id` column on `evaluator list`, `judge list`, and `execution-log list` output (public resources show an empty cell).
- `prompt-test init --project-id <uuid>` persists the project into the generated config file. `prompt-test run` reads it from the config; pass `run --project-id` to override per-invocation.
- `evaluator export-yaml` strips `project_id` from the output so YAML stays portable across organizations.
- Backend errors (cross-org `project_id`, duplicate project names, clearing the default) surface as a single-line stderr message with the backend's reason verbatim and exit 1.

## 0.13.0

- Bump `@root-signals/scorable` to `^0.10.0` for the new tool-call multi-turn shape.
- `--turns` now accepts the structured tool-call shape: nullable `content`, assistant `tool_calls`, and a `tool` role with `tool_call_id`. Previously turns with `content: null` were rejected.
- Add `--tools <json>` flag to `evaluator execute`, `evaluator execute-by-name`, `judge execute`, and `judge execute-by-name` for passing an OpenAI-style tool catalog.
- Help text updated with a tool-aware evaluation example for each command.

## 0.12.0

- Add `--api-url <url>` global flag to override the API base URL (on-prem deployments; also overridable via `SCORABLE_API_URL` env var)

## 0.11.0

- Rename `evaluator create` and `evaluator update` to send `scoring_criteria` instead of `predicate`/`prompt`
- Bump `@root-signals/scorable` to `^0.8.0`

## 0.10.0

- Add `scorable model` command group for managing custom LLM models: `list`, `get`, `create`, `update` (PATCH), `delete`.
- `model create` / `model update` accept `--key -` to read the provider API key from stdin, avoiding shell-history leak.
- `model list` prints a table (ID / Name / Provider / Visibility) with `--page-size`, `--cursor`, `--ordering`.
- Add `--file <path>` and `--file-id <id>` to `scorable judge generate`. `--file` uploads then generates in one step; `--file-id` reuses an already-uploaded file. The two options are mutually exclusive.
- `scorable file upload` now prints the uploaded file object (was silent).
- Bump `@root-signals/scorable` to `^0.7.0` (adds `models.verify()` and `file_id` on judge generate).

## 0.9.1

- Update `@root-signals/scorable` to 0.6.1 to patch fast-uri high-severity vulnerabilities (host confusion, path traversal via percent-encoded segments)

## 0.9.0

- Add `scorable otel-filter update <id>` and `scorable otel-filter validate` commands.
- Add `-f, --from-file` to `scorable otel-filter create` for YAML/JSON filter manifests with custom `extractor_rules`.
- Add reference manifests under `examples/otel-filters/` (Claude Code, OpenInference, GenAI).

## 0.8.0

- Add `scorable otel-filter` command group for managing OTEL trace evaluation filters (`create`, `list`, `delete`). Wires an evaluator (`--evaluator-id`) or judge (`--judge-id`) to incoming traces; filters auto-run against matching traces and the result lands back on the trace as a child span carrying the OpenTelemetry GenAI evaluation attributes.
- Add `scorable otel-trace` command group for querying ingested traces: `list` (with time-window, convenience flags, and raw filter expressions) and `spans <trace_id>` for drilling into one trace.
- `otel-trace list` convenience flags: `--service-name`, `--has-error`, `--root-name`, `--span-name`, `--agent-name`, `--model`, `--tool`. Each compiles to a wire-format filter and AND-combines with the others and with `--filter`.
- Time-window flags: `--since 30s|5m|2h|7d`, or `--start-time` and `--end-time` (ISO 8601, mutually exclusive with `--since`).
- Output formats for `otel-trace list` and `otel-trace spans`: `--output table | json | csv`. CSV uses RFC 4180 quoting so embedded commas, quotes, and newlines round-trip safely.

## 0.7.0

- Add `scorable file upload <path>` command to upload files (PDF, PNG, JPG, JPEG, WEBP, SVG)
- Add `--file-ids <json>` option to `evaluator execute` for attaching uploaded files to evaluations

## 0.6.0

- Simplify visibility model: `--visibility` now accepts `private` or `public` (default: `private`)
- Remove `--system-message` option from `evaluator create` and `evaluator update`
- Judge `generate`: remove stages and missing-context output; error codes are surfaced directly
- Judge `list`: remove stale `is_public` default filter

## 0.5.0

- Add `scorable evaluator export-yaml <id>` command to export an evaluator as a YAML file (prints to stdout or `--output <file>`)
- Add `scorable evaluator import-yaml --file <path>` command to import an evaluator from a YAML file, with `--overwrite` support

## 0.4.1

- Add `scorable skills-add` command to install Scorable skills for AI coding agents (`npx skills add root-signals/scorable-skills`)
- Add usage demo video to README
- Add "Install skills for your AI coding agent" step to `--help` getting-started section
- Patch high-severity npm dependency vulnerabilities (undici, flatted, minimatch, rollup)

## 0.4.0

- Add `scorable judge generate` command to generate a judge from an intent using AI
  - Supports `--intent` (required), `--name`, `--stage`, `--visibility`, `--overwrite`, `--judge-id`, `--reasoning-effort`
  - Add `--extra-contexts` for providing key-value context to improve generation
  - Add `--context-aware` to enable hallucination/context-drift evaluators for RAG applications
  - Handles `multiple_stages` response (lists stages, prompts to re-run with `--stage`)
  - Handles `missing_context_from_system_goal` response (lists missing fields, prompts to re-run with `--extra-contexts`)
- Add `scorable auth demo-key` command to create and save a free demo API key
- Make temporary key creation explicit — `requireApiKey()` now fails fast with clear instructions instead of silently creating a demo key
- Add coloured CLI banner with logo mark, version, and tagline
- Replace text labels with symbols in all output (`✔` success, `✖` error, `›` info, `⚠` warning)
- Use Unicode box-drawing table borders and bold cyan headers throughout
- Bump `@root-signals/scorable` dependency to `^0.3.1`

## 0.3.0

- Add `scorable auth set-key <apiKey>` command to persistently save an API key to `~/.scorable/settings.json`
- Add `--version` / `-V` flag
- Add loading spinners on all commands; remove noisy request payload dumps before API calls
- Prioritise saved `api_key` over `temporary_api_key` when resolving credentials
- Improve auth error hint to mention `scorable auth set-key`
- Improve README and `--help` output to emphasise authentication as a required first step

## 0.2.1

- Fix dependency on @root-signals/scorable to ^0.3.0 (required for evaluator update and delete commands)

## 0.2.0

- Add full evaluator command group: list, get, create, update, delete, execute, execute-by-name, duplicate
- Add execution-log commands: list (with filters) and get
- Add multi-turn conversation support (`--turns`) to all execute commands
- Add `--variables` option to evaluator execute and execute-by-name
- Add real-life examples to all execute command help text
- Improve error handling: all SDK errors now exit non-zero with a clear message

## 0.1.6

- Add user_id and session_id to judge commands

## 0.1.5

- Initial release as scorable-cli
