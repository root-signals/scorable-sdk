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
