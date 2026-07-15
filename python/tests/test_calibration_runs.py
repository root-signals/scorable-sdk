from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scorable.client import Scorable


@patch("scorable.calibration_runs.CalibrationRunsApi")
def test_create_calibration_run__builds_dataset_source(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.calibration_runs_create.return_value = MagicMock(id="run1", status="pending")

    result = client.calibration_runs.create(evaluator_id="ev1", dataset_id="ds1", score_config_id="sc1")

    assert result.id == "run1"
    request = instance.calibration_runs_create.call_args.kwargs["calibration_run_create_request"]
    assert request.evaluator_external_id == "ev1"
    assert request.score_config_id == "sc1"
    assert request.source.dataset_id == "ds1"
    assert request.source.type == "dataset"


@patch("scorable.calibration_runs.CalibrationRunsApi")
def test_get_calibration_run__returns_run(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.calibration_runs_retrieve.return_value = MagicMock(id="run1", status="completed")

    result = client.calibration_runs.get("run1")

    assert result.status == "completed"
    assert instance.calibration_runs_retrieve.call_args.kwargs["id"] == "run1"


@patch("scorable.calibration_runs.CalibrationRunsApi")
def test_list_calibration_runs__filters_by_evaluator(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.calibration_runs_list.return_value = MagicMock(results=[MagicMock(id="run1")], next=None)

    result = list(client.calibration_runs.list(evaluator_id="ev1"))

    assert [r.id for r in result] == ["run1"]
    assert instance.calibration_runs_list.call_args.kwargs["evaluator_external_id"] == "ev1"


@patch("scorable.calibration_runs.CalibrationRunsApi")
def test_list_items__returns_per_example_results(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.calibration_runs_items_list.return_value = MagicMock(results=[MagicMock(id="i1")], next=None)

    result = list(client.calibration_runs.list_items("run1"))

    assert [i.id for i in result] == ["i1"]
    assert instance.calibration_runs_items_list.call_args.kwargs["id"] == "run1"


@pytest.mark.asyncio
@patch("scorable.calibration_runs.ACalibrationRunsApi")
async def test_acreate_calibration_run__builds_dataset_source(mock_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_api.return_value
    instance.calibration_runs_create = AsyncMock(return_value=MagicMock(id="run-async", status="pending"))

    result = await client.calibration_runs.acreate(evaluator_id="ev1", dataset_id="ds1")

    assert result.id == "run-async"
    request = instance.calibration_runs_create.call_args.kwargs["calibration_run_create_request"]
    assert request.source.dataset_id == "ds1"
