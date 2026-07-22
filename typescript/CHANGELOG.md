## 0.12.1

Fixes `executionLogs` filtering. Several filters were sent under param names the API doesn't accept — they silently returned unfiltered results before, and now hard-400 against the API's strict param validation.

- `executionLogs.list()` and the `getBy*` helpers now translate every filter onto the API's real query-param name: `score_min`/`score_max` → `min_score`/`max_score`, `cost_min`/`cost_max` → `min_cost`/`max_cost`, `created_at_after`/`created_at_before` → `date_from`/`date_to`, `skill_id`/`evaluator_id` → `executed_item_id`, `owner__email` → `owner_email`. The public param names are unchanged, so no call sites need to change.
- Passing both `skill_id` and `evaluator_id` (they map to the same field) now throws a 400 `ScorableError` instead of silently dropping one.
- Bump `openapi-fetch` to 0.17.0; build under TypeScript 6.

## 0.12.0

Adds the annotation-store resources for labelling datasets and calibrating evaluators.

- Add `client.annotations` — `create`/`get`/`list`/`update`/`delete` annotations (published or draft) on dataset items. Omitting `scoreConfigId` uses the global identity "Score" config, so a raw expected score can be set with just `value`.
- Add `client.scoreConfigs` — `create`/`get`/`list`/`update`/`delete` score configs (continuous, binary, categorical) that define how labels map to scores.
- Add dataset items on `client.datasets` — `addItem`/`addItems`, `getItem`, `listItems`, `updateItem`, `archiveItem` — to build labelled datasets programmatically.
- Add `client.calibrationRuns` — start a calibration run and read its results: `create`, `get`, `list`, and `listItems`. Each calibration run item exposes the `human_value` and `evaluator_score`, their `disagreement`, and the `request`/`response` that was scored.
- Add `evaluators.calibrateRun()` to run calibration against a labelled dataset and measure agreement.

## 0.11.0

- Add `projects` resource on the client (`client.projects`) with `list`/`get`/`create`/`update`/`delete`. Supports `is_default` for promoting a project as the org default.
- Add optional `projectId` to `ExecutionPayload` (used by `evaluators.execute()` and `judges.run()`). Routes the resulting execution log to the specified project.
- Add optional `projectId` to list method option types on judges, evaluators, datasets, objectives, and execution-logs.
- Add optional `projectId` to create method option types on judges (create / generate / duplicate), evaluators (create / duplicate), datasets (upload metadata), and objectives.
- Add optional `projectId` to update method option types on judges, evaluators, and objectives — moves the resource between projects within the same organization.
- Response types expose nullable `project_id` via OpenAPI regeneration (`null` for public resources owned by other orgs).

## 0.10.0

- Add `tools` field (OpenAI-style tool catalog) to `ExecutionPayload`. Enables tool-aware evaluators like Tool Selection.
- Multi-turn conversation turns (`MessageTurnRequest`): `content` is now nullable, with new `tool_calls` (assistant) and `tool_call_id` fields, and a new `tool` role — see updated README multi-turn example.

## 0.9.0

- Add `SCORABLE_API_URL` environment variable support for configuring the API base URL (on-prem deployments)

## 0.8.0

- Rename `EvaluatorCreateParams.predicate` → `scoring_criteria`
- Rename `EvaluatorUpdateParams.prompt` → `scoring_criteria`
- Rename `Evaluator.prompt`, `EvaluatorListOutput.prompt`, `EvaluatorRequest.prompt`, `PatchedEvaluatorRequest.prompt` → `scoring_criteria` in generated types

## 0.7.0

- Add `models.verify(...)` to test an unsaved LLM model configuration via `POST /v1/models/verify/`. Exposes `VerifyModelData` and `VerifyModelResponse` types.
- Add `file_id` to `JudgeGenerateParams` so callers can attach an uploaded document to judge generation. Optional, defaults to `null`.
- Remove `ModelListParams` (type-only breaking change). `models.list(...)` now accepts the shared `ListParams` — the previous `name`/`vendor` fields were not supported by the API.

## 0.6.1

- Patch high-severity dependency vulnerabilities (fast-uri 3.1.2 — host confusion via percent-encoded authority delimiters, path traversal via percent-encoded dot segments)

## 0.6.0

- Add file upload support

## 0.5.0

- Simplify visibility model: replace multi-value `status` field with `private`/`public` visibility
- Remove `status` from `EvaluatorCreateParams`, `EvaluatorUpdateParams`, and `CreateJudgeData`
- Remove `updateStatus()` from `DatasetsResource`
- Update `judges.generate()` default visibility to `"private"`; accept `"private"`, `"public"`, `"global"`
- Replace `is_public` list filter with `include_public` for evaluators and judges
- Add required `variables` default (`{}`) to evaluator execute calls

## 0.4.0

- Add `evaluators.exportYaml(id)` method to export an evaluator as a portable YAML string
- Add `EvaluatorDemonstration` type export
- Add `evaluator_demonstrations` field to `EvaluatorCreateParams`

## 0.3.2

- Patch high-severity dependency vulnerabilities (undici 7.24+, flatted 3.4.2+, minimatch, rollup 4.59+)

## 0.3.1

- Expose `visibility`, `generating_model_params`, `judge_id`, `extra_contexts`, and `enable_context_aware_evaluators` in `judges.generate()`
- Fix `judges.generate()` return type to include `stages` and `missing_context_from_system_goal`
- Add `JudgeGenerateParams` and `JudgeGeneratorResponse` as exported types

## 0.3.0

- Add update() and delete() methods to EvaluatorsResource

## 0.2.1

- Simplify multi-turn api

## 0.2.0

- Add multi-turn conversation evaluation support

## 0.1.6

- Add user_id and session_id to evaluator and judge runs

## 0.1.5

- Remove functions field from evaluator requests

## 0.1.4

- Rebrand to scorable

## 0.1.3

### Added

- Status field to judges

## 0.1.2

### Changed

- Bump form-data to 4.0.4 (optional dependency)
- Bump undici to 7.12.0 (optional dependency)


## 0.1.1

### Added

- Initial release
