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
  - gpt-4o-mini
  - gemini-2.5-flash-lite

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
