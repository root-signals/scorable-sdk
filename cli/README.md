<h1 align="center">
  <img width="600" alt="Scorable logo" src="https://scorable.ai/images/scorable-color.svg" loading="lazy">
</h1>

<p align="center" class="large-text">
  <i><strong>Measurement & Control for LLM Automations</strong></i>
</p>

<p align="center">
  <a href="https://scorable.ai/register">
    <img src="https://img.shields.io/badge/Get_Started-2E6AFB?style=for-the-badge&logo=rocket&logoColor=white&scale=2" />
  </a>

  <a href="https://huggingface.co/root-signals">
    <img src="https://img.shields.io/badge/HuggingFace-FF9D00?style=for-the-badge&logo=huggingface&logoColor=white&scale=2" />
  </a>

  <a href="https://sdk.rootsignals.ai/en/latest/">
    <img src="https://img.shields.io/badge/Documentation-E53935?style=for-the-badge&logo=readthedocs&logoColor=white&scale=2" />
  </a>

  <a href="https://scorable.ai/demo-user">
    <img src="https://img.shields.io/badge/Temporary_API_Key-15a20b?style=for-the-badge&logo=keycdn&logoColor=white&scale=2" />
  </a>
</p>

<p align="center">
  <video src="https://github.com/user-attachments/assets/3475573e-b20c-405b-acc6-ee48709998fa" width="800" autoplay loop muted></video>
</p>

The `scorable` CLI is a command-line tool for interacting with the Scorable API. It lets you manage and execute Judges and Evaluators, view execution logs, and run prompt testing experiments directly from the terminal.

Requires **Node.js 20 or higher**.

## Installation

```bash
curl -sSL https://scorable.ai/cli/install.sh | sh
```

Or install directly with npm:

```bash
npm install -g @root-signals/scorable-cli
```

Or run without installing via npx:

```bash
npx @root-signals/scorable-cli judge list
```

## Authentication

**Option 1 — Free demo key** (no registration required):

```bash
scorable auth demo-key
```

Creates a temporary key and saves it to `~/.scorable/settings.json`.

