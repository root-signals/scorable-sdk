from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from functools import partial
from typing import AsyncIterator, Iterator, Optional

from pydantic import StrictStr

from .generated.openapi_aclient import ApiClient as AApiClient
from .generated.openapi_aclient.api.projects_api import ProjectsApi as AProjectsApi
from .generated.openapi_aclient.models.paginated_project_list import (
    PaginatedProjectList as APaginatedProjectList,
)
from .generated.openapi_aclient.models.patched_project_request import (
    PatchedProjectRequest as APatchedProjectRequest,
)
from .generated.openapi_aclient.models.project import Project as AProject
from .generated.openapi_aclient.models.project_request import (
    ProjectRequest as AProjectRequest,
)
from .generated.openapi_client import ApiClient
from .generated.openapi_client.api.projects_api import ProjectsApi
from .generated.openapi_client.models.patched_project_request import PatchedProjectRequest
from .generated.openapi_client.models.project import Project
from .generated.openapi_client.models.project_request import ProjectRequest
from .utils import ClientContextCallable, with_async_client, with_sync_client


class Projects:
    """
    Projects API

    Note:

      The construction of the API instance should be handled by
      accessing an attribute of a :class:`scorable.client.Scorable` instance.
    """

    def __init__(self, client_context: ClientContextCallable):
        self.client_context = client_context

    @with_sync_client
    def list(
        self,
        *,
        limit: int = 100,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Iterator[Project]:
        """
        Iterate through all projects in your organization.

        Args:
          limit: Number of entries to iterate through at most.
        """
        api_instance = ProjectsApi(_client)
        partial_list = partial(api_instance.projects_list, _request_timeout=_request_timeout)
        cursor: Optional[StrictStr] = None
        while limit > 0:
            result = partial_list(page_size=limit, cursor=cursor)
            if not result.results:
                return

            used_results = result.results[:limit]
            limit -= len(used_results)
            for project in used_results:
                yield project

            if not (cursor := result.next):
                return

    async def alist(
        self,
        *,
        limit: int = 100,
        _request_timeout: Optional[int] = None,
    ) -> AsyncIterator[AProject]:
        """
        Asynchronously iterate through all projects in your organization.

        Args:
          limit: Number of entries to iterate through at most.
        """
        context = self.client_context()
        assert isinstance(context, AbstractAsyncContextManager), "This method is not available in synchronous mode"
        async with context as client:
            api_instance = AProjectsApi(client)
            partial_list = partial(api_instance.projects_list, _request_timeout=_request_timeout)
            cursor: Optional[StrictStr] = None
            while limit > 0:
                result: APaginatedProjectList = await partial_list(page_size=limit, cursor=cursor)
                if not result.results:
                    return

                used_results = result.results[:limit]
                limit -= len(used_results)
                for project in used_results:
                    yield project

                if not (cursor := result.next):
                    return

    @with_sync_client
    def retrieve(
        self,
        project_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Project:
        """
        Retrieve a project by ID.
        """
        api_instance = ProjectsApi(_client)
        return api_instance.projects_retrieve(id=project_id, _request_timeout=_request_timeout)

    @with_async_client
    async def aretrieve(
        self,
        project_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AProject:
        """
        Asynchronously retrieve a project by ID.
        """
        api_instance = AProjectsApi(_client)
        return await api_instance.projects_retrieve(id=project_id, _request_timeout=_request_timeout)

    @with_sync_client
    def create(
        self,
        *,
        name: str,
        description: str = "",
        is_default: Optional[bool] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Project:
        """
        Create a new project.

        Args:
          name: Name of the project.
          description: Optional description.
          is_default: If True, this project becomes the organization's default and any
            previously default project is atomically demoted.
        """
        api_instance = ProjectsApi(_client)
        request = ProjectRequest(name=name, description=description, is_default=is_default)
        return api_instance.projects_create(project_request=request, _request_timeout=_request_timeout)

    @with_async_client
    async def acreate(
        self,
        *,
        name: str,
        description: str = "",
        is_default: Optional[bool] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AProject:
        """
        Asynchronously create a new project.
        """
        api_instance = AProjectsApi(_client)
        request = AProjectRequest(name=name, description=description, is_default=is_default)
        return await api_instance.projects_create(project_request=request, _request_timeout=_request_timeout)

    @with_sync_client
    def update(
        self,
        project_id: str,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_default: Optional[bool] = None,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> Project:
        """
        Update a project.

        Pass `is_default=True` to atomically promote this project to the organization's
        default and demote the previous default. The backend rejects `is_default=False`
        (the default is moved by promoting a different project, not cleared directly).
        """
        api_instance = ProjectsApi(_client)
        request = PatchedProjectRequest(name=name, description=description, is_default=is_default)
        return api_instance.projects_partial_update(
            id=project_id,
            patched_project_request=request,
            _request_timeout=_request_timeout,
        )

    @with_async_client
    async def aupdate(
        self,
        project_id: str,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_default: Optional[bool] = None,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> AProject:
        """
        Asynchronously update a project.
        """
        api_instance = AProjectsApi(_client)
        request = APatchedProjectRequest(name=name, description=description, is_default=is_default)
        return await api_instance.projects_partial_update(
            id=project_id,
            patched_project_request=request,
            _request_timeout=_request_timeout,
        )

    @with_sync_client
    def delete(
        self,
        project_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: ApiClient,
    ) -> None:
        """
        Delete a project.
        """
        api_instance = ProjectsApi(_client)
        return api_instance.projects_destroy(id=project_id, _request_timeout=_request_timeout)

    @with_async_client
    async def adelete(
        self,
        project_id: str,
        *,
        _request_timeout: Optional[int] = None,
        _client: AApiClient,
    ) -> None:
        """
        Asynchronously delete a project.
        """
        api_instance = AProjectsApi(_client)
        return await api_instance.projects_destroy(id=project_id, _request_timeout=_request_timeout)
