from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scorable.client import Scorable


@patch("scorable.annotations.AnnotationsApi")
def test_create_annotation__sends_category_and_target(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.annotations_create.return_value = MagicMock(id="a1", value=1.0)

    result = client.annotations.create(dataset_item_id="di1", category="👍", score_config_id="sc1")

    assert result.id == "a1"
    request = instance.annotations_create.call_args.kwargs["annotation_request"]
    assert request.dataset_item == "di1"
    assert request.execution_log is None
    assert request.category == "👍"
    assert request.score_config == "sc1"


@patch("scorable.annotations.AnnotationsApi")
def test_create_annotation__defaults_score_config_to_none_for_identity(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.annotations_create.return_value = MagicMock(id="a1", value=0.8)

    client.annotations.create(dataset_item_id="di1", value=0.8)

    request = instance.annotations_create.call_args.kwargs["annotation_request"]
    assert request.score_config is None
    assert request.value == 0.8


def test_create_annotation__rejects_when_no_target():
    client = Scorable(api_key="fake")
    with pytest.raises(ValueError):
        client.annotations.create(value=0.5)


def test_create_annotation__rejects_when_both_targets():
    client = Scorable(api_key="fake")
    with pytest.raises(ValueError):
        client.annotations.create(dataset_item_id="di1", execution_log_id="el1", value=0.5)


@patch("scorable.annotations.AnnotationsApi")
def test_list_annotations__forwards_filters(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.annotations_list.return_value = MagicMock(results=[MagicMock(id="a1")], next=None)

    result = list(client.annotations.list(dataset="ds1", status="published"))

    assert [a.id for a in result] == ["a1"]
    call_kwargs = instance.annotations_list.call_args.kwargs
    assert call_kwargs["dataset"] == "ds1"
    assert call_kwargs["status"] == "published"


@patch("scorable.annotations.AnnotationsApi")
def test_update_annotation__sends_rationale_and_status(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.annotations_partial_update.return_value = MagicMock(id="a1")

    client.annotations.update("a1", rationale="looks good", status="draft")

    call_args = instance.annotations_partial_update.call_args
    assert call_args.kwargs["id"] == "a1"
    request = call_args.kwargs["patched_annotation_request"]
    assert request.rationale == "looks good"
    assert request.status == "draft"


@patch("scorable.annotations.AnnotationsApi")
def test_delete_annotation__succeeds(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.annotations_destroy.return_value = None

    client.annotations.delete("a1")

    assert instance.annotations_destroy.call_args.kwargs["id"] == "a1"


@pytest.mark.asyncio
@patch("scorable.annotations.AAnnotationsApi")
async def test_alist_annotations__iterates_as_async_generator(mock_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_api.return_value
    instance.annotations_list = AsyncMock(return_value=MagicMock(results=[MagicMock(id="a1")], next=None))

    result = [a async for a in client.annotations.alist(dataset="ds1")]

    assert [a.id for a in result] == ["a1"]


@pytest.mark.asyncio
@patch("scorable.annotations.AAnnotationsApi")
async def test_acreate_annotation__sends_value(mock_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_api.return_value
    instance.annotations_create = AsyncMock(return_value=MagicMock(id="a-async"))

    result = await client.annotations.acreate(dataset_item_id="di1", value=0.9)

    assert result.id == "a-async"
    request = instance.annotations_create.call_args.kwargs["annotation_request"]
    assert request.value == 0.9
