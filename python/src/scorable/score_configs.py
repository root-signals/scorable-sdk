from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import Any, AsyncIterator, Iterator, List, Optional

from pydantic import StrictStr

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.score_configs_api import ScoreConfigsApi as AScoreConfigsApi
from .generated.openapi_aclient.models.paginated_score_config_list import (
    PaginatedScoreConfigList as APaginatedScoreConfigList,
)
from .generated.openapi_aclient.models.patched_score_config_request import (
    PatchedScoreConfigRequest as APatchedScoreConfigRequest,
)
from .generated.openapi_aclient.models.score_config import ScoreConfig as AScoreConfig
from .generated.openapi_aclient.models.score_config_request import ScoreConfigRequest as AScoreConfigRequest
from .generated.openapi_aclient.models.score_config_type_enum import ScoreConfigTypeEnum as AScoreConfigTypeEnum
from .generated.openapi_client import ApiClient
from .generated.openapi_client.api.score_configs_api import ScoreConfigsApi
from .generated.openapi_client.models.patched_score_config_request import PatchedScoreConfigRequest
from .generated.openapi_client.models.score_config import ScoreConfig
from .generated.openapi_client.models.score_config_request import ScoreConfigRequest
from .generated.openapi_client.models.score_config_type_enum import ScoreConfigTypeEnum
from .utils import ClientContextCallable, iterate_cursor_list, with_async_client, with_sync_client


class ScoreConfigs:
    """Score configs API.

    A score config describes the label scale used when annotating and calibrating: ``binary``,
    ``continuous`` or ``categorical``. Your organization's own configs are returned alongside the
    read-only public globals (the identity "Score" config and "Thumbs").

    Note:

      The construction of the API instance should be handled by accessing an attribute of a
      :class:`scorable.client.Scorable` instance.
    """

    def __init__(self, client_context: ClientContextCallable):
        self.client_context = client_context

    @with_sync_client
    def create(
        self,
        *,
        name: str,
        type: str,
        categories: Optional[List[dict[str, Any]]] = None,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> ScoreConfig:
        """Create a score config.

        Args:
          name: Human-readable name.
          type: One of ``binary``, ``continuous`` or ``categorical``.
          categories: For binary/categorical configs, a list of ``{"label": ..., "value": ...}``.
          min_value: For continuous configs, the lower bound (defaults to 0).
          max_value: For continuous configs, the upper bound (defaults to 1).
        """

        request = ScoreConfigRequest(
            name=name,
            type=ScoreConfigTypeEnum(type),
            categories=categories or [],
            min_value=min_value,
            max_value=max_value,
        )
        api_instance = ScoreConfigsApi(_client)
        return api_instance.score_configs_create(score_config_request=request, _request_timeout=_request_timeout)

    @with_async_client
    async def acreate(
        self,
        *,
        name: str,
        type: str,
        categories: Optional[List[dict[str, Any]]] = None,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AScoreConfig:
        """Asynchronously create a score config."""

        request = AScoreConfigRequest(
            name=name,
            type=AScoreConfigTypeEnum(type),
            categories=categories or [],
            min_value=min_value,
            max_value=max_value,
        )
        api_instance = AScoreConfigsApi(_client)
        return await api_instance.score_configs_create(score_config_request=request, _request_timeout=_request_timeout)

    @with_sync_client
    def get(self, score_config_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient) -> ScoreConfig:
        """Get a score config by ID."""

        api_instance = ScoreConfigsApi(_client)
        return api_instance.score_configs_retrieve(id=score_config_id, _request_timeout=_request_timeout)

    @with_async_client
    async def aget(
        self, score_config_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient
    ) -> AScoreConfig:
        """Asynchronously get a score config by ID."""

        api_instance = AScoreConfigsApi(_client)
        return await api_instance.score_configs_retrieve(id=score_config_id, _request_timeout=_request_timeout)

    @with_sync_client
    def list(self, *, limit: int = 100, _client: ApiClient) -> Iterator[ScoreConfig]:
        """Iterate through the score configs (your organization's own plus public globals)."""

        api_instance = ScoreConfigsApi(_client)
        yield from iterate_cursor_list(partial(api_instance.score_configs_list), limit=limit)

    async def alist(self, *, limit: int = 100) -> AsyncIterator[AScoreConfig]:
        """Asynchronously iterate through the score configs."""

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AScoreConfigsApi(client)
            partial_list = partial(api_instance.score_configs_list)
            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedScoreConfigList = await partial_list(page_size=limit, cursor=cursor)
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
        score_config_id: str,
        *,
        name: Optional[str] = None,
        type: Optional[str] = None,
        categories: Optional[List[dict[str, Any]]] = None,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> ScoreConfig:
        """Update a score config. Public globals are read-only."""

        request = PatchedScoreConfigRequest(
            name=name,
            type=ScoreConfigTypeEnum(type) if type is not None else None,
            categories=categories,
            min_value=min_value,
            max_value=max_value,
        )
        api_instance = ScoreConfigsApi(_client)
        return api_instance.score_configs_partial_update(
            id=score_config_id, patched_score_config_request=request, _request_timeout=_request_timeout
        )

    @with_async_client
    async def aupdate(
        self,
        score_config_id: str,
        *,
        name: Optional[str] = None,
        type: Optional[str] = None,
        categories: Optional[List[dict[str, Any]]] = None,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AScoreConfig:
        """Asynchronously update a score config."""

        request = APatchedScoreConfigRequest(
            name=name,
            type=AScoreConfigTypeEnum(type) if type is not None else None,
            categories=categories,
            min_value=min_value,
            max_value=max_value,
        )
        api_instance = AScoreConfigsApi(_client)
        return await api_instance.score_configs_partial_update(
            id=score_config_id, patched_score_config_request=request, _request_timeout=_request_timeout
        )

    @with_sync_client
    def delete(self, score_config_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient) -> None:
        """Delete a score config."""

        api_instance = ScoreConfigsApi(_client)
        return api_instance.score_configs_destroy(id=score_config_id, _request_timeout=_request_timeout)

    @with_async_client
    async def adelete(
        self, score_config_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient
    ) -> None:
        """Asynchronously delete a score config."""

        api_instance = AScoreConfigsApi(_client)
        return await api_instance.score_configs_destroy(id=score_config_id, _request_timeout=_request_timeout)