**Option 2 — Permanent key** from [scorable.ai/register](https://scorable.ai/register):

```bash
# Interactively
scorable auth set-key

# From argument
scorable auth set-key sk-your-api-key
```

**Option 3 — Environment variable** (takes precedence over saved key):

```bash
export SCORABLE_API_KEY="sk-your-api-key"
```

The key lookup order is: `SCORABLE_API_KEY` env var → `api_key` in `~/.scorable/settings.json` → `temporary_api_key` in `~/.scorable/settings.json`.

## Scorable Skills for AI Coding Agents

Install Scorable skills into your project so your AI coding agent (Claude Code, Cursor, etc.) can integrate evaluators automatically:

```bash
scorable skills-add
```

Once installed, open your coding agent in your AI powered project and use the prompt:

> "Integrate scorable evaluators"

## Judge Management

### List judges

```bash
scorable judge list
```

Options: `--page-size`, `--cursor`, `--search`, `--name`, `--ordering`

### Get a judge

```bash
scorable judge get <judge_id>
```

### Create a judge

```bash
scorable judge create --name "My Judge" --intent "Evaluate response quality."
```

Options: `--name` (required), `--intent` (required), `--stage`, `--evaluator-references` (JSON string, e.g. `'[{"id": "eval-id"}]'`)

### Update a judge

```bash
scorable judge update <judge_id> --name "Updated Name"
```

Options: `--name`, `--stage`, `--evaluator-references` (use `"[]"` to clear)

### Delete a judge

```bash
scorable judge delete <judge_id>
```

Prompts for confirmation. Use `--yes` to skip.

### Duplicate a judge

```bash
scorable judge duplicate <judge_id>
```

## Judge Execution

### Execute by ID

```bash
scorable judge execute <judge_id> --request "What is the capital of France?" --response "Paris"
```

Options: `--request`, `--response`, `--turns` (JSON array of conversation turns), `--contexts` (JSON list), `--expected-output`, `--tag` (repeatable), `--user-id`, `--session-id`, `--system-prompt`

Pipe a response via stdin:

```bash
echo "Paris" | scorable judge execute <judge_id> --request "What is the capital of France?"
cat response.txt | scorable judge execute <judge_id>
```

For multi-turn conversations, pass the full history as a JSON array:

```bash
scorable judge execute <judge_id> --turns '[{"role":"user","content":"Hi"},{"role":"assistant","content":"Hello!"}]'
```

### Execute by name

```bash
scorable judge execute-by-name "My Judge" --request "What is the capital of France?" --response "Paris"
```

Accepts the same options as `execute`. Stdin piping and `--turns` work the same way.

## Evaluator Management

### List evaluators

```bash
scorable evaluator list
```

Options: `--page-size`, `--cursor`, `--search`, `--name`, `--ordering`

### Get an evaluator

```bash
scorable evaluator get <evaluator_id>
```

### Create an evaluator

```bash
scorable evaluator create \
  --name "My Evaluator" \
  --scoring-criteria "Does the {{ response }} directly answer the user's question?" \
  --intent "Evaluate response relevance"
```

Options: `--name` (required), `--scoring-criteria` (required — must contain `{{ request }}` and/or `{{ response }}`), `--intent` or `--objective-id` (one required), `--system-message`, `--models` (JSON array), `--overwrite`, `--objective-version-id`

### Update an evaluator

```bash
scorable evaluator update <evaluator_id> --name "Updated Name"
```

Options: `--name`, `--scoring-criteria`, `--system-message`, `--models` (JSON array), `--objective-id`, `--objective-version-id`

### Delete an evaluator

```bash
scorable evaluator delete <evaluator_id>
```

Prompts for confirmation. Use `--yes` to skip.

### Duplicate an evaluator

```bash
scorable evaluator duplicate <evaluator_id>
```

## Evaluator Execution

### Execute by ID

```bash
scorable evaluator execute <evaluator_id> --request "What is 2+2?" --response "4"
```

Options: `--request`, `--response`, `--turns` (JSON array of conversation turns), `--contexts` (JSON list), `--expected-output`, `--tag` (repeatable), `--user-id`, `--session-id`, `--system-prompt`, `--variables` (JSON object of extra template variables)

Stdin piping and `--turns` work the same way as for judge execution.

For evaluators with custom template placeholders beyond `{{request}}`/`{{response}}`:

```bash
scorable evaluator execute <evaluator_id> --request "Hello" --variables '{"lang":"EN","topic":"science"}'
```

### Execute by name

```bash
scorable evaluator execute-by-name "My Evaluator" --request "What is 2+2?" --response "4"
```

Accepts the same options as `execute`, including `--variables`.

## Execution Logs

### List execution logs

```bash
scorable execution-log list
```

Options: `--page-size`, `--cursor`, `--search`, `--evaluator-id`, `--judge-id`, `--model`, `--tags`, `--score-min`, `--score-max`, `--created-at-after`, `--created-at-before`, `--owner-email`

### Get an execution log

```bash
scorable execution-log get <log_id>
```

## OTEL Trace Evaluation Filters

When traces arrive at Scorable's OTLP endpoint, evaluation filters automatically run an evaluator or judge against each matching trace. Results land back on the same trace as a child span carrying the OpenTelemetry GenAI evaluation attributes (`gen_ai.evaluation.name`, `gen_ai.evaluation.score.value`, `gen_ai.evaluation.explanation`).

### Create a filter

```bash
scorable otel-filter create \
  --name "default-truthfulness" \
  --evaluator-id <evaluator-uuid>
```

Required: `--name` and exactly one of `--evaluator-id` or `--judge-id`. A judge target emits one eval span per inner evaluator.

Options: `--filter-criteria` (JSON of conditions), `--sampling-rate` (0.0–1.0, default 1.0), `--delay-seconds` (default 10, allows late spans to land before evaluation), `--inactive`

Match traces from a specific service, run a 5-second-delayed evaluation:

```bash
scorable otel-filter create \
  --name "agent-truthfulness" \
  --evaluator-id <evaluator-uuid> \
  --filter-criteria '{"conditions":[{"column":"resource","type":"string","key":"service.name","operator":"=","value":"my_agent"}]}' \
  --delay-seconds 5
```

Multi-evaluator judge target:

```bash
scorable otel-filter create --name "quality-judge" --judge-id <judge-uuid>
```

### List filters

```bash
scorable otel-filter list
```

### Delete a filter

```bash
scorable otel-filter delete <filter_id>
```

### Custom extractor rules (when input/output isn't in `gen_ai.*`)

For the common case the flags above are everything you need: matching traces are evaluated and their `gen_ai.input.messages` / `gen_ai.output.messages` are fed to the evaluator. If your traces don't follow that shape — Claude Code, OpenInference, custom instrumentations — you tell the evaluator where input/output live by attaching **`extractor_rules`** to the filter. Filters without `extractor_rules` keep the default behavior.

Rules are carried in a YAML manifest and applied with `-f`:

```bash
scorable otel-filter create -f filter.yaml
scorable otel-filter update <id> -f filter.yaml
scorable otel-filter validate -f filter.yaml   # dry-run; exit 2 on schema error
```

CLI flags override values from the file when both are provided.

#### Manifest shape

```yaml
name: <string>
evaluator_id: <uuid> # exactly one of evaluator_id / judge_id
judge_id: <uuid>
sampling_rate: <0.0-1.0> # optional, default 1.0
delay_seconds: <int> # optional, default 10
is_active: <bool> # optional, default true
filter_criteria: # which traces to evaluate (same shape as --filter-criteria)
  conditions:
    - column: <string> # span_name, has_error, kind, status, attribute, resource, …
      operator: <string> # =, !=, contains, starts with, any of, none of, …
      value: <string|number|bool>
      key: <string> # required for "attribute" / "resource" sentinel columns
extractor_rules: # optional; how to extract input/output from matching spans
  - emit: <text|request_response|tool_pair|genai_messages>
    match: # optional; same shape as filter_criteria — empty matches every span
      conditions: [...]
    # … emit-specific fields, see below …
```

#### `extractor_rules` reference

Each rule has an `emit` kind, an optional `match` filter (same shape as `filter_criteria.conditions`), and emit-specific fields. Spans are walked in timestamp order; per span, the **first** rule whose `match` passes wins.

A rule set must be able to produce both user-side and agent-side content (a `request_response` or `genai_messages` rule alone qualifies; a single `text` `role: user` rule does not). Validation rejects sets that can't.

**`text`** — emit one `MessageTurn` per matching span.

```yaml
- emit: text
  match: # optional
    conditions:
      - { column: span_name, operator: "=", value: claude_code.interaction }
  role: user # user | assistant
  locator: # where the value lives
    kind: span_attr # span_attr | event_attr | resource_attr
    key: user_prompt # attribute name
    event_name: <string> # required when kind: event_attr
    value_path: $.foo # optional JSONPath into the located value
  tool_name: <string> # only valid when role: assistant
```

**`request_response`** — emit a user turn + an assistant turn from one span. Common when an agent stores prompt and response as flat attributes (OpenInference's `input.value` / `output.value`).

```yaml
- emit: request_response
  match: { ... } # optional
  input_locator: { kind: span_attr, key: input.value } # → user turn
  output_locator: { kind: span_attr, key: output.value } # → assistant turn
```

**`tool_pair`** — emit one assistant turn per matching span carrying a tool call (input + output combined into the turn content). Built for tool-execution spans like Claude Code's `claude_code.tool` event.

```yaml
- emit: tool_pair
  match: { ... } # optional
  input_locator: { kind: event_attr, event_name: tool.output, key: bash_command }
  output_locator: { kind: event_attr, event_name: tool.output, key: output }
  tool_name: Bash # static; OR
  tool_name_locator: { kind: span_attr, key: tool_name } # dynamic
```

**`genai_messages`** — same parsing as the default extractor, but on attribute keys you choose. Use this if your service emits the standard `gen_ai` JSON-array shape under non-default attribute names.

```yaml
- emit: genai_messages
  match: { ... } # optional
  input_locator: { kind: span_attr, key: my_framework.input.json }
  output_locator: { kind: span_attr, key: my_framework.output.json }
```

#### Locator details

| Field        | Meaning                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `kind`       | `span_attr` (top-level), `event_attr` (inside a named event), or `resource_attr` (resource-level) |
| `key`        | Attribute name to read                                                                            |
| `event_name` | Only for `event_attr` — the OTel event whose attributes to read (e.g. `tool.output`)              |
| `value_path` | Optional JSONPath into the located value; used when the attribute is itself JSON                  |

#### Reference manifests

`examples/otel-filters/`:

- `openinference-agent.yaml` — single-span agent with `input.value` / `output.value` (`request_response`).
- `claude-code.yaml` — Claude Code's interaction span + tool spans (`text` + `tool_pair`).
- `genai-explicit.yaml` — gen_ai messages under custom attribute keys.

## OTEL Trace Querying

### List traces

```bash
scorable otel-trace list
```

Options: `--since` / `--start-time` / `--end-time` (time window), `--page-size`, `--cursor`, `--output table|json|csv` (default `table`), `--filter` (repeatable raw expression), plus convenience shortcuts below.

Convenience flags — cover the common case, AND-combined with each other and with `--filter`:

| Flag                    | Effect                                 |
| ----------------------- | -------------------------------------- |
| `--service-name <name>` | match `resource.service.name = <name>` |
| `--has-error`           | only traces where some span errored    |
| `--root-name <substr>`  | substring match on the root span name  |
| `--span-name <substr>`  | substring match on any span's name     |
| `--agent-name <name>`   | match `gen_ai.agent.name`              |
| `--model <name>`        | match `gen_ai.request.model`           |
| `--tool <name>`         | match `gen_ai.tool.name`               |

Time-window flags (mutually exclusive group):

```bash
scorable otel-trace list --since 1h          # last hour
scorable otel-trace list --since 7d
scorable otel-trace list --start-time 2026-04-30T00:00:00Z --end-time 2026-05-01T00:00:00Z
```

Common one-liners:

```bash
# All traces from a specific agent in the last 24h, exported as CSV
scorable otel-trace list --since 24h --service-name my_agent --output csv > traces.csv

# Errored traces this week
scorable otel-trace list --since 7d --has-error

# Drill into traces that hit a specific tool
scorable otel-trace list --tool fetch_customer_data
```

For anything the shortcuts don't cover, use `--filter` directly. Format: `column;type;key;operator;value`, repeatable, AND-combined. If your instrumentation follows the OpenTelemetry [GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/) — pydantic-ai, OpenLLMetry, Logfire, OpenAI/Anthropic SDKs with otel all do — every documented attribute is filterable without extra setup.

```bash
# Expensive runs — over 5k input tokens
scorable otel-trace list --since 24h \
  --filter 'gen_ai.usage.input_tokens;number;gen_ai.usage.input_tokens;>;5000'

# Multi-turn conversation drill-down
scorable otel-trace list \
  --filter 'gen_ai.conversation.id;string;gen_ai.conversation.id;=;conv_5j66'

# Filter on Scorable's own evaluation result spans
scorable otel-trace list \
  --filter 'gen_ai.evaluation.name;string;gen_ai.evaluation.name;=;Truthfulness'
```

See `scorable otel-trace list --help` for the full column / operator / type reference.

### Inspect spans for a trace

```bash
scorable otel-trace spans <trace_id>
```

Options: `--output table|json|csv`. The JSON form returns the full span payload — attributes, events, status, kind, `resource_attributes` — which is what you typically want for debugging or piping to `jq`.

```bash
scorable otel-trace spans <trace_id> --output json | jq '.[0].span.attributes'
scorable otel-trace spans <trace_id> --output csv > spans.csv
```

## Prompt Testing

Initialize a config file and run experiments:

```bash
scorable pt init
scorable pt run
```

Use a custom config path:

```bash
scorable pt run --config path/to/prompt-tests.yaml
```

The `prompt-test` command is an alias for `pt`.

### Config file format

```yaml
prompts:
  - "Extract info from: {{text}}"

inputs:
  - vars:
      text: "John Doe, john@example.com"

# Or use a dataset instead of inline inputs:
# dataset_id: "<uuid>"

models:
  - gpt-5.4
  - gemini-3-flash

evaluators:
  - name: Precision
  - name: Confidentiality

# Optional: enforce structured output
# response_schema:
#   type: object
#   properties:
#     name: { type: string }
```

Results are displayed in a table and a browser link is printed for the full comparison view.

## Development

```bash
npm install
npm run build       # compile TypeScript
npm test            # run tests
npm run typecheck   # type-check without emitting
npm run lint        # lint with oxlint
npm run fmt         # format with oxfmt
```
