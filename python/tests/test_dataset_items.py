from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scorable.client import Scorable


@patch("scorable.datasets.DatasetsApi")
def test_add_item__sends_response_and_metadata(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.datasets_items_create.return_value = MagicMock(id="di1")

    result = client.datasets.add_item("ds1", response="A.", metadata={"src": "manual"})

    assert result.id == "di1"
    call_args = instance.datasets_items_create.call_args
    assert call_args.kwargs["dataset_id"] == "ds1"
    request = call_args.kwargs["dataset_item_request"]
    assert request.response == "A."
    assert request.metadata == {"src": "manual"}


@patch("scorable.datasets.DatasetsApi")
def test_add_items__bulk_builds_request_list(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.datasets_items_bulk_create.return_value = [MagicMock(id="di1"), MagicMock(id="di2")]

    result = client.datasets.add_items("ds1", [{"response": "r0"}, {"response": "r1"}])

    assert [i.id for i in result] == ["di1", "di2"]
    call_args = instance.datasets_items_bulk_create.call_args
    assert call_args.kwargs["dataset_id"] == "ds1"
    requests = call_args.kwargs["dataset_item_request"]
    assert [r.response for r in requests] == ["r0", "r1"]


@patch("scorable.datasets.DatasetsApi")
def test_list_items__excludes_archived_by_default(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.datasets_items_list.return_value = MagicMock(results=[MagicMock(id="di1")], next=None)

    result = list(client.datasets.list_items("ds1"))

    assert [i.id for i in result] == ["di1"]
    call_kwargs = instance.datasets_items_list.call_args.kwargs
    assert call_kwargs["dataset_id"] == "ds1"
    assert call_kwargs["is_archived"] is False


@patch("scorable.datasets.DatasetsApi")
def test_update_item__creates_new_version(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.datasets_items_partial_update.return_value = MagicMock(id="di1", is_latest_version=True)

    client.datasets.update_item("ds1", "di1", response="edited", change_note="fix")

    call_args = instance.datasets_items_partial_update.call_args
    assert call_args.kwargs["dataset_id"] == "ds1"
    assert call_args.kwargs["item_id"] == "di1"
    request = call_args.kwargs["patched_dataset_item_request"]
    assert request.response == "edited"
    assert request.change_note == "fix"


@patch("scorable.datasets.DatasetsApi")
def test_archive_item__soft_deletes(mock_api):
    client = Scorable(api_key="fake")
    instance = mock_api.return_value
    instance.datasets_items_destroy.return_value = None

    client.datasets.archive_item("ds1", "di1")

    call_args = instance.datasets_items_destroy.call_args
    assert call_args.kwargs["dataset_id"] == "ds1"
    assert call_args.kwargs["item_id"] == "di1"


@pytest.mark.asyncio
@patch("scorable.datasets.ADatasetsApi")
async def test_aadd_item__sends_response(mock_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_api.return_value
    instance.datasets_items_create = AsyncMock(return_value=MagicMock(id="di-async"))

    result = await client.datasets.aadd_item("ds1", response="async")

    assert result.id == "di-async"
    assert instance.datasets_items_create.call_args.kwargs["dataset_item_request"].response == "async"
