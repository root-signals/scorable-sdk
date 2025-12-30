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
