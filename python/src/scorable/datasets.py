from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import Any, AsyncIterator, Dict, Iterator, Optional

import aiohttp
import requests
from pydantic import StrictStr

from scorable.generated.openapi_client.api_client import ApiClient

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.datasets_api import DatasetsApi as ADatasetsApi
from .generated.openapi_aclient.models.data_set_create import DataSetCreate as ADataSetCreate
from .generated.openapi_aclient.models.data_set_list import DataSetList as ADataSetList
from .generated.openapi_aclient.models.paginated_data_set_list_list import (
    PaginatedDataSetListList as APaginatedDataSetListList,
)
from .generated.openapi_client.api.datasets_api import DatasetsApi as DatasetsApi
from .generated.openapi_client.models.data_set_create import DataSetCreate
from .generated.openapi_client.models.data_set_list import DataSetList
from .utils import ClientContextCallable, iterate_cursor_list, with_async_client, with_sync_client


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
        _request_timeout: Optional[int] = None,
    ) -> Optional[DataSetCreate]:
        """
        Create a dataset object with the given parameters to the registry.
        If the dataset has a path, it will be uploaded to the registry.
        """

        payload: Dict[str, Any] = {"name": name, "type": type, "tags": []}
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
        _request_timeout: Optional[int] = None,
    ) -> Optional[ADataSetCreate]:
        """
        Asynchronously create a dataset object with the given parameters to the registry.
        If the dataset has a path, it will be uploaded to the registry.

        """

        payload = aiohttp.FormData()
        payload.add_field("name", name)
        payload.add_field("type", type)

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
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Iterator[DataSetList]:
        """
        Iterate through the datasets.

        Args:
          limit: Number of entries to iterate through at most.
          search_term: Can be used to limit returned datasets.
        """

        api_instance = DatasetsApi(_client)
        yield from iterate_cursor_list(
            partial(api_instance.datasets_list, search=search_term, _request_timeout=_request_timeout), limit=limit
        )

    async def alist(
        self,
        search_term: Optional[str] = None,
        *,
        limit: int = 100,
        _request_timeout: Optional[int] = None,
    ) -> AsyncIterator[ADataSetList]:
        """
        Asynchronously iterate through the datasets.

        Args:
          limit: Number of entries to iterate through at most.
          search_term: Can be used to limit returned datasets.
        """

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = ADatasetsApi(client)
            partial_list = partial(api_instance.datasets_list, search=search_term, _request_timeout=_request_timeout)
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
