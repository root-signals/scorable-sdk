from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import AsyncIterator, Iterator, Optional, cast

from pydantic import StrictStr

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.objectives_api import ObjectivesApi as AObjectivesApi
from .generated.openapi_aclient.models.objective import Objective as AOpenApiObjective
from .generated.openapi_aclient.models.objective_list import ObjectiveList as AObjectiveList
from .generated.openapi_aclient.models.objective_request import ObjectiveRequest as AObjectiveRequest
from .generated.openapi_aclient.models.paginated_objective_list import (
    PaginatedObjectiveList as APaginatedObjectiveList,
)
from .generated.openapi_aclient.models.paginated_objective_list_list import (
    PaginatedObjectiveListList as APaginatedObjectiveListList,
)
from .generated.openapi_aclient.models.patched_objective_request import (
    PatchedObjectiveRequest as APatchedObjectiveRequest,
)
from .generated.openapi_client import ApiClient
from .generated.openapi_client.api.objectives_api import ObjectivesApi as ObjectivesApi
from .generated.openapi_client.models.objective import Objective as OpenApiObjective
from .generated.openapi_client.models.objective_list import ObjectiveList
from .generated.openapi_client.models.objective_request import ObjectiveRequest
from .generated.openapi_client.models.paginated_objective_list import PaginatedObjectiveList
from .generated.openapi_client.models.patched_objective_request import PatchedObjectiveRequest
from .utils import ClientContextCallable, iterate_cursor_list, with_async_client, with_sync_client


class Versions:
    """Version listing (sub)API

    Note that this should not be directly instantiated.
    """

    def __init__(self, client_context: ClientContextCallable):
        self.client_context = client_context

    @with_sync_client
    def list(self, objective_id: str, *, _client: ApiClient) -> PaginatedObjectiveList:
        """List all versions of an objective.

        Args:
          objective_id: The objective to list the versions for
        """

        api_instance = ObjectivesApi(_client)
        return api_instance.objectives_versions_list(id=objective_id)

    async def alist(self, objective_id: str) -> APaginatedObjectiveList:
        """Asynchronously list all versions of an objective.

        Args:
          objective_id: The objective to list the versions for
        """

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AObjectivesApi(client)
            return await api_instance.objectives_versions_list(id=objective_id)


class Objective(OpenApiObjective):
    """Wrapper for a single Objective.

    For available attributes, please check the (automatically
    generated) superclass documentation.
    """

    client_context: ClientContextCallable

    @classmethod
    def _wrap(cls, apiobj: OpenApiObjective, client_context: ClientContextCallable) -> "Objective":
        if not isinstance(apiobj, OpenApiObjective):
            raise ValueError(f"Wrong instance in _wrap: {apiobj!r}")
        obj = cast(Objective, apiobj)
        obj.__class__ = cls
        obj.client_context = client_context
        return obj


class AObjective(AOpenApiObjective):
    """
    Wrapper for a single Objective.

    For available attributes, please check the (automatically
    generated) superclass documentation.
    """

    client_context: ClientContextCallable

    @classmethod
    async def _awrap(cls, apiobj: AOpenApiObjective, client_context: ClientContextCallable) -> "AObjective":
        if not isinstance(apiobj, AOpenApiObjective):
            raise ValueError(f"Wrong instance in _wrap: {apiobj!r}")
        obj = cast(AObjective, apiobj)
        obj.__class__ = cls
        obj.client_context = client_context
        return obj


