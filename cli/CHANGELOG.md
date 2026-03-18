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
