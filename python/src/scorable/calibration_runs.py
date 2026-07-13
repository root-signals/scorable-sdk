from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import AsyncIterator, Iterator, Optional

from pydantic import StrictStr

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.calibration_runs_api import CalibrationRunsApi as ACalibrationRunsApi
from .generated.openapi_aclient.models.calibration_run import CalibrationRun as ACalibrationRun
from .generated.openapi_aclient.models.calibration_run_create_request import (
    CalibrationRunCreateRequest as ACalibrationRunCreateRequest,
)
from .generated.openapi_aclient.models.calibration_run_item import CalibrationRunItem as ACalibrationRunItem
from .generated.openapi_aclient.models.calibration_run_source_request import (
    CalibrationRunSourceRequest as ACalibrationRunSourceRequest,
)
from .generated.openapi_aclient.models.calibration_source_type_enum import (
    CalibrationSourceTypeEnum as ACalibrationSourceTypeEnum,
)
from .generated.openapi_aclient.models.paginated_calibration_run_item_list import (
    PaginatedCalibrationRunItemList as APaginatedCalibrationRunItemList,
)
from .generated.openapi_aclient.models.paginated_calibration_run_list import (
    PaginatedCalibrationRunList as APaginatedCalibrationRunList,
)
from .generated.openapi_client import ApiClient
from .generated.openapi_client.api.calibration_runs_api import CalibrationRunsApi
from .generated.openapi_client.models.calibration_run import CalibrationRun
from .generated.openapi_client.models.calibration_run_create_request import CalibrationRunCreateRequest
from .generated.openapi_client.models.calibration_run_item import CalibrationRunItem
from .generated.openapi_client.models.calibration_run_source_request import CalibrationRunSourceRequest
from .generated.openapi_client.models.calibration_source_type_enum import CalibrationSourceTypeEnum
from .utils import ClientContextCallable, iterate_cursor_list, with_async_client, with_sync_client


class CalibrationRuns:
    """Calibration runs API.

    A calibration run measures the agreement between an evaluator and the human annotations on a
    dataset, producing per-example results and aggregate metrics. Runs execute asynchronously: a
    freshly created run has ``status="pending"``; poll :meth:`get` until it is ``completed`` or
    ``failed`` to read its ``metrics``.

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
        evaluator_id: str,
        dataset_id: str,
        score_config_id: Optional[str] = None,
        evaluator_version_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> CalibrationRun:
        """Start a calibration run against a labelled dataset and return it (``status="pending"``).

        Args:
          evaluator_id: The saved evaluator to calibrate.
          dataset_id: The dataset whose published annotations to calibrate against.
          score_config_id: Optional score config; omitting it uses the dataset's continuous scores.
          evaluator_version_id: Optional specific evaluator version.
        """

        request = CalibrationRunCreateRequest(
            evaluator_external_id=evaluator_id,
            evaluator_version_id=evaluator_version_id,
            score_config_id=score_config_id,
            source=CalibrationRunSourceRequest(type=CalibrationSourceTypeEnum("dataset"), dataset_id=dataset_id),
        )
        api_instance = CalibrationRunsApi(_client)
        return api_instance.calibration_runs_create(
            calibration_run_create_request=request, _request_timeout=_request_timeout
        )

    @with_async_client
    async def acreate(
        self,
        *,
        evaluator_id: str,
        dataset_id: str,
        score_config_id: Optional[str] = None,
        evaluator_version_id: Optional[str] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> ACalibrationRun:
        """Asynchronously start a calibration run."""

        request = ACalibrationRunCreateRequest(
            evaluator_external_id=evaluator_id,
            evaluator_version_id=evaluator_version_id,
            score_config_id=score_config_id,
            source=ACalibrationRunSourceRequest(type=ACalibrationSourceTypeEnum("dataset"), dataset_id=dataset_id),
        )
        api_instance = ACalibrationRunsApi(_client)
        return await api_instance.calibration_runs_create(
            calibration_run_create_request=request, _request_timeout=_request_timeout
        )

    @with_sync_client
    def get(self, run_id: str, *, _request_timeout: Optional[int] = None, _client: ApiClient) -> CalibrationRun:
        """Get a calibration run by ID (poll this for ``status`` and ``metrics``)."""

        api_instance = CalibrationRunsApi(_client)
        return api_instance.calibration_runs_retrieve(id=run_id, _request_timeout=_request_timeout)

    @with_async_client
    async def aget(
        self, run_id: str, *, _request_timeout: Optional[int] = None, _client: AApiClient
    ) -> ACalibrationRun:
        """Asynchronously get a calibration run by ID."""

        api_instance = ACalibrationRunsApi(_client)
        return await api_instance.calibration_runs_retrieve(id=run_id, _request_timeout=_request_timeout)

    @with_sync_client
    def list(
        self,
        *,
        evaluator_id: Optional[str] = None,
        limit: int = 100,
        _client: ApiClient,
    ) -> Iterator[CalibrationRun]:
        """Iterate through calibration runs, optionally filtered by evaluator.

        Args:
          evaluator_id: Filter by evaluator external id.
          limit: Number of entries to iterate through at most.
        """

        api_instance = CalibrationRunsApi(_client)
        yield from iterate_cursor_list(
            partial(api_instance.calibration_runs_list, evaluator_external_id=evaluator_id), limit=limit
        )

    @with_async_client
    async def alist(self, *, evaluator_id: Optional[str] = None, limit: int = 100) -> AsyncIterator[ACalibrationRun]:
        """Asynchronously iterate through calibration runs."""

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = ACalibrationRunsApi(client)
            partial_list = partial(api_instance.calibration_runs_list, evaluator_external_id=evaluator_id)
            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedCalibrationRunList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return
                used_results = result.results[:limit]
                limit -= len(used_results)
                for used_result in used_results:
                    yield used_result
                if not (cursor := result.next):
                    return

    @with_sync_client
    def list_items(self, run_id: str, *, limit: int = 100, _client: ApiClient) -> Iterator[CalibrationRunItem]:
        """Iterate through the per-example results of a calibration run."""

        api_instance = CalibrationRunsApi(_client)
        yield from iterate_cursor_list(partial(api_instance.calibration_runs_items_list, id=run_id), limit=limit)

    @with_async_client
    async def alist_items(self, run_id: str, *, limit: int = 100) -> AsyncIterator[ACalibrationRunItem]:
        """Asynchronously iterate through the per-example results of a calibration run."""

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = ACalibrationRunsApi(client)
            partial_list = partial(api_instance.calibration_runs_items_list, id=run_id)
            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedCalibrationRunItemList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return
                used_results = result.results[:limit]
                limit -= len(used_results)
                for used_result in used_results:
                    yield used_result
                if not (cursor := result.next):
                    return