class Objectives:
    """
    Objectives API

    Note:

      The construction of the API instance should be handled by
      accesing an attribute of a :class:`scorable.client.Scorable` instance.
    """

    def __init__(self, client_context: ClientContextCallable):
        self.client_context = client_context
        self.versions = Versions(client_context)

    @with_sync_client
    def create(
        self,
        *,
        intent: Optional[str] = None,
        test_dataset_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Objective:
        """
        Create a new objective and return its ID.

        Args:
          intent: The intent of the objective.
          test_dataset_id: The ID of the test dataset
        """

        request = ObjectiveRequest(
            intent=intent,
            test_dataset_id=test_dataset_id,
        )
        api_instance = ObjectivesApi(_client)
        objective = api_instance.objectives_create(objective_request=request)
        return self.get(objective.id, _request_timeout=_request_timeout)

    @with_async_client
    async def acreate(
        self,
        *,
        intent: Optional[str] = None,
        test_dataset_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AObjective:
        """
        Asynchronously create a new objective and return its ID.

        Args:
          intent: The intent of the objective.
          test_dataset_id: The ID of the test dataset
        """

        request = AObjectiveRequest(
            intent=intent,
            test_dataset_id=test_dataset_id,
        )
        api_instance = AObjectivesApi(_client)
        objective = await api_instance.objectives_create(objective_request=request)
        return await self.aget(objective.id, _request_timeout=_request_timeout)

    @with_sync_client
    def get(
        self,
        objective_id: str,
        *,
        _client: ApiClient,
        _request_timeout: Optional[int] = None,
    ) -> Objective:
        """
        Get an objective by ID.

        Args:
          objective_id: The objective to be fetched.
        """

        api_instance = ObjectivesApi(_client)
        return Objective._wrap(
            api_instance.objectives_retrieve(id=objective_id, _request_timeout=_request_timeout),
            client_context=self.client_context,
        )

    @with_async_client
    async def aget(
        self,
        objective_id: str,
        *,
        _client: AApiClient,
        _request_timeout: Optional[int] = None,
    ) -> AObjective:
        """
        Asynchronously get an objective by ID.

        Args:
          objective_id: The objective to be fetched.
        """

        api_instance = AObjectivesApi(_client)
        return await AObjective._awrap(
            await api_instance.objectives_retrieve(id=objective_id, _request_timeout=_request_timeout),
            client_context=self.client_context,
        )

    @with_sync_client
    def delete(self, objective_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient) -> None:
        """
        Delete the objective from the registry.

        Args:
          objective_id: The objective to be deleted.
        """

        api_instance = ObjectivesApi(_client)
        return api_instance.objectives_destroy(id=objective_id, _request_timeout=_request_timeout)

    @with_async_client
    async def adelete(self, objective_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient) -> None:
        """
        Asynchronously delete the objective from the registry.

        Args:
          objective_id: The objective to be deleted.
        """

        api_instance = AObjectivesApi(_client)
        return await api_instance.objectives_destroy(id=objective_id, _request_timeout=_request_timeout)

    @with_sync_client
    def list(self, *, intent: Optional[str] = None, limit: int = 100, _client: ApiClient) -> Iterator[ObjectiveList]:
        """
        Iterate through the objectives.

        Args:
          intent: Specific intent the returned objectives must match.
          limit: Number of entries to iterate through at most.
        """

        api_instance = ObjectivesApi(_client)
        yield from iterate_cursor_list(partial(api_instance.objectives_list, intent=intent), limit=limit)

    @with_async_client
    async def alist(self, *, intent: Optional[str] = None, limit: int = 100) -> AsyncIterator[AObjectiveList]:
        """
        Asynchronously iterate through the objectives.

        Args:
          intent: Specific intent the returned objectives must match.
          limit: Number of entries to iterate through at most.

        """

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AObjectivesApi(client)
            partial_list = partial(api_instance.objectives_list, intent=intent)

            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedObjectiveListList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return

                used_results = result.results[:limit]
                limit -= len(used_results)
                for used_result in used_results:
                    yield used_result

                if not (cursor := result.next):
                    return

    @with_sync_client
    def update(
        self,
        objective_id: str,
        *,
        intent: Optional[str] = None,
        test_dataset_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Objective:
        """
        Update an existing objective.

        Args:
          objective_id: The objective to be updated.
          intent: The intent of the objective.
        """

        request = PatchedObjectiveRequest(
            intent=intent,
            test_dataset_id=test_dataset_id,
        )
        api_instance = ObjectivesApi(_client)
        return Objective._wrap(
            api_instance.objectives_partial_update(
                id=objective_id,
                patched_objective_request=request,
                _request_timeout=_request_timeout,
            ),
            client_context=self.client_context,
        )

    @with_async_client
    async def aupdate(
        self,
        objective_id: str,
        *,
        intent: Optional[str] = None,
        test_dataset_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AObjective:
        """
        Asynchronously update an existing objective.

        Args:
          objective_id: The objective to be updated.
          intent: The intent of the objective.

        """

        request = APatchedObjectiveRequest(
            intent=intent,
            test_dataset_id=test_dataset_id,
        )
        api_instance = AObjectivesApi(_client)
        return await AObjective._awrap(
            await api_instance.objectives_partial_update(
                id=objective_id,
                patched_objective_request=request,
                _request_timeout=_request_timeout,
            ),
            client_context=self.client_context,
        )
