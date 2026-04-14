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
