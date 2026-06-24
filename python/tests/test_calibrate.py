from typing import Generator
from unittest.mock import MagicMock, patch

import pytest

from scorable.calibration import CalibrationExperimentHandle
from scorable.client import Scorable


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


def _experiment(status, rmse=None, tasks=None):
    exp = MagicMock()
    exp.id = "exp-1"
    exp.status = status
    exp.rmse = rmse
    exp.tasks = tasks or []
    return exp


def test_calibrate__returns_handle_and_waits_to_completion(mock_create, mock_retrieve):
    mock_create.return_value = _experiment("pending")
    mock_retrieve.return_value = _experiment("completed", rmse=0.2)

    client = Scorable(api_key="fake")
    handle = client.evaluators.calibrate(
        prompt="Is {{response}} faithful to {{request}}?",
        model="gpt-4-turbo",
        test_data=[["0.1", "out", "in"]],
    )
    assert isinstance(handle, CalibrationExperimentHandle)
    assert handle.id == "exp-1"

    handle.wait(poll_interval=0.0, timeout=5.0)
    assert handle.status == "completed"
    assert handle.rmse == 0.2
    sent = mock_create.call_args.kwargs["calibration_experiment_request"]
    assert sent.prompt == "Is {{response}} faithful to {{request}}?"
    assert sent.inputs == [{"expected_score": "0.1", "response": "out", "request": "in"}]


def test_calibrate__wait_returns_on_failed_status(mock_create, mock_retrieve):
    mock_create.return_value = _experiment("pending")
    mock_retrieve.return_value = _experiment("failed")

    client = Scorable(api_key="fake")
    handle = client.evaluators.calibrate(prompt="P {{response}}", model="gpt-4-turbo", test_data=[["0.1", "out"]])
    handle.wait(poll_interval=0.0, timeout=5.0)
    assert handle.status == "failed"


def test_calibrate__requires_exactly_one_of_test_data_or_dataset():
    client = Scorable(api_key="fake")
    with pytest.raises(ValueError):
        client.evaluators.calibrate(prompt="P {{response}}", model="gpt-4-turbo")
    with pytest.raises(ValueError):
        client.evaluators.calibrate(
            prompt="P {{response}}", model="gpt-4-turbo", test_dataset_id="d", test_data=[["0.1", "o"]]
        )


def test_calibrate__passes_dataset_id_when_test_dataset_id_given(mock_create, mock_retrieve):
    mock_create.return_value = _experiment("completed", rmse=0.0)

    client = Scorable(api_key="fake")
    client.evaluators.calibrate(prompt="P {{response}}", model="gpt-4-turbo", test_dataset_id="ds-1")
    sent = mock_create.call_args.kwargs["calibration_experiment_request"]
    assert sent.dataset_id == "ds-1"
    assert sent.inputs is None


def test_calibrate_existing__posts_evaluator_id(mock_create, mock_retrieve):
    mock_create.return_value = _experiment("completed", rmse=0.0)
    client = Scorable(api_key="fake")
    handle = client.evaluators.calibrate_existing(
        "11111111-1111-1111-1111-111111111111",
        test_data=[["0.1", "out", "in"]],
    )
    assert handle.id == "exp-1"
    sent = mock_create.call_args.kwargs["calibration_experiment_request"]
    assert str(sent.evaluator_id) == "11111111-1111-1111-1111-111111111111"
