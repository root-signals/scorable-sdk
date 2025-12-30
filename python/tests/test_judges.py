from unittest.mock import AsyncMock, patch

import pytest

from scorable.client import Scorable


@pytest.mark.asyncio
@patch("scorable.judges.JudgesApi")
async def test_run_judge_by_name(mock_judges_api):
    client = Scorable(api_key="fake")
    instance = mock_judges_api.return_value
    instance.judges_execute_by_name_create.return_value = "mock_success"

    result = client.judges.run_by_name("test_judge", response="test_response")

    assert result == "mock_success"
    mock_judges_api.assert_called_once()
    instance.judges_execute_by_name_create.assert_called_once()
    call_args = instance.judges_execute_by_name_create.call_args
    assert call_args.kwargs["name"] == "test_judge"
    assert call_args.kwargs["judge_execution_request"].response == "test_response"


@pytest.mark.asyncio
@patch("scorable.judges.AJudgesApi")
async def test_arun_judge_by_name(mock_ajudges_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_ajudges_api.return_value
    instance.judges_execute_by_name_create = AsyncMock(return_value="mock_success")

    result = await client.judges.arun_by_name("test_judge", response="test_response")

    assert result == "mock_success"
    mock_ajudges_api.assert_called_once()
    instance.judges_execute_by_name_create.assert_called_once()
    call_args = instance.judges_execute_by_name_create.call_args
    assert call_args.kwargs["name"] == "test_judge"
    assert call_args.kwargs["judge_execution_request"].response == "test_response"


@pytest.mark.asyncio
@patch("scorable.judges.JudgesApi")
async def test_run_judge_by_name_with_tracking_params(mock_judges_api):
    client = Scorable(api_key="fake")
    instance = mock_judges_api.return_value
    instance.judges_execute_by_name_create.return_value = "mock_success"

    result = client.judges.run_by_name(
        "test_judge",
        response="test_response",
        user_id="user-123",
        session_id="session-456",
        system_prompt="You are a helpful assistant.",
    )

    assert result == "mock_success"
    mock_judges_api.assert_called_once()
    instance.judges_execute_by_name_create.assert_called_once()
    call_args = instance.judges_execute_by_name_create.call_args
    assert call_args.kwargs["name"] == "test_judge"
    execution_request = call_args.kwargs["judge_execution_request"]
    assert execution_request.response == "test_response"
    assert execution_request.user_id == "user-123"
    assert execution_request.session_id == "session-456"
    assert execution_request.system_prompt == "You are a helpful assistant."


@pytest.mark.asyncio
@patch("scorable.judges.AJudgesApi")
async def test_arun_judge_by_name_with_tracking_params(mock_ajudges_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_ajudges_api.return_value
    instance.judges_execute_by_name_create = AsyncMock(return_value="mock_success")

    result = await client.judges.arun_by_name(
        "test_judge",
        response="test_response",
        user_id="user-123",
        session_id="session-456",
        system_prompt="You are a helpful assistant.",
    )

    assert result == "mock_success"
    mock_ajudges_api.assert_called_once()
    instance.judges_execute_by_name_create.assert_called_once()
    call_args = instance.judges_execute_by_name_create.call_args
    assert call_args.kwargs["name"] == "test_judge"
    execution_request = call_args.kwargs["judge_execution_request"]
    assert execution_request.response == "test_response"
    assert execution_request.user_id == "user-123"
    assert execution_request.session_id == "session-456"
    assert execution_request.system_prompt == "You are a helpful assistant."


@pytest.mark.asyncio
@patch("scorable.judges.JudgesApi")
async def test_run_judge_with_tracking_params(mock_judges_api):
    client = Scorable(api_key="fake")
    instance = mock_judges_api.return_value
    instance.judges_execute_create.return_value = "mock_success"

    result = client.judges.run(
        "judge-id-123",
        response="test_response",
        user_id="user-123",
        session_id="session-456",
        system_prompt="You are a helpful assistant.",
    )

    assert result == "mock_success"
    mock_judges_api.assert_called_once()
    instance.judges_execute_create.assert_called_once()
    call_args = instance.judges_execute_create.call_args
    assert call_args.kwargs["judge_id"] == "judge-id-123"
    execution_request = call_args.kwargs["judge_execution_request"]
    assert execution_request.response == "test_response"
    assert execution_request.user_id == "user-123"
    assert execution_request.session_id == "session-456"
    assert execution_request.system_prompt == "You are a helpful assistant."


@pytest.mark.asyncio
@patch("scorable.judges.AJudgesApi")
async def test_arun_judge_with_tracking_params(mock_ajudges_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_ajudges_api.return_value
    instance.judges_execute_create = AsyncMock(return_value="mock_success")

    result = await client.judges.arun(
        "judge-id-123",
        response="test_response",
        user_id="user-123",
        session_id="session-456",
        system_prompt="You are a helpful assistant.",
    )

    assert result == "mock_success"
    mock_ajudges_api.assert_called_once()
    instance.judges_execute_create.assert_called_once()
    call_args = instance.judges_execute_create.call_args
    assert call_args.kwargs["judge_id"] == "judge-id-123"
    execution_request = call_args.kwargs["judge_execution_request"]
    assert execution_request.response == "test_response"
    assert execution_request.user_id == "user-123"
    assert execution_request.session_id == "session-456"
    assert execution_request.system_prompt == "You are a helpful assistant."
