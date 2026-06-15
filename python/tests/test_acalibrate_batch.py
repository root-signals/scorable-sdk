from typing import Any
from unittest import mock
from unittest.mock import MagicMock

import pytest

from scorable.calibration import ACalibrationExperimentHandle
from scorable.client import Scorable
from scorable.skills import ACalibrateBatchParameters


class AsynchronousMock(MagicMock):
    async def __call__(self, *args: Any, **kwargs: Any) -> Any:
        return super().__call__(*args, **kwargs)


def _task(score, expected):
    t = MagicMock()
    t.score = score
    t.expected_score = expected
    return t


def _experiment(tasks, status="completed"):
    exp = MagicMock()
    exp.id = "exp-1"
    exp.status = status
    exp.rmse = None
    exp.tasks = tasks
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
async def test_acalibrate_batch__aggregates_rmse_per_model_and_prompt(mock_create, mock_retrieve):
    tasks = [_task(0.8, 0.75), _task(0.9, 0.55)]
    mock_create.return_value = _experiment(tasks)
    mock_retrieve.return_value = _experiment(tasks)

    client = Scorable(api_key="fake", run_async=True)
    params = [
        ACalibrateBatchParameters(
            name="a",
            prompt="P",
            model="gpt-4",
            reference_variables=None,
            input_variables=None,
        ),
    ]
    result = await client.evaluators.acalibrate_batch(
        evaluator_definitions=params, test_data=[["0.75", "o"], ["0.55", "o2"]]
    )
    assert result.rms_errors_model["gpt-4"] == pytest.approx(0.2496, rel=1e-2)
    assert result.rms_errors_prompt["P"] == pytest.approx(0.2496, rel=1e-2)
    assert len(result.results) == 1
    assert isinstance(result.results[0], ACalibrationExperimentHandle)
