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

The `scorable` CLI is a command-line tool for interacting with the Scorable API. It lets you manage and execute Judges and run prompt testing experiments directly from the terminal.

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

Set your Scorable API key as an environment variable:

```bash
export SCORABLE_API_KEY="your-api-key"
```

Get a free API key at [scorable.ai/register](https://scorable.ai/register).

### Temporary API keys

If no API key is set, the CLI will offer to create a temporary key interactively (in TTY sessions) and save it to `~/.scorable/settings.json`. The `SCORABLE_API_KEY` environment variable always takes precedence.

## Judge Management

### List judges

```bash
scorable judge list
```

Options: `--page-size`, `--cursor`, `--search`, `--name`, `--ordering`, `--is-preset / --not-is-preset`, `--is-public / --not-is-public`, `--show-global / --not-show-global`

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

Options: `--request`, `--response`, `--contexts` (JSON list), `--expected-output`, `--tag` (repeatable), `--user-id`, `--session-id`, `--system-prompt`

Pipe input via stdin:

```bash
echo "Paris" | scorable judge execute <judge_id> --request "What is the capital of France?"
cat response.txt | scorable judge execute <judge_id>
```

### Execute by name

```bash
scorable judge execute-by-name "My Judge" --request "What is the capital of France?" --response "Paris"
```

Accepts the same options as `execute`. Stdin piping works the same way.

### Execute via OpenAI-compatible API

```bash
scorable judge exec-openai <judge_id> \
  --model gpt-4o \
  --messages '[{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there"}]'
```

Generic variant (judge ID in the `model` field):

```bash
scorable judge exec-openai-generic \
  --model <judge_id_or_name> \
  --messages '[{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there"}]'
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
