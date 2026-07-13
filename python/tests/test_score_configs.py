from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scorable.client import Scorable


@patch("scorable.score_configs.ScoreConfigsApi")
def test_create_score_config__sends_binary_categories(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.score_configs_create.return_value = MagicMock(id="sc1", type="binary")

    categories = [{"label": "👍", "value": 1.0}, {"label": "👎", "value": 0.0}]
    result = client.score_configs.create(name="Thumbs", type="binary", categories=categories)

    assert result.id == "sc1"
    request = instance.score_configs_create.call_args.kwargs["score_config_request"]
    assert request.name == "Thumbs"
    assert request.type == "binary"
    assert request.categories == categories


@patch("scorable.score_configs.ScoreConfigsApi")
def test_create_score_config__sends_continuous_bounds(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.score_configs_create.return_value = MagicMock(id="sc2", type="continuous")

    client.score_configs.create(name="Quality", type="continuous", min_value=0.0, max_value=5.0)

    request = instance.score_configs_create.call_args.kwargs["score_config_request"]
    assert request.type == "continuous"
    assert request.min_value == 0.0
    assert request.max_value == 5.0


@patch("scorable.score_configs.ScoreConfigsApi")
def test_list_score_configs__iterates(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.score_configs_list.return_value = MagicMock(results=[MagicMock(id="sc1"), MagicMock(id="sc2")], next=None)

    result = list(client.score_configs.list())

    assert [c.id for c in result] == ["sc1", "sc2"]


@patch("scorable.score_configs.ScoreConfigsApi")
def test_update_score_config__sends_name(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.score_configs_partial_update.return_value = MagicMock(id="sc1", name="Renamed")

    client.score_configs.update("sc1", name="Renamed")

    call_args = instance.score_configs_partial_update.call_args
    assert call_args.kwargs["id"] == "sc1"
    assert call_args.kwargs["patched_score_config_request"].name == "Renamed"


@pytest.mark.asyncio
@patch("scorable.score_configs.AScoreConfigsApi")
async def test_acreate_score_config__sends_type(mock_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_api.return_value
    instance.score_configs_create = AsyncMock(return_value=MagicMock(id="sc-async"))

    result = await client.score_configs.acreate(name="Async", type="continuous")

    assert result.id == "sc-async"
    assert instance.score_configs_create.call_args.kwargs["score_config_request"].type == "continuous"
