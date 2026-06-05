from unittest.mock import MagicMock, patch

from scorable.client import Scorable


@patch("scorable.execution_logs.ExecutionLogsApi")
def test_list__filters_by_project_id(mock_execution_logs_api):
    client = Scorable(api_key="fake")
    instance = mock_execution_logs_api.return_value
    page = MagicMock(results=[], next=None)
    instance.execution_logs_list.return_value = page

    list(client.execution_logs.list(project_id="proj-1"))

    instance.execution_logs_list.assert_called_once()
    assert instance.execution_logs_list.call_args.kwargs["project_id"] == "proj-1"


@patch("scorable.execution_logs.ExecutionLogsApi")
def test_list__project_id_and_tags_can_be_combined(mock_execution_logs_api):
    client = Scorable(api_key="fake")
    instance = mock_execution_logs_api.return_value
    page = MagicMock(results=[], next=None)
    instance.execution_logs_list.return_value = page

    list(client.execution_logs.list(project_id="proj-1", tags=["alpha", "beta"]))

    instance.execution_logs_list.assert_called_once()
    call_kwargs = instance.execution_logs_list.call_args.kwargs
    assert call_kwargs["project_id"] == "proj-1"
    assert call_kwargs["tags"] == "alpha,beta"
