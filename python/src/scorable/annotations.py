from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import AsyncIterator, Iterator, Optional

from pydantic import StrictStr

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.annotations_api import AnnotationsApi as AAnnotationsApi
from .generated.openapi_aclient.models.annotation import Annotation as AAnnotation
from .generated.openapi_aclient.models.annotation_request import AnnotationRequest as AAnnotationRequest
from .generated.openapi_aclient.models.annotation_status_enum import AnnotationStatusEnum as AAnnotationStatusEnum
from .generated.openapi_aclient.models.paginated_annotation_list import (
    PaginatedAnnotationList as APaginatedAnnotationList,
)
from .generated.openapi_aclient.models.patched_annotation_request import (
    PatchedAnnotationRequest as APatchedAnnotationRequest,
)
from .generated.openapi_client import ApiClient
from .generated.openapi_client.api.annotations_api import AnnotationsApi
from .generated.openapi_client.models.annotation import Annotation
from .generated.openapi_client.models.annotation_request import AnnotationRequest
from .generated.openapi_client.models.annotation_status_enum import AnnotationStatusEnum
from .generated.openapi_client.models.patched_annotation_request import PatchedAnnotationRequest
from .utils import ClientContextCallable, iterate_cursor_list, with_async_client, with_sync_client


def _one_target(dataset_item_id: Optional[str], execution_log_id: Optional[str]) -> None:
    if (dataset_item_id is None) == (execution_log_id is None):
        raise ValueError("exactly one of dataset_item_id or execution_log_id must be provided")


class Annotations:
    """Annotations API.

    An annotation is a human label attached to exactly one target - a dataset item or an execution
    log - using a score config. For binary/categorical configs pass ``category`` (the label); for
    continuous configs pass ``value``. Omitting ``score_config_id`` defaults to the global identity
    "Score" config, so a raw score can be labelled with just ``value``.

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
        dataset_item_id: Optional[str] = None,
        execution_log_id: Optional[str] = None,
        value: Optional[float] = None,
        category: Optional[str] = None,
        rationale: str = "",
        status: str = "published",
        score_config_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Annotation:
        """Create an annotation.

        Args:
          dataset_item_id: The dataset item to annotate (mutually exclusive with execution_log_id).
          execution_log_id: The execution log to annotate (mutually exclusive with dataset_item_id).
          value: The score for continuous configs.
          category: The label for binary/categorical configs.
          rationale: Optional free-text justification.
          status: ``draft`` or ``published`` (default ``published``).
          score_config_id: The score config; defaults to the global identity "Score" config.
        """

        _one_target(dataset_item_id, execution_log_id)
        request = AnnotationRequest(
            dataset_item=dataset_item_id,
            execution_log=execution_log_id,
            score_config=score_config_id,
            value=value,
            category=category,
            rationale=rationale,
            status=AnnotationStatusEnum(status),
        )
        api_instance = AnnotationsApi(_client)
        return api_instance.annotations_create(annotation_request=request, _request_timeout=_request_timeout)

    @with_async_client
    async def acreate(
        self,
        *,
        dataset_item_id: Optional[str] = None,
        execution_log_id: Optional[str] = None,
        value: Optional[float] = None,
        category: Optional[str] = None,
        rationale: str = "",
        status: str = "published",
        score_config_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AAnnotation:
        """Asynchronously create an annotation."""

        _one_target(dataset_item_id, execution_log_id)
        request = AAnnotationRequest(
            dataset_item=dataset_item_id,
            execution_log=execution_log_id,
            score_config=score_config_id,
            value=value,
            category=category,
            rationale=rationale,
            status=AAnnotationStatusEnum(status),
        )
        api_instance = AAnnotationsApi(_client)
        return await api_instance.annotations_create(annotation_request=request, _request_timeout=_request_timeout)

    @with_sync_client
    def get(self, annotation_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient) -> Annotation:
        """Get an annotation by ID."""

        api_instance = AnnotationsApi(_client)
        return api_instance.annotations_retrieve(id=annotation_id, _request_timeout=_request_timeout)

    @with_async_client
    async def aget(
        self, annotation_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient
    ) -> AAnnotation:
        """Asynchronously get an annotation by ID."""

        api_instance = AAnnotationsApi(_client)
        return await api_instance.annotations_retrieve(id=annotation_id, _request_timeout=_request_timeout)

    @with_sync_client
    def list(
        self,
        *,
        dataset: Optional[str] = None,
        score_config: Optional[str] = None,
        status: Optional[str] = None,
        dataset_item: Optional[str] = None,
        execution_log: Optional[str] = None,
        limit: int = 100,
        _client: ApiClient,
    ) -> Iterator[Annotation]:
        """Iterate through annotations.

        Args:
          dataset: Filter by the dataset the annotated items belong to.
          score_config: Filter by score config id.
          status: Filter by ``draft`` or ``published``.
          dataset_item: Filter by dataset item id.
          execution_log: Filter by execution log id.
          limit: Number of entries to iterate through at most.
        """

        api_instance = AnnotationsApi(_client)
        yield from iterate_cursor_list(
            partial(
                api_instance.annotations_list,
                dataset=dataset,
                score_config=score_config,
                status=status,
                dataset_item=dataset_item,
                execution_log=execution_log,
            ),
            limit=limit,
        )

    async def alist(
        self,
        *,
        dataset: Optional[str] = None,
        score_config: Optional[str] = None,
        status: Optional[str] = None,
        dataset_item: Optional[str] = None,
        execution_log: Optional[str] = None,
        limit: int = 100,
    ) -> AsyncIterator[AAnnotation]:
        """Asynchronously iterate through annotations."""

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AAnnotationsApi(client)
            partial_list = partial(
                api_instance.annotations_list,
                dataset=dataset,
                score_config=score_config,
                status=status,
                dataset_item=dataset_item,
                execution_log=execution_log,
            )
            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedAnnotationList = await partial_list(page_size=limit, cursor=cursor)
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
        annotation_id: str,
        *,
        value: Optional[float] = None,
        category: Optional[str] = None,
        rationale: Optional[str] = None,
        status: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Annotation:
        """Update an annotation. The target is immutable; ``value``/``category`` are re-derived."""

        request = PatchedAnnotationRequest(
            value=value,
            category=category,
            rationale=rationale,
            status=AnnotationStatusEnum(status) if status is not None else None,
        )
        api_instance = AnnotationsApi(_client)
        return api_instance.annotations_partial_update(
            id=annotation_id, patched_annotation_request=request, _request_timeout=_request_timeout
        )

    @with_async_client
    async def aupdate(
        self,
        annotation_id: str,
        *,
        value: Optional[float] = None,
        category: Optional[str] = None,
        rationale: Optional[str] = None,
        status: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AAnnotation:
        """Asynchronously update an annotation."""

        request = APatchedAnnotationRequest(
            value=value,
            category=category,
            rationale=rationale,
            status=AAnnotationStatusEnum(status) if status is not None else None,
        )
        api_instance = AAnnotationsApi(_client)
        return await api_instance.annotations_partial_update(
            id=annotation_id, patched_annotation_request=request, _request_timeout=_request_timeout
        )

    @with_sync_client
    def delete(self, annotation_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient) -> None:
        """Delete an annotation."""

        api_instance = AnnotationsApi(_client)
        return api_instance.annotations_destroy(id=annotation_id, _request_timeout=_request_timeout)

    @with_async_client
    async def adelete(self, annotation_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient) -> None:
        """Asynchronously delete an annotation."""

        api_instance = AAnnotationsApi(_client)
        return await api_instance.annotations_destroy(id=annotation_id, _request_timeout=_request_timeout)
