from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import Any, AsyncIterator, Dict, Iterator, List, Optional

import aiohttp
import requests
from pydantic import StrictStr

from scorable.generated.openapi_client.api_client import ApiClient

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.datasets_api import DatasetsApi as ADatasetsApi
from .generated.openapi_aclient.models.data_set_create import DataSetCreate as ADataSetCreate
from .generated.openapi_aclient.models.data_set_list import DataSetList as ADataSetList
from .generated.openapi_aclient.models.dataset_item import DatasetItem as ADatasetItem
from .generated.openapi_aclient.models.dataset_item_request import DatasetItemRequest as ADatasetItemRequest
from .generated.openapi_aclient.models.paginated_data_set_list_list import (
    PaginatedDataSetListList as APaginatedDataSetListList,
)
from .generated.openapi_aclient.models.paginated_dataset_item_list import (
    PaginatedDatasetItemList as APaginatedDatasetItemList,
)
from .generated.openapi_aclient.models.patched_dataset_item_request import (
    PatchedDatasetItemRequest as APatchedDatasetItemRequest,
)
from .generated.openapi_client.api.datasets_api import DatasetsApi as DatasetsApi
from .generated.openapi_client.models.data_set_create import DataSetCreate
from .generated.openapi_client.models.data_set_list import DataSetList
from .generated.openapi_client.models.dataset_item import DatasetItem
from .generated.openapi_client.models.dataset_item_request import DatasetItemRequest
from .generated.openapi_client.models.patched_dataset_item_request import PatchedDatasetItemRequest
from .utils import ClientContextCallable, iterate_cursor_list, with_async_client, with_sync_client

MAX_BULK_ITEMS = 5000


