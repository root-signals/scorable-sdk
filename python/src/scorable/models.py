from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import (
    AsyncIterator,
    Iterator,
    List,
    Optional,
)

from pydantic import StrictStr

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.models_api import ModelsApi as AModelsApi
from .generated.openapi_aclient.models.model_list import ModelList as AModelItem
from .generated.openapi_aclient.models.model_request import (
    ModelRequest as AModelRequest,
)
from .generated.openapi_aclient.models.paginated_model_list_list import (
    PaginatedModelListList as APaginatedModelListList,
)
from .generated.openapi_client import ApiClient
from .generated.openapi_client.api.models_api import ModelsApi as ModelsApi
from .generated.openapi_client.models.model_list import ModelList as ModelItem
from .generated.openapi_client.models.model_request import ModelRequest
from .utils import (
    ClientContextCallable,
    iterate_cursor_list,
    with_async_client,
    with_sync_client,
)


class Models:
    """Models (sub) API

    Note:

      The construction of the API instance should be handled by
      accesing an attribute of a :class:`scorable.client.Scorable` instance.
    """

    def __init__(
        self,
        client_context: ClientContextCallable,
    ):
        self.client_context = client_context

    @with_sync_client
    def list(
        self,
        *,
        capable_of: Optional[List[str]] = None,
        limit: int = 100,
        _client: ApiClient,
    ) -> Iterator[ModelItem]:
        """Iterate through the models.

        Args:
          limit: Number of entries to iterate through at most.
          capable_of: List of capabilities to filter the models by.
        """

        api_instance = ModelsApi(_client)
        yield from iterate_cursor_list(partial(api_instance.models_list, capable_of=capable_of), limit=limit)

    async def alist(
        self,
        *,
        capable_of: Optional[List[str]] = None,
        limit: int = 100,
    ) -> AsyncIterator[AModelItem]:
        """Asynchronously iterate through the models.

        Args:
          limit: Number of entries to iterate through at most.
          capable_of: List of capabilities to filter the models by.
        """
        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"

        async with context as client:
            api_instance = AModelsApi(client)
            partial_list = partial(api_instance.models_list, capable_of=capable_of)

            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedModelListList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return
                used_results = result.results[:limit]
                limit -= len(used_results)
                for used_result in used_results:
                    yield used_result

                if not (cursor := result.next):
                    return

    @with_sync_client
    def create(
        self,
        *,
        name: str,
        model: Optional[str] = None,
        default_key: Optional[str] = None,
        max_output_token_count: Optional[int] = None,
        max_token_count: Optional[int] = None,
        url: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> str:
        """Create a new model and return its ID.

        Args:
          name: The unique identifier for the model instance  (e.g. "google/gemma-2-9b").
          model: The base model name to be used. Defaults to name.
          default_key: The default API key required for the model, if applicable.
          max_output_token_count: The maximum number of tokens to output.
          max_token_count: The maximum number of tokens to process.
          url: Optional URL pointing to the model's endpoint.
        """
        request = ModelRequest(
            name=name,
            model=model,
            default_key=default_key,
            max_output_token_count=max_output_token_count,
            max_token_count=max_token_count,
            url=url,
        )

        api_instance = ModelsApi(_client)
        return api_instance.models_create(model_request=request, _request_timeout=_request_timeout).id

    @with_async_client
    async def acreate(
        self,
        *,
        name: str,
        model: Optional[str] = None,
        default_key: Optional[str] = None,
        max_output_token_count: Optional[int] = None,
        max_token_count: Optional[int] = None,
        url: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> str:
        """Asynchronously create a new model and return its ID.

        Args:
          name: The unique identifier for the model instance  (e.g. "google/gemma-2-9b").
          model: The base model name to be used. Defaults to name.
          default_key: The default API key required for the model, if applicable.
          max_output_token_count: The maximum number of tokens to output.
          max_token_count: The maximum number of tokens to process.
          url: Optional URL pointing to the model's endpoint.
        """

        request = AModelRequest(
            name=name,
            model=model,
            default_key=default_key,
            max_output_token_count=max_output_token_count,
            max_token_count=max_token_count,
            url=url,
        )
        api_instance = AModelsApi(_client)
        created_model = await api_instance.models_create(model_request=request, _request_timeout=_request_timeout)
        return created_model.id

    @with_sync_client
    def delete(
        self,
        model_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> None:
        """
        Delete the model.
        """
        api_instance = ModelsApi(_client)
        return api_instance.models_destroy(id=model_id, _request_timeout=_request_timeout)

    @with_async_client
    async def adelete(
        self,
        model_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> None:
        """
        Asynchronously delete the model.
        """
        api_instance = AModelsApi(_client)
        return await api_instance.models_destroy(id=model_id, _request_timeout=_request_timeout)

    # TODO: update
