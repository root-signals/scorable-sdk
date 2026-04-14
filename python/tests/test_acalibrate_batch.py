from typing import Any
from unittest import mock
from unittest.mock import MagicMock

import pytest

from scorable.client import Scorable
from scorable.generated.openapi_aclient.models.evaluator_calibration_output import EvaluatorCalibrationOutput
from scorable.generated.openapi_aclient.models.evaluator_calibration_result import EvaluatorCalibrationResult
from scorable.skills import ACalibrateBatchParameters


class AsynchronousMock(MagicMock):
    async def __call__(self, *args: Any, **kwargs: Any) -> Any:
        return super(AsynchronousMock, self).__call__(*args, **kwargs)


@pytest.mark.asyncio
@mock.patch(
    "scorable.generated.openapi_aclient.api.evaluators_api.EvaluatorsApi.evaluators_calibrate_create",
    new_callable=AsynchronousMock,
)
async def test_acalibrate_evaluator_batch(mock_skills_calibrate_api: AsynchronousMock) -> None:
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

    client = Scorable(api_key="fake", run_async=True)

    params = [
        ACalibrateBatchParameters(
            name="With gpt-4",
            prompt="What is the weather today?",
            model="gpt-4",
            reference_variables=None,
            input_variables=None,
        ),
        ACalibrateBatchParameters(
            name="With gpt-4-turbo",
            prompt="What is the weather today?",
            model="gpt-4-turbo",
            reference_variables=None,
            input_variables=None,
        ),
    ]

    result = await client.evaluators.acalibrate_batch(
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
