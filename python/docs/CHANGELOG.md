## 1.13.0

Adds the annotation-store resources for labelling datasets and calibrating evaluators.

- Add `client.annotations` — `create`/`get`/`list`/`update`/`delete` annotations (published or draft) on dataset items (sync + async). Omitting `score_config_id` uses the global identity "Score" config, so a raw expected score can be set with just `value`.
- Add `client.score_configs` — `create`/`get`/`list`/`update`/`delete` score configs (continuous, binary, categorical) that define how labels map to scores (sync + async).
- Add dataset items on `client.datasets` — `add_item`/`add_items`, `get_item`, `list_items`, `update_item`, `archive_item` (sync + async) — to build labelled datasets programmatically.
- Add `client.calibration_runs` — start a calibration run and read its results: `create`, `get`, `list`, and `list_items` (sync + async). Each `CalibrationRunItem` exposes the `human_value` and `evaluator_score`, their `disagreement`, and the `request`/`response` that was scored.
- Add `evaluators.calibrate_run()` / `acalibrate_run()` to run calibration against a labelled dataset and measure agreement. See `examples/calibration.py`.
- The evaluator calibration helpers were reworked around the resources above; if you used a previous calibration method, switch to `evaluators.calibrate_run()` + `client.calibration_runs`.

## 1.12.0

- Add `Projects` resource (`client.projects`) with `list`/`retrieve`/`create`/`update`/`delete` (sync and async). Supports `is_default` for promoting a project as the org default.
- Add optional `project_id` to execution methods (`Judge.run`/`arun`, `Judges.run`/`arun`/`run_by_name`/`arun_by_name`/`generate`/`agenerate`, `Evaluator.run`/`arun`, `Evaluators.run`/`arun`/`run_by_name`/`arun_by_name`, preset evaluator runners). Routes the resulting execution log to the specified project; falls back to org default when omitted.
- Add optional `project_id` query filter to list methods (`Judges.list`/`alist`, `Evaluators.list`/`alist`, `DataSets.list`/`alist`, `ExecutionLogs.list`/`alist`, `Objectives.list`/`alist`).
- Add optional `project_id` to create methods (`Judges.create`/`acreate`/`generate`/`agenerate`, `Evaluators.create`/`acreate`, `DataSets.create`/`acreate`, `Objectives.create`/`acreate`).
- Add `project_id` to update methods on `Judges`, `Evaluators`, and `Objectives` to move a resource between projects within the same organization.
- Response models now expose nullable `project_id` (`None` for public resources owned by other orgs).
- Fix `tools` parameter not being forwarded by `judges.run`/`arun`/`run_by_name`/`arun_by_name`; the 1.11.0 release exposed `tools` on skills/evaluators only.

## 1.11.0

- Add `tools` parameter (OpenAI-style tool catalog) to `evaluators.run`/`arun`/`run_by_name`/`arun_by_name`, `judges.run`/`arun`, and preset evaluator runners. Enables tool-aware evaluators like `Tool_Selection`.
- Add `Tool_Selection` and `Knowledge_Retention` preset evaluator enum entries.
- Multi-turn conversation turns: `content` is now nullable, and turns can carry structured `tool_calls` (assistant) and `tool_call_id` (new `tool` role) — see updated `examples/judge_multi_turn.py` and `examples/multi_turn_conversation.py`.

## 1.10.0

- Rename `predicate` parameter to `scoring_criteria` in `Evaluators.create()`, `acreate()`, `update()`, and `aupdate()`

## 1.9.1

- Patch high-severity dependency vulnerability (urllib3 2.7.0 — CVE-2026-44431: sensitive headers forwarded in proxied redirects, decompression-bomb bypass)

## 1.9.0

- Add file upload support

## 1.8.0

- Simplify visibility model: replace multi-value `status` field with `private`/`public` visibility
- Remove `status` parameter from judge and evaluator creation
- Update `generate()`/`agenerate()` visibility to accept `"private"`, `"public"`, `"global"` (default: `"private"`)
- Remove deprecated RAGAS preset evaluators: `Answer_Relevance`, `Answer_Semantic_Similarity`, `Context_Precision`, `Context_Recall`, `Answer_Correctness`
- Remove `pii_filter`, `reference_variables`, `model_params`, `system_message` from skills API

## 1.7.2

- Patch high-severity dependency vulnerabilities (cryptography 46.0.5, urllib3 2.6.3)

## 1.7.1

- Simplify multi-turn api

## 1.7.0

- Add multi-turn conversation evaluation support

## 1.6.7

- Add user_id and session_id to evaluator and judge runs

## 1.6.6

- Remove functions field from evaluator requests

## 1.6.5

- Rebrand to scorable

## 1.6.4

### Added

- Status field to judges

## 1.6.3

### Added

- Add execute judge by name

### Changed

- Required evaluator inputs

## 1.6.2

### Added

- New execution log fields

## 1.6.1

### Added

- Added judge create method

## 1.6.0

### Added

- Added judge generate method.

### Changed

- Promoted judges out of beta.
- New signature for evaluator inputs.

### Removed

- Operational skills

## 1.5.4

### Added

- Added four new scorable evaluators


## 1.5.3

### Added

- Added `requires_contexts`, `requires_functions`, and `requires_expected_output` to evaluator list output

### Removed

- Removed data loaders. Input variables to be used as replacements for data loaders.

## 1.5.2

### Added

- Added evaluator execution by name

### Changed

- Evaluator uses new endpoints instead of deprecated ones in all functions

## 1.5.1

### Added

- Added 'include' parameter to listing execution logs to include optional fields

### Changed

- Dropped support for running only skill validators

## 1.5.0

### Added

- Added tags to evaluator and judge runs
- Added tag filtering to execution logs

### Changed

- Renamed the evaluator demonstration output and prompt parameters

## 1.4.0  

### Added
  - Introduced beta namespace for the client.  
  - Judges functionality for improved AI evaluation.  
  - Score field is now optional in `ExecutionLogList`.  
  - Colab example links for better accessibility.  
  - Refined example code formatting.  
  - Enhanced async usage documentation.  
  - Renamed custom evaluator for clarity.  



## 1.3.3

### Added

- Evaluators list and get methods
- Improved docstrings for the SDK

## 1.3.2

### Added

- Support 'items' property in the function passed to the JSON Schema evaluators

## 1.3.1

### Added

- Added asynchronous client and methods
- Support additional variables for custom evaluators
