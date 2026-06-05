from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scorable.client import Scorable


@patch("scorable.projects.ProjectsApi")
def test_list_projects__returns_org_projects(mock_projects_api):
    client = Scorable(api_key="fake")
    instance = mock_projects_api.return_value
    project_a = MagicMock(id="p1", name="Production", is_default=True)
    project_b = MagicMock(id="p2", name="Staging", is_default=False)
    page = MagicMock(results=[project_a, project_b], next=None)
    instance.projects_list.return_value = page

    result = list(client.projects.list())

    assert [p.id for p in result] == ["p1", "p2"]
    instance.projects_list.assert_called_once()


@patch("scorable.projects.ProjectsApi")
def test_create_project__returns_created_project(mock_projects_api):
    client = Scorable(api_key="fake")
    instance = mock_projects_api.return_value
    instance.projects_create.return_value = MagicMock(id="p-new", name="New project")

    result = client.projects.create(name="New project", description="desc")

    assert result.id == "p-new"
    call_args = instance.projects_create.call_args
    project_request = call_args.kwargs["project_request"]
    assert project_request.name == "New project"
    assert project_request.description == "desc"


@patch("scorable.projects.ProjectsApi")
def test_create_project__with_is_default_flag(mock_projects_api):
    client = Scorable(api_key="fake")
    instance = mock_projects_api.return_value
    instance.projects_create.return_value = MagicMock(id="p-new", is_default=True)

    client.projects.create(name="Promoted", is_default=True)

    project_request = instance.projects_create.call_args.kwargs["project_request"]
    assert project_request.is_default is True


@patch("scorable.projects.ProjectsApi")
def test_delete_project__succeeds(mock_projects_api):
    client = Scorable(api_key="fake")
    instance = mock_projects_api.return_value
    instance.projects_destroy.return_value = None

    client.projects.delete("p-1")

    instance.projects_destroy.assert_called_once()
    assert instance.projects_destroy.call_args.kwargs["id"] == "p-1"


@patch("scorable.projects.ProjectsApi")
def test_update_project__sends_is_default(mock_projects_api):
    client = Scorable(api_key="fake")
    instance = mock_projects_api.return_value
    instance.projects_partial_update.return_value = MagicMock(id="p-1", is_default=True)

    client.projects.update("p-1", is_default=True)

    call_args = instance.projects_partial_update.call_args
    assert call_args.kwargs["id"] == "p-1"
    assert call_args.kwargs["patched_project_request"].is_default is True


@pytest.mark.asyncio
@patch("scorable.projects.AProjectsApi")
async def test_acreate_project__returns_created_project(mock_aprojects_api):
    client = Scorable(api_key="fake", run_async=True)
    instance = mock_aprojects_api.return_value
    instance.projects_create = AsyncMock(return_value=MagicMock(id="p-async"))

    result = await client.projects.acreate(name="Async project")

    assert result.id == "p-async"
    instance.projects_create.assert_called_once()