class DataSets:
    """
    DataSets (sub) API

    Note:

      The construction of the API instance should be handled by
      accesing an attribute of a :class:`scorable.client.Scorable` instance.
    """

    def __init__(self, client_context: ClientContextCallable, base_url: str, api_key: str):
        self.client_context = client_context
        self.base_url = base_url
        self.api_key = api_key

    def create(
        self,
        *,
        name: Optional[str] = None,
        path: Optional[str] = None,
        type: str = "reference",
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
    ) -> Optional[DataSetCreate]:
        """
        Create a dataset object with the given parameters to the registry.
        If the dataset has a path, it will be uploaded to the registry.
        """

        payload: Dict[str, Any] = {"name": name, "type": type, "tags": []}
        if project_id is not None:
            payload["project_id"] = project_id
        file = None
        try:
            if path:
                file = open(path, "rb")
                files = {"file": file}
            else:
                files = None

            response = requests.post(
                f"{self.base_url}/datasets/",
                headers={"Authorization": f"Api-Key {self.api_key}"},
                data=payload,
                files=files,
                timeout=_request_timeout or 120,
            )
            if not response.ok:
                raise Exception(f"create failed with status code {response.status_code} and message\n{response.text}")

            return DataSetCreate.from_dict(response.json())
        finally:
            if file and not file.closed:
                file.close()

    async def acreate(
        self,
        *,
        name: Optional[str] = None,
        path: Optional[str] = None,
        type: str = "reference",
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
    ) -> Optional[ADataSetCreate]:
        """
        Asynchronously create a dataset object with the given parameters to the registry.
        If the dataset has a path, it will be uploaded to the registry.

        """

        payload = aiohttp.FormData()
        payload.add_field("name", name)
        payload.add_field("type", type)
        if project_id is not None:
            payload.add_field("project_id", project_id)

        file = None
        try:
            if path:
                file = open(path, "rb")
                payload.add_field("file", file)

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/datasets/",
                    data=payload,
                    headers={"Authorization": f"Api-Key {self.api_key}"},
                    timeout=aiohttp.ClientTimeout(_request_timeout) or aiohttp.ClientTimeout(120),
                ) as response:
                    if not response.ok:
                        raise Exception(
                            f"create failed with status code {response.status} and message\n{response.text}"
                        )
                    return ADataSetCreate.from_dict(await response.json())
        finally:
            if file and not file.closed:
                file.close()

    @with_sync_client
    def get(
        self,
        dataset_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> DataSetList:
        """
        Get a dataset object from the registry.
        """

        api_instance = DatasetsApi(_client)
        return api_instance.datasets_retrieve(dataset_id, _request_timeout=_request_timeout)

    @with_async_client
    async def aget(
        self,
        dataset_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> ADataSetList:
        """
        Asynchronously get a dataset object from the registry.
        """

        api_instance = ADatasetsApi(_client)
        return await api_instance.datasets_retrieve(dataset_id, _request_timeout=_request_timeout)

    @with_sync_client
    def list(
        self,
        search_term: Optional[str] = None,
        *,
        limit: int = 100,
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Iterator[DataSetList]:
        """
        Iterate through the datasets.

        Args:
          limit: Number of entries to iterate through at most.
          search_term: Can be used to limit returned datasets.
          project_id: Optional project filter.
        """

        api_instance = DatasetsApi(_client)
        yield from iterate_cursor_list(
            partial(
                api_instance.datasets_list,
                search=search_term,
                project_id=project_id,
                _request_timeout=_request_timeout,
            ),
            limit=limit,
        )

    async def alist(
        self,
        search_term: Optional[str] = None,
        *,
        limit: int = 100,
        project_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
    ) -> AsyncIterator[ADataSetList]:
        """
        Asynchronously iterate through the datasets.

        Args:
          limit: Number of entries to iterate through at most.
          search_term: Can be used to limit returned datasets.
          project_id: Optional project filter.
        """

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = ADatasetsApi(client)
            partial_list = partial(
                api_instance.datasets_list,
                search=search_term,
                project_id=project_id,
                _request_timeout=_request_timeout,
            )
            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedDataSetListList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return

                used_results = result.results[:limit]
                limit -= len(used_results)

                for used_result in used_results:
                    yield used_result

                if not (cursor := result.next):
                    return

    @with_sync_client
    def delete(
        self,
        dataset_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> None:
        """
        Delete a dataset object from the registry.
        """

        api_instance = DatasetsApi(_client)
        return api_instance.datasets_destroy(dataset_id, _request_timeout=_request_timeout)

    @with_async_client
    async def adelete(
        self,
        dataset_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> None:
        """
        Asynchronously delete a dataset object from the registry.
        """

        api_instance = ADatasetsApi(_client)
        return await api_instance.datasets_destroy(dataset_id, _request_timeout=_request_timeout)

    @with_sync_client
    def add_item(
        self,
        dataset_id: str,
        *,
        response: str,
        request: str = "",
        expected_output: str = "",
        contexts: Optional[List[str]] = None,
        variables: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        change_note: str = "",
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> DatasetItem:
        """Add a single item to a dataset."""

        item_request = DatasetItemRequest(
            response=response,
            request=request,
            expected_output=expected_output,
            contexts=contexts or [],
            variables=variables or {},
            metadata=metadata or {},
            change_note=change_note,
        )
        api_instance = DatasetsApi(_client)
        return api_instance.datasets_items_create(
            dataset_id=dataset_id, dataset_item_request=item_request, _request_timeout=_request_timeout
        )

    @with_async_client
    async def aadd_item(
        self,
        dataset_id: str,
        *,
        response: str,
        request: str = "",
        expected_output: str = "",
        contexts: Optional[List[str]] = None,
        variables: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        change_note: str = "",
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> ADatasetItem:
        """Asynchronously add a single item to a dataset."""

        item_request = ADatasetItemRequest(
            response=response,
            request=request,
            expected_output=expected_output,
            contexts=contexts or [],
            variables=variables or {},
            metadata=metadata or {},
            change_note=change_note,
        )
        api_instance = ADatasetsApi(_client)
        return await api_instance.datasets_items_create(
            dataset_id=dataset_id, dataset_item_request=item_request, _request_timeout=_request_timeout
        )

    @with_sync_client
    def add_items(
        self,
        dataset_id: str,
        items: List[Dict[str, Any]],
        *,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> List[DatasetItem]:
        """Bulk add items to a dataset (at most 5000 per call)."""

        if len(items) > MAX_BULK_ITEMS:
            raise ValueError(f"at most {MAX_BULK_ITEMS} items per bulk request")
        item_requests = [DatasetItemRequest.model_validate(item) for item in items]
        api_instance = DatasetsApi(_client)
        return api_instance.datasets_items_bulk_create(
            dataset_id=dataset_id, dataset_item_request=item_requests, _request_timeout=_request_timeout
        )

    @with_async_client
    async def aadd_items(
        self,
        dataset_id: str,
        items: List[Dict[str, Any]],
        *,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> List[ADatasetItem]:
        """Asynchronously bulk add items to a dataset (at most 5000 per call)."""

        if len(items) > MAX_BULK_ITEMS:
            raise ValueError(f"at most {MAX_BULK_ITEMS} items per bulk request")
        item_requests = [ADatasetItemRequest.model_validate(item) for item in items]
        api_instance = ADatasetsApi(_client)
        return await api_instance.datasets_items_bulk_create(
            dataset_id=dataset_id, dataset_item_request=item_requests, _request_timeout=_request_timeout
        )

    @with_sync_client
    def list_items(
        self,
        dataset_id: str,
        *,
        include_archived: bool = False,
        limit: int = 100,
        _client: ApiClient,
    ) -> Iterator[DatasetItem]:
        """Iterate through the latest-version items of a dataset (with embedded published annotations).

        Args:
          dataset_id: The dataset to list items from.
          include_archived: Include archived items when true.
          limit: Number of entries to iterate through at most.
        """

        api_instance = DatasetsApi(_client)
        yield from iterate_cursor_list(
            partial(api_instance.datasets_items_list, dataset_id=dataset_id, is_archived=include_archived),
            limit=limit,
        )

    async def alist_items(
        self,
        dataset_id: str,
        *,
        include_archived: bool = False,
        limit: int = 100,
    ) -> AsyncIterator[ADatasetItem]:
        """Asynchronously iterate through the items of a dataset."""

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = ADatasetsApi(client)
            partial_list = partial(
                api_instance.datasets_items_list, dataset_id=dataset_id, is_archived=include_archived
            )
            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedDatasetItemList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return
                used_results = result.results[:limit]
                limit -= len(used_results)
                for used_result in used_results:
                    yield used_result
                if not (cursor := result.next):
                    return

    @with_sync_client
    def get_item(
        self, dataset_id: str, item_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient
    ) -> DatasetItem:
        """Get a single dataset item."""

        api_instance = DatasetsApi(_client)
        return api_instance.datasets_items_retrieve(
            dataset_id=dataset_id, item_id=item_id, _request_timeout=_request_timeout
        )

    @with_async_client
    async def aget_item(
        self, dataset_id: str, item_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient
    ) -> ADatasetItem:
        """Asynchronously get a single dataset item."""

        api_instance = ADatasetsApi(_client)
        return await api_instance.datasets_items_retrieve(
            dataset_id=dataset_id, item_id=item_id, _request_timeout=_request_timeout
        )

    @with_sync_client
    def update_item(
        self,
        dataset_id: str,
        item_id: str,
        *,
        response: Optional[str] = None,
        request: Optional[str] = None,
        expected_output: Optional[str] = None,
        contexts: Optional[List[str]] = None,
        variables: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        change_note: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> DatasetItem:
        """Edit a dataset item. Editing creates a new version; only the latest version is editable."""

        item_request = PatchedDatasetItemRequest(
            response=response,
            request=request,
            expected_output=expected_output,
            contexts=contexts,
            variables=variables,
            metadata=metadata,
            change_note=change_note,
        )
        api_instance = DatasetsApi(_client)
        return api_instance.datasets_items_partial_update(
            dataset_id=dataset_id,
            item_id=item_id,
            patched_dataset_item_request=item_request,
            _request_timeout=_request_timeout,
        )

    @with_async_client
    async def aupdate_item(
        self,
        dataset_id: str,
        item_id: str,
        *,
        response: Optional[str] = None,
        request: Optional[str] = None,
        expected_output: Optional[str] = None,
        contexts: Optional[List[str]] = None,
        variables: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        change_note: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> ADatasetItem:
        """Asynchronously edit a dataset item."""

        item_request = APatchedDatasetItemRequest(
            response=response,
            request=request,
            expected_output=expected_output,
            contexts=contexts,
            variables=variables,
            metadata=metadata,
            change_note=change_note,
        )
        api_instance = ADatasetsApi(_client)
        return await api_instance.datasets_items_partial_update(
            dataset_id=dataset_id,
            item_id=item_id,
            patched_dataset_item_request=item_request,
            _request_timeout=_request_timeout,
        )

    @with_sync_client
    def archive_item(
        self, dataset_id: str, item_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient
    ) -> None:
        """Archive (soft-delete) a dataset item."""

        api_instance = DatasetsApi(_client)
        return api_instance.datasets_items_destroy(
            dataset_id=dataset_id, item_id=item_id, _request_timeout=_request_timeout
        )

    @with_async_client
    async def aarchive_item(
        self, dataset_id: str, item_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient
    ) -> None:
        """Asynchronously archive (soft-delete) a dataset item."""

        api_instance = ADatasetsApi(_client)
        return await api_instance.datasets_items_destroy(
            dataset_id=dataset_id, item_id=item_id, _request_timeout=_request_timeout
        )
