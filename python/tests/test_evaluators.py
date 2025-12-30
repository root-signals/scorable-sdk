from unittest.mock import AsyncMock, patch

import pytest

from scorable.client import Scorable


@pytest.mark.asyncio
@patch("scorable.skills.EvaluatorsApi")
async def test_run_evaluator_with_tracking_params(mock_evaluators_api):
    client = Scorable(api_key="fake")
    instance = mock_evaluators_api.return_value
    instance.evaluators_execute_create.return_value = "mock_success"

    result = client.evaluators.run(
        "evaluator-id-123",
        response="test_response",
        user_id="user-123",
        session_id="session-456",
        system_prompt="You are a helpful assistant.",
    )

    assert result == "mock_success"
    mock_evaluators_api.assert_called_once()
    instance.evaluators_execute_create.assert_called_once()
    call_args = instance.evaluators_execute_create.call_args
    assert call_args.kwargs["id"] == "evaluator-id-123"
    execution_request = call_args.kwargs["evaluator_execution_request"]
    assert execution_request.response == "test_response"
    assert execution_request.user_id == "user-123"
    assert execution_request.session_id == "session-456"
    assert execution_request.system_prompt == "You are a helpful assistant."


@pytest.mark.asyncio
@patch("scorable.skills.AEvaluatorsApi")
async def test_arun_evaluator_with_tracking_params(mock_aevaluators_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_aevaluators_api.return_value
    instance.evaluators_execute_create = AsyncMock(return_value="mock_success")

    result = await client.evaluators.arun(
        "evaluator-id-123",
        response="test_response",
        user_id="user-123",
        session_id="session-456",
        system_prompt="You are a helpful assistant.",
    )

    assert result == "mock_success"
    mock_aevaluators_api.assert_called_once()
    instance.evaluators_execute_create.assert_called_once()
    call_args = instance.evaluators_execute_create.call_args
    assert call_args.kwargs["id"] == "evaluator-id-123"
    execution_request = call_args.kwargs["evaluator_execution_request"]
    assert execution_request.response == "test_response"
    assert execution_request.user_id == "user-123"
    assert execution_request.session_id == "session-456"
    assert execution_request.system_prompt == "You are a helpful assistant."


@pytest.mark.asyncio
@patch("scorable.skills.EvaluatorsApi")
async def test_run_evaluator_by_name_with_tracking_params(mock_evaluators_api):
    client = Scorable(api_key="fake")
    instance = mock_evaluators_api.return_value
    instance.evaluators_execute_by_name_create.return_value = "mock_success"

    result = client.evaluators.run_by_name(
        "test_evaluator",
        response="test_response",
        user_id="user-123",
        session_id="session-456",
        system_prompt="You are a helpful assistant.",
    )

    assert result == "mock_success"
    mock_evaluators_api.assert_called_once()
    instance.evaluators_execute_by_name_create.assert_called_once()
    call_args = instance.evaluators_execute_by_name_create.call_args
    assert call_args.kwargs["name"] == "test_evaluator"
    execution_request = call_args.kwargs["evaluator_execution_request"]
    assert execution_request.response == "test_response"
    assert execution_request.user_id == "user-123"
    assert execution_request.session_id == "session-456"
    assert execution_request.system_prompt == "You are a helpful assistant."


@pytest.mark.asyncio
@patch("scorable.skills.AEvaluatorsApi")
async def test_arun_evaluator_by_name_with_tracking_params(mock_aevaluators_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_aevaluators_api.return_value
    instance.evaluators_execute_by_name_create = AsyncMock(return_value="mock_success")

    result = await client.evaluators.arun_by_name(
        "test_evaluator",
        response="test_response",
        user_id="user-123",
        session_id="session-456",
        system_prompt="You are a helpful assistant.",
    )

    assert result == "mock_success"
    mock_aevaluators_api.assert_called_once()
    instance.evaluators_execute_by_name_create.assert_called_once()
    call_args = instance.evaluators_execute_by_name_create.call_args
    assert call_args.kwargs["name"] == "test_evaluator"
    execution_request = call_args.kwargs["evaluator_execution_request"]
    assert execution_request.response == "test_response"
    assert execution_request.user_id == "user-123"
    assert execution_request.session_id == "session-456"
    assert execution_request.system_prompt == "You are a helpful assistant."
