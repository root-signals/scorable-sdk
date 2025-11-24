from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import AsyncIterator, Iterator, List, Optional, Protocol

from pydantic import StrictStr

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.execution_logs_api import ExecutionLogsApi as AExecutionLogsApi
from .generated.openapi_aclient.models.execution_log_details import ExecutionLogDetails as AExecutionLogDetails
from .generated.openapi_aclient.models.execution_log_list import ExecutionLogList as AExecutionLogList
from .generated.openapi_aclient.models.paginated_execution_log_list_list import (
    PaginatedExecutionLogListList as APaginatedExecutionLogListList,
)
from .generated.openapi_client import ApiClient
from .generated.openapi_client.api.execution_logs_api import ExecutionLogsApi as ExecutionLogsApi
from .generated.openapi_client.models.execution_log_details import ExecutionLogDetails
from .generated.openapi_client.models.execution_log_list import ExecutionLogList
from .utils import ClientContextCallable, iterate_cursor_list, with_async_client, with_sync_client


class ExecutionResult(Protocol):
    execution_log_id: str


class ExecutionLogs:
    """Execution logs API"""

    def __init__(self, client_context: ClientContextCallable):
        self.client_context = client_context

    @with_sync_client
    def list(
        self,
        *,
        limit: int = 100,
        search_term: Optional[str] = None,
        tags: Optional[List[str]] = None,
        include: Optional[List[str]] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Iterator[ExecutionLogList]:
        """
        List execution logs

        Args:
          limit: Number of entries to iterate through at most.
          search_term: Can be used to limit returned logs. For example, a evaluator id or name.
          tags: Optional tags to filter the logs by.
          include: Optional fields to include in the response.
        """
        api_instance = ExecutionLogsApi(_client)
        yield from iterate_cursor_list(
            partial(
                api_instance.execution_logs_list,
                search=search_term,
                tags=",".join(tags) if tags else None,
                include=",".join(include) if include else None,
                _request_timeout=_request_timeout,
            ),
            limit=limit,
        )

    async def alist(
        self,
        *,
        limit: int = 100,
        search_term: Optional[str] = None,
        tags: Optional[List[str]] = None,
        include: Optional[List[str]] = None,
        _request_timeout: Optional[int] = None,
    ) -> AsyncIterator[AExecutionLogList]:
        """
        Asynchronously list execution logs

        Args:
          limit: Number of entries to iterate through at most.
          search_term: Can be used to limit returned logs. For example, a evaluator id or name.
          tags: Optional tags to filter the logs by.
          include: Optional fields to include in the response.
        """

        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AExecutionLogsApi(client)
            partial_list = partial(
                api_instance.execution_logs_list,
                search=search_term,
                tags=",".join(tags) if tags else None,
                include=",".join(include) if include else None,
                _request_timeout=_request_timeout,
            )

            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedExecutionLogListList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return

                used_results = result.results[:limit]
                limit -= len(used_results)

                for used_result in used_results:
                    yield used_result

                if not (cursor := result.next):
                    return

    @with_sync_client
    def get(
        self,
        *,
        log_id: Optional[str] = None,
        execution_result: Optional[ExecutionResult] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> ExecutionLogDetails:
        """
        Get a specific execution log details

        Args:
          log_id: The log to be fetched
          execution_result: The execution result containing the log ID.

        Raises:
          ValueError: If both log_id and execution_result are None.
        """

        api_instance = ExecutionLogsApi(_client)
        _log_id = execution_result.execution_log_id if execution_result else log_id
        if _log_id is None:
            raise ValueError("Either log_id or execution_result must be provided")
        return api_instance.execution_logs_retrieve(_log_id, _request_timeout=_request_timeout)

    @with_async_client
    async def aget(
        self,
        *,
        log_id: Optional[str] = None,
        execution_result: Optional[ExecutionResult] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AExecutionLogDetails:
        """
        Asynchronously get a specific execution log details

        Args:
          log_id: The log to be fetched
          execution_result: The execution result containing the log ID.

        Raises:
          ValueError: If both log_id and execution_result are None.
        """

        api_instance = AExecutionLogsApi(_client)
        _log_id = execution_result.execution_log_id if execution_result else log_id
        if _log_id is None:
            raise ValueError("Either log_id or execution_result must be provided")
        return await api_instance.execution_logs_retrieve(_log_id, _request_timeout=_request_timeout)
