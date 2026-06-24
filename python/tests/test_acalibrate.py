from typing import Any
from unittest import mock
from unittest.mock import MagicMock

import pytest

from scorable.calibration import ACalibrationExperimentHandle
from scorable.client import Scorable


class AsynchronousMock(MagicMock):
    async def __call__(self, *args: Any, **kwargs: Any) -> Any:
        return super().__call__(*args, **kwargs)


def _experiment(status, rmse=None, tasks=None):
    exp = MagicMock()
    exp.id = "exp-1"
    exp.status = status
    exp.rmse = rmse
    exp.tasks = tasks or []
    return exp


@pytest.mark.asyncio
@mock.patch(
    "scorable.generated.openapi_aclient.api.experiments_api.ExperimentsApi.experiments_calibration_retrieve",
    new_callable=AsynchronousMock,
)
@mock.patch(
    "scorable.generated.openapi_aclient.api.experiments_api.ExperimentsApi.experiments_calibration_create",
    new_callable=AsynchronousMock,
)
async def test_acalibrate__returns_handle_and_waits(mock_create, mock_retrieve):
    mock_create.return_value = _experiment("pending")
    mock_retrieve.return_value = _experiment("completed", rmse=0.2)

    client = Scorable(api_key="fake", run_async=True)
    handle = await client.evaluators.acalibrate(
        prompt="Is {{response}} faithful to {{request}}?",
        model="gpt-4-turbo",
        test_data=[["0.1", "out", "in"]],
    )
    assert isinstance(handle, ACalibrationExperimentHandle)
    await handle.wait(poll_interval=0.0, timeout=5.0)
    assert handle.status == "completed"
    assert handle.rmse == 0.2
    sent = mock_create.call_args.kwargs["calibration_experiment_request"]
    assert sent.prompt == "Is {{response}} faithful to {{request}}?"
    assert sent.inputs == [{"expected_score": "0.1", "response": "out", "request": "in"}]


@pytest.mark.asyncio
@mock.patch(
    "scorable.generated.openapi_aclient.api.experiments_api.ExperimentsApi.experiments_calibration_create",
    new_callable=AsynchronousMock,
)
async def test_acalibrate_existing__posts_evaluator_id(mock_create):
    mock_create.return_value = _experiment("completed", rmse=0.0)
    client = Scorable(api_key="fake", run_async=True)
    handle = await client.evaluators.acalibrate_existing(
        "11111111-1111-1111-1111-111111111111", test_data=[["0.1", "out", "in"]]
    )
    assert handle.id == "exp-1"
    sent = mock_create.call_args.kwargs["calibration_experiment_request"]
    assert str(sent.evaluator_id) == "11111111-1111-1111-1111-111111111111"
