from typing import Generator
from unittest.mock import MagicMock, patch

import pytest

from scorable.client import Scorable
from scorable.generated.openapi_client.models.evaluator_calibration_output import EvaluatorCalibrationOutput
from scorable.generated.openapi_client.models.evaluator_calibration_result import EvaluatorCalibrationResult
from scorable.skills import CalibrateBatchParameters


@pytest.fixture
def mock_skills_calibrate_api() -> Generator[MagicMock, None, None]:
    with patch(
        "scorable.generated.openapi_client.api.evaluators_api.EvaluatorsApi.evaluators_calibrate_create"  # noqa: E501
    ) as mock:
        yield mock


def test_calibrate_evaluator_batch(mock_skills_calibrate_api: MagicMock) -> None:
    mock_skills_calibrate_api.return_value = [
        EvaluatorCalibrationOutput(
            result=EvaluatorCalibrationResult(
                score=0.8,
                expected_score=0.75,
                llm_output="output",
                model="gpt-4",
                rendered_prompt="What is the weather today?",
                cost=0.1,
                execution_log_id="1",
            ),
            row_number=1,
            variables={},
        ),
        EvaluatorCalibrationOutput(
            result=EvaluatorCalibrationResult(
                score=0.9,
                expected_score=0.55,
                llm_output="output",
                model="gpt-4",
                rendered_prompt="What is the weather today?",
                cost=0.1,
                execution_log_id="2",
            ),
            row_number=2,
            variables={},
        ),
    ]

    client = Scorable(api_key="fake")

    params = [
        CalibrateBatchParameters(
            name="With gpt-4",
            prompt="What is the weather today?",
            model="gpt-4",
            reference_variables=None,
            input_variables=None,
        ),
        CalibrateBatchParameters(
            name="With gpt-4-turbo",
            prompt="What is the weather today?",
            model="gpt-4-turbo",
            reference_variables=None,
            input_variables=None,
        ),
    ]

    result = client.evaluators.calibrate_batch(
        evaluator_definitions=params, test_data=[["0.4", "LLM output"], ["0.6", "LLM output 2"]]
    )

    assert result.rms_errors_model == {
        "gpt-4": pytest.approx(0.2499, rel=1e-3),
        "gpt-4-turbo": pytest.approx(0.2499, rel=1e-3),
    }

    assert result.mae_errors_model == {
        "gpt-4": pytest.approx(0.2, rel=1e-3),
        "gpt-4-turbo": pytest.approx(0.2, rel=1e-3),
    }

    assert result.rms_errors_prompt == {
        "What is the weather today?": pytest.approx(0.25, rel=1e-3),
    }
    assert len(result.results) == 4
