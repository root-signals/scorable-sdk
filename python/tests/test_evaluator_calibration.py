from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scorable.client import Scorable


@patch("scorable.skills.CalibrationRunsApi")
def test_calibrate_run__starts_run_against_dataset(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.calibration_runs_create.return_value = MagicMock(id="run1", status="pending")

    result = client.evaluators.calibrate_run("ev1", dataset_id="ds1", score_config_id="sc1")

    assert result.id == "run1"
    request = instance.calibration_runs_create.call_args.kwargs["calibration_run_create_request"]
    assert request.evaluator_external_id == "ev1"
    assert request.score_config_id == "sc1"
    assert request.source.dataset_id == "ds1"
    assert request.source.type == "dataset"


@pytest.mark.asyncio
@patch("scorable.skills.ACalibrationRunsApi")
async def test_acalibrate_run__starts_run_against_dataset(mock_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_api.return_value
    instance.calibration_runs_create = AsyncMock(return_value=MagicMock(id="run-async", status="pending"))

    result = await client.evaluators.acalibrate_run("ev1", dataset_id="ds1")

    assert result.id == "run-async"
    request = instance.calibration_runs_create.call_args.kwargs["calibration_run_create_request"]
    assert request.source.dataset_id == "ds1"


@patch("scorable.skills.Evaluator._wrap", side_effect=lambda obj, client_context: obj)
@patch("scorable.skills.EvaluatorsApi")
def test_create_evaluator__sends_demonstration_dataset_id(mock_api, _mock_wrap):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.evaluators_create.return_value = MagicMock(id="ev1")

    client.evaluators.create("criteria", objective_id="obj1", demonstration_dataset_id="ds1")

    request = instance.evaluators_create.call_args.kwargs["evaluator_request"]
    assert request.demonstration_dataset_id == "ds1"


@patch("scorable.skills.Evaluator._wrap", side_effect=lambda obj, client_context: obj)
@patch("scorable.skills.EvaluatorsApi")
def test_update_evaluator__sends_demonstration_dataset_id(mock_api, _mock_wrap):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.evaluators_partial_update.return_value = MagicMock(id="ev1")

    client.evaluators.update("ev1", demonstration_dataset_id="ds1")

    request = instance.evaluators_partial_update.call_args.kwargs["patched_evaluator_request"]
    assert request.demonstration_dataset_id == "ds1"


def test_evaluators__legacy_calibrate_methods_removed():
    client = Scorable(api_key="fake")
    for gone in ("calibrate_existing", "acalibrate_existing", "calibrate_batch", "acalibrate_batch"):
        assert not hasattr(client.evaluators, gone)
