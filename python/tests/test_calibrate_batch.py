from typing import Generator
from unittest.mock import MagicMock, patch

import pytest

from scorable.client import Scorable
from scorable.skills import CalibrateBatchParameters


def _task(score, expected):
    t = MagicMock()
    t.score = score
    t.expected_score = expected
    return t


def _experiment(tasks):
    exp = MagicMock()
    exp.id = "exp"
    exp.status = "completed"
    exp.rmse = None
    exp.tasks = tasks
    return exp


@pytest.fixture
def mock_create() -> Generator[MagicMock, None, None]:
    with patch(
        "scorable.generated.openapi_client.api.experiments_api.ExperimentsApi.experiments_calibration_create"
    ) as mock:
        yield mock


@pytest.fixture
def mock_retrieve() -> Generator[MagicMock, None, None]:
    with patch(
        "scorable.generated.openapi_client.api.experiments_api.ExperimentsApi.experiments_calibration_retrieve"
    ) as mock:
        yield mock


def test_calibrate_batch__aggregates_rmse_per_model_and_prompt(mock_create, mock_retrieve):
    mock_create.return_value = _experiment([_task(0.8, 0.75), _task(0.9, 0.55)])
    mock_retrieve.return_value = _experiment([_task(0.8, 0.75), _task(0.9, 0.55)])

    client = Scorable(api_key="fake")
    params = [
        CalibrateBatchParameters(prompt="P", model="gpt-4", reference_variables=None, input_variables=None),
    ]
    result = client.evaluators.calibrate_batch(evaluator_definitions=params, test_data=[["0.75", "o"], ["0.55", "o2"]])
    # sqrt(((0.8-0.75)^2 + (0.9-0.55)^2)/2)
    assert result.rms_errors_model["gpt-4"] == pytest.approx(0.2496, rel=1e-2)
    assert result.rms_errors_prompt["P"] == pytest.approx(0.2496, rel=1e-2)
    assert len(result.results) == 1
