from __future__ import annotations

import os
import re
import textwrap
from contextlib import asynccontextmanager, contextmanager
from functools import cached_property
from typing import (
    TYPE_CHECKING,
    AsyncContextManager,
    AsyncGenerator,
    Callable,
    ContextManager,
    Generator,
    Optional,
    Type,
    Union,
)

from .__about__ import __version__
from .generated import openapi_aclient, openapi_client
from .generated.openapi_aclient.configuration import Configuration as _AConfiguration
from .generated.openapi_client.configuration import Configuration as _Configuration

if TYPE_CHECKING:
    from .datasets import DataSets
    from .execution_logs import ExecutionLogs
    from .files import Files
    from .judges import Judges
    from .models import Models
    from .objectives import Objectives
    from .skills import Evaluators


def _get_api_key(*, dot_env: str = ".env") -> str:
    var = "SCORABLE_API_KEY"
    api_key = os.environ.get(var)
    if api_key is not None:
        return api_key
    if os.path.exists(dot_env):
        for line in open(dot_env):
            m = re.fullmatch(line, rf"^\s*{var}\s*=\s*(\S+)\s*$")
            if m is not None:
                return m.group(1)
    raise ValueError(
        textwrap.dedent("""
    Scorable API key cannot be found.
    It can be provided in client invocation, using SCORABLE_API_KEY environment variable or .env file line
    """)
    )


class Beta:
    """Beta API features namespace"""

    def __init__(
        self,
        get_client_context: Union[
            Callable[[], AsyncContextManager[openapi_aclient.ApiClient]],
            Callable[[], ContextManager[openapi_client.ApiClient]],
        ],
    ) -> None:
        self._get_client_context = get_client_context

    @cached_property
    def judges(self) -> Judges:
        """Get Judges API (Beta)"""
        from .judges import Judges

        return Judges(self._get_client_context)


class Scorable:
    """Scorable API Python client.

    The API key must be provided via one of the following methods - the code uses the first one that is found:

    1. as an argument to Scorable constructor,
    2. environment variable `SCORABLE_API_KEY`, or
    3. .env file containing `SCORABLE_API_KEY=`

    Args:
        api_key: Scorable API Key (if not provided from environment)
        run_async: Whether to run the API client asynchronously
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        *,
        run_async: bool = False,
        _api_client: Union[Optional[openapi_aclient.ApiClient], Optional[openapi_client.ApiClient]] = None,
        base_url: Optional[str] = None,
    ):
        self.run_async = run_async
        if api_key is None:
            api_key = _get_api_key()
        if base_url is None:
            base_url = os.environ.get("SCORABLE_API_URL", "https://api.scorable.ai")
        self.base_url = base_url
        self.api_key = api_key
        self._api_client_arg = _api_client

    @cached_property
    def get_client_context(
        self,
    ) -> Union[
        Callable[[], AsyncContextManager[openapi_aclient.ApiClient]],
        Callable[[], ContextManager[openapi_client.ApiClient]],
    ]:
        if self._api_client_arg is not None:
            if isinstance(self._api_client_arg, openapi_aclient.ApiClient):

                @asynccontextmanager
                async def async_client_context() -> AsyncGenerator[openapi_aclient.ApiClient, None]:
                    assert isinstance(self._api_client_arg, openapi_aclient.ApiClient)
                    yield self._api_client_arg

                return async_client_context
            else:

                @contextmanager
                def sync_client_context() -> Generator[openapi_client.ApiClient, None, None]:
                    assert isinstance(self._api_client_arg, openapi_client.ApiClient)
                    yield self._api_client_arg

                return sync_client_context

        if self.run_async:
            return self._configure_client_context(openapi_aclient.ApiClient, _AConfiguration)
        return self._configure_client_context(openapi_client.ApiClient, _Configuration)

    def _configure_client_context(
        self,
        client_cls: Union[Type[openapi_client.ApiClient], Type[openapi_aclient.ApiClient]],
        config_cls: Union[Type[_Configuration], Type[_AConfiguration]],
    ) -> Union[
        Callable[[], ContextManager[openapi_client.ApiClient]],
        Callable[[], AsyncContextManager[openapi_aclient.ApiClient]],
    ]:
        config = config_cls(host=self.base_url)
        config.api_key["publicApiKey"] = f"Api-Key {self.api_key}"

        if issubclass(client_cls, openapi_aclient.ApiClient):

            @asynccontextmanager
            async def async_client_context() -> AsyncGenerator[openapi_aclient.ApiClient, None]:
                async with client_cls(config) as client:
                    client.user_agent = f"rs-python-sdk/{__version__}"
                    yield client

            return async_client_context
        else:

            @contextmanager
            def sync_client_context() -> Generator[openapi_client.ApiClient, None, None]:
                with client_cls(config) as client:
                    client.user_agent = f"rs-python-sdk/{__version__}"
                    yield client

            return sync_client_context

    @cached_property
    def datasets(self) -> DataSets:
        """Get DataSets API"""
        from .datasets import DataSets

        return DataSets(self.get_client_context, self.base_url, self.api_key)

    @cached_property
    def files(self) -> Files:
        """Get Files API"""
        from .files import Files

        return Files(self.get_client_context, self.base_url, self.api_key)

    @cached_property
    def evaluators(self) -> Evaluators:
        """Get Evaluators API"""
        from .skills import Evaluators

        return Evaluators(self.get_client_context)

    @cached_property
    def execution_logs(self) -> ExecutionLogs:
        """Get Execution Logs API"""
        from .execution_logs import ExecutionLogs

        return ExecutionLogs(self.get_client_context)

    @cached_property
    def models(self) -> Models:
        """Get Models API"""
        from .models import Models

        return Models(self.get_client_context)

    @cached_property
    def objectives(self) -> Objectives:
        """Get Objectives API"""
        from .objectives import Objectives

        return Objectives(self.get_client_context)

    @cached_property
    def judges(self) -> Judges:
        """Get Judges API"""
        from .judges import Judges

        return Judges(self.get_client_context)

    @cached_property
    def beta(self) -> Beta:
        """Get Beta API features"""
        return Beta(self.get_client_context)
