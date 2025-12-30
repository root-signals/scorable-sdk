import json
import os
import tempfile
import yaml
import pytest
from unittest.mock import Mock, patch
from click.testing import CliRunner
from cli import (
    cli,
    _request,
    Judge,
    JudgeListResponse,
    EvaluatorReference,
    PromptTest,
    Task,
    _run_prompt_tests,
)


@pytest.fixture
def runner():
    return CliRunner()


@pytest.fixture
def mock_api_key():
    with patch.dict("os.environ", {"SCORABLE_API_KEY": "test-api-key"}):
        yield


@pytest.fixture
def sample_judge():
    return Judge(
        id="judge-123",
        name="Test Judge",
        intent="Test intent",
        created_at="2024-01-01T12:00:00Z",
        status="active",
        evaluator_references=[EvaluatorReference(id="eval-123")],
    )


@pytest.fixture
def sample_judge_list():
    judges = [
        Judge(
            id="judge-123",
            name="Test Judge 1",
            intent="Test intent 1",
            created_at="2024-01-01T12:00:00Z",
            status="active",
        ),
        Judge(
            id="judge-456",
            name="Test Judge 2",
            intent="Test intent 2",
            created_at="2024-01-02T12:00:00Z",
            status="inactive",
        ),
    ]
    return JudgeListResponse(results=judges, next=None)


class TestJudgeList:
    def test_list_judges_success(self, runner, mock_api_key, sample_judge_list):
        with patch("cli._request", return_value=sample_judge_list):
            result = runner.invoke(cli, ["judge", "list"])
            assert result.exit_code == 0
            assert "Test Judge 1" in result.output
            assert "Test Judge 2" in result.output

    def test_list_judges_with_filters(self, runner, mock_api_key, sample_judge_list):
        with patch("cli._request", return_value=sample_judge_list) as mock_req:
            result = runner.invoke(
                cli,
                [
                    "judge",
                    "list",
                    "--page-size",
                    "10",
                    "--search",
                    "test",
                    "--name",
                    "Test Judge",
                    "--is-preset",
                ],
            )
            assert result.exit_code == 0
            mock_req.assert_called_once()

    def test_list_judges_empty(self, runner, mock_api_key):
        empty_list = JudgeListResponse(results=[], next=None)
        with patch("cli._request", return_value=empty_list):
            result = runner.invoke(cli, ["judge", "list"])
            assert result.exit_code == 0
            assert "No judges found" in result.output

    def test_list_judges_with_pagination(self, runner, mock_api_key, sample_judge_list):
        sample_judge_list.next = "cursor=next_page_token"
        with patch("cli._request", return_value=sample_judge_list):
            result = runner.invoke(cli, ["judge", "list"])
            assert result.exit_code == 0
            assert "Next page available" in result.output


class TestJudgeGet:
    def test_get_judge_success(self, runner, mock_api_key, sample_judge):
        with patch("cli._request", return_value=sample_judge):
            result = runner.invoke(cli, ["judge", "get", "judge-123"])
            assert result.exit_code == 0
            assert "Test Judge" in result.output

    def test_get_judge_not_found(self, runner, mock_api_key):
        with patch("cli._request", return_value=None):
            result = runner.invoke(cli, ["judge", "get", "nonexistent"])
            assert result.exit_code == 0


class TestJudgeCreate:
    def test_create_judge_basic(self, runner, mock_api_key, sample_judge):
        with patch("cli._request", return_value=sample_judge):
            result = runner.invoke(
                cli,
                ["judge", "create", "--name", "New Judge", "--intent", "New intent"],
            )
            assert result.exit_code == 0
            assert "Judge created successfully" in result.output

    def test_create_judge_with_stage(self, runner, mock_api_key, sample_judge):
        with patch("cli._request", return_value=sample_judge) as mock_req:
            result = runner.invoke(
                cli,
                [
                    "judge",
                    "create",
                    "--name",
                    "New Judge",
                    "--intent",
                    "New intent",
                    "--stage",
                    "production",
                ],
            )
            assert result.exit_code == 0
            mock_req.assert_called_once()

    def test_create_judge_with_evaluator_references(
        self, runner, mock_api_key, sample_judge
    ):
        with patch("cli._request", return_value=sample_judge) as mock_req:
            result = runner.invoke(
                cli,
                [
                    "judge",
                    "create",
                    "--name",
                    "New Judge",
                    "--intent",
                    "New intent",
                    "--evaluator-references",
                    '[{"id": "eval-123"}]',
                ],
            )
            assert result.exit_code == 0
            mock_req.assert_called_once()

    def test_create_judge_invalid_json(self, runner, mock_api_key):
        result = runner.invoke(
            cli,
            [
                "judge",
                "create",
                "--name",
                "New Judge",
                "--intent",
                "New intent",
                "--evaluator-references",
                "invalid-json",
            ],
        )
        assert result.exit_code == 0
        assert "Invalid JSON format" in result.output

    def test_create_judge_missing_required_args(self, runner, mock_api_key):
        result = runner.invoke(cli, ["judge", "create", "--name", "Test"])
        assert result.exit_code == 2

        result = runner.invoke(cli, ["judge", "create", "--intent", "Test"])
        assert result.exit_code == 2


class TestJudgeUpdate:
    def test_update_judge_name(self, runner, mock_api_key, sample_judge):
        with patch("cli._request", return_value=sample_judge) as mock_req:
            result = runner.invoke(
                cli, ["judge", "update", "judge-123", "--name", "Updated Judge"]
            )
            assert result.exit_code == 0
            assert "Judge judge-123 updated successfully" in result.output
            mock_req.assert_called_once()

    def test_update_judge_stage(self, runner, mock_api_key, sample_judge):
        with patch("cli._request", return_value=sample_judge) as mock_req:
            result = runner.invoke(
                cli, ["judge", "update", "judge-123", "--stage", "production"]
            )
            assert result.exit_code == 0
            mock_req.assert_called_once()

    def test_update_judge_evaluator_references(
        self, runner, mock_api_key, sample_judge
    ):
        with patch("cli._request", return_value=sample_judge) as mock_req:
            result = runner.invoke(
                cli,
                [
                    "judge",
                    "update",
                    "judge-123",
                    "--evaluator-references",
                    '[{"id": "eval-456"}]',
                ],
            )
            assert result.exit_code == 0
            mock_req.assert_called_once()

    def test_update_judge_clear_evaluator_references(
        self, runner, mock_api_key, sample_judge
    ):
        with patch("cli._request", return_value=sample_judge) as mock_req:
            result = runner.invoke(
                cli, ["judge", "update", "judge-123", "--evaluator-references", "[]"]
            )
            assert result.exit_code == 0
            mock_req.assert_called_once()

    def test_update_judge_invalid_json(self, runner, mock_api_key):
        result = runner.invoke(
            cli,
            ["judge", "update", "judge-123", "--evaluator-references", "invalid-json"],
        )
        assert result.exit_code == 0
        assert "Invalid JSON format" in result.output

    def test_update_judge_no_params(self, runner, mock_api_key):
        result = runner.invoke(cli, ["judge", "update", "judge-123"])
        assert result.exit_code == 0
        assert "No update parameters provided" in result.output


class TestJudgeDelete:
    def test_delete_judge_success(self, runner, mock_api_key):
        with patch("cli._request", return_value=None):
            result = runner.invoke(cli, ["judge", "delete", "judge-123"], input="y\n")
            assert result.exit_code == 0
            assert "Judge judge-123 deleted successfully" in result.output

    def test_delete_judge_with_yes_flag(self, runner, mock_api_key):
        with patch("cli._request", return_value=None):
            result = runner.invoke(cli, ["judge", "delete", "judge-123", "--yes"])
            assert result.exit_code == 0
            assert "Judge judge-123 deleted successfully" in result.output

    def test_delete_judge_abort(self, runner, mock_api_key):
        result = runner.invoke(cli, ["judge", "delete", "judge-123"], input="n\n")
        assert result.exit_code == 1


class TestJudgeExecute:
    def test_execute_judge_with_request(self, runner, mock_api_key):
        mock_response = {"result": "success", "score": 0.95}
        with patch("cli._request", return_value=mock_response):
            result = runner.invoke(
                cli, ["judge", "execute", "judge-123", "--request", "Test request"]
            )
            assert result.exit_code == 0
            assert "Judge execution successful" in result.output

    def test_execute_judge_with_response(self, runner, mock_api_key):
        mock_response = {"result": "success", "score": 0.85}
        with patch("cli._request", return_value=mock_response):
            result = runner.invoke(
                cli, ["judge", "execute", "judge-123", "--response", "Test response"]
            )
            assert result.exit_code == 0
            assert "Judge execution successful" in result.output

    def test_execute_judge_with_all_params(self, runner, mock_api_key):
        mock_response = {"result": "success", "score": 0.90}
        with patch("cli._request", return_value=mock_response) as mock_req:
            result = runner.invoke(
                cli,
                [
                    "judge",
                    "execute",
                    "judge-123",
                    "--request",
                    "Test request",
                    "--response",
                    "Test response",
                    "--contexts",
                    '["context1", "context2"]',
                    "--expected-output",
                    "Expected output",
                    "--tag",
                    "tag1",
                    "--tag",
                    "tag2",
                ],
            )
            assert result.exit_code == 0
            assert "Judge execution successful" in result.output
            mock_req.assert_called_once()

    def test_execute_judge_no_request_or_response(self, runner, mock_api_key):
        result = runner.invoke(cli, ["judge", "execute", "judge-123"])
        assert result.exit_code == 0
        assert "Either --request or --response must be provided" in result.output

    def test_execute_judge_invalid_contexts_json(self, runner, mock_api_key):
        result = runner.invoke(
            cli,
            [
                "judge",
                "execute",
                "judge-123",
                "--request",
                "Test request",
                "--contexts",
                "invalid-json",
            ],
        )
        assert result.exit_code == 0
        assert "Invalid JSON for --contexts" in result.output

    def test_execute_judge_with_stdin_input(self, runner, mock_api_key):
        mock_response = {"result": "success", "score": 0.95}
        stdin_content = "Test response from stdin"

        # Test the core function directly with mocked stdin
        import io

        mock_stdin = io.StringIO(stdin_content)

        with patch("cli._request", return_value=mock_response) as mock_req:
            with patch("cli.sys.stdin", mock_stdin):
                with patch("cli.sys.stdin.isatty", return_value=False):
                    from cli import _execute_judge

                    _execute_judge(
                        "judge-123", None, None, None, None, None, None, None, None
                    )

                    # Verify that _request was called with stdin content as response
                    mock_req.assert_called_once()
                    call_args = mock_req.call_args[1]
                    assert call_args["payload"]["response"] == stdin_content

    def test_execute_judge_stdin_priority_over_flag(self, runner, mock_api_key):
        mock_response = {"result": "success", "score": 0.95}
        flag_response = "Response from flag"
        stdin_content = "stdin content"

        # Test that flag takes priority over stdin
        import io

        mock_stdin = io.StringIO(stdin_content)

        with patch("cli._request", return_value=mock_response) as mock_req:
            with patch("cli.sys.stdin", mock_stdin):
                with patch("cli.sys.stdin.isatty", return_value=False):
                    from cli import _execute_judge

                    _execute_judge(
                        "judge-123",
                        None,
                        flag_response,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    )

                    # Verify that _request was called with flag content, not stdin
                    mock_req.assert_called_once()
                    call_args = mock_req.call_args[1]
                    assert call_args["payload"]["response"] == flag_response


class TestJudgeExecuteByName:
    def test_execute_judge_by_name_success(self, runner, mock_api_key):
        mock_response = {"result": "success", "score": 0.88}
        with patch("cli._request", return_value=mock_response):
            result = runner.invoke(
                cli,
                ["judge", "execute-by-name", "Test Judge", "--request", "Test request"],
            )
            assert result.exit_code == 0
            assert "Judge execution by name successful" in result.output

    def test_execute_judge_by_name_no_request_or_response(self, runner, mock_api_key):
        result = runner.invoke(cli, ["judge", "execute-by-name", "Test Judge"])
        assert result.exit_code == 0
        assert "Either --request or --response must be provided" in result.output

    def test_execute_judge_by_name_with_stdin_input(self, runner, mock_api_key):
        mock_response = {"result": "success", "score": 0.88}
        stdin_content = "Test response from stdin for named judge"

        # Test the core function directly with mocked stdin
        import io

        mock_stdin = io.StringIO(stdin_content)

        with patch("cli._request", return_value=mock_response) as mock_req:
            with patch("cli.sys.stdin", mock_stdin):
                with patch("cli.sys.stdin.isatty", return_value=False):
                    from cli import _execute_judge_by_name

                    _execute_judge_by_name(
                        "Test Judge", None, None, None, None, None, None, None, None
                    )

                    # Verify that _request was called with stdin content as response
                    mock_req.assert_called_once()
                    call_args = mock_req.call_args[1]
                    assert call_args["payload"]["response"] == stdin_content

    def test_execute_judge_by_name_stdin_priority_over_flag(self, runner, mock_api_key):
        mock_response = {"result": "success", "score": 0.88}
        flag_response = "Response from flag for named judge"
        stdin_content = "stdin content"

        # Test that flag takes priority over stdin
        import io

        mock_stdin = io.StringIO(stdin_content)

        with patch("cli._request", return_value=mock_response) as mock_req:
            with patch("cli.sys.stdin", mock_stdin):
                with patch("cli.sys.stdin.isatty", return_value=False):
                    from cli import _execute_judge_by_name

                    _execute_judge_by_name(
                        "Test Judge",
                        None,
                        flag_response,
                        None,
                        None,
                        None,
                        None,
                        None,
                        None,
                    )

                    # Verify that _request was called with flag content, not stdin
                    mock_req.assert_called_once()
                    call_args = mock_req.call_args[1]
                    assert call_args["payload"]["response"] == flag_response


class TestJudgeDuplicate:
    def test_duplicate_judge_success(self, runner, mock_api_key, sample_judge):
        duplicated_judge = sample_judge.model_copy()
        duplicated_judge.id = "judge-456"
        duplicated_judge.name = "Test Judge (Copy)"

        with patch("cli._request", return_value=duplicated_judge):
            result = runner.invoke(cli, ["judge", "duplicate", "judge-123"])
            assert result.exit_code == 0
            assert "Judge judge-123 duplicated successfully" in result.output


class TestApiRequest:
    def test_request_missing_api_key(self, runner):
        with patch.dict("os.environ", {}, clear=True):
            with tempfile.TemporaryDirectory() as td:
                settings_path = os.path.join(td, "settings.json")
                with patch("cli._settings_path", return_value=settings_path):
                    result = runner.invoke(cli, ["judge", "list"])
            assert result.exit_code == 1
            assert "SCORABLE_API_KEY environment variable not set" in result.output

    @patch("cli.session.request")
    @patch("cli.API_KEY", "test-key")
    def test_request_timeout(self, mock_request):
        import requests

        mock_request.side_effect = requests.exceptions.RequestException("Timeout")
        result = _request("GET", "judges")
        assert result is None

    @patch("cli.session.request")
    @patch("cli.API_KEY", "test-key")
    def test_request_http_error(self, mock_request):
        import requests

        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.json.return_value = {"error": "Not found"}
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            response=mock_response
        )
        mock_response.request = Mock()
        mock_response.request.method = "GET"
        mock_response.request.url = "http://test.com"
        mock_request.return_value = mock_response

        result = _request("GET", "judges/nonexistent")
        assert result is None

    @patch("cli.session.request")
    @patch("cli.API_KEY", "test-key")
    def test_request_no_content_response(self, mock_request):
        mock_response = Mock()
        mock_response.status_code = 204
        mock_response.raise_for_status.return_value = None
        mock_request.return_value = mock_response

        result = _request("DELETE", "judges/123")
        assert result is None

    @patch("cli.session.request")
    @patch("cli.API_KEY", "test-key")
    def test_request_invalid_json(self, mock_request):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.raise_for_status.return_value = None
        mock_response.json.side_effect = json.JSONDecodeError("Invalid JSON", "", 0)
        mock_request.return_value = mock_response

        result = _request("GET", "judges")
        assert result is None

    @patch("cli.session.request")
    @patch("cli.API_KEY", "test-key")
    def test_request_validation_error_default_behavior(self, mock_request):
        """Test that validation errors return None by default (backward compatibility)."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "invalid": "payload"
        }  # This will fail validation
        mock_request.return_value = mock_response

        result = _request("GET", "judges")
        assert result is None

    @patch("cli.session.request")
    @patch("cli.API_KEY", "test-key")
    def test_request_validation_error_with_raise_flag(self, mock_request):
        """Test that validation errors are raised when raise_on_validation_error=True."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "invalid": "payload"
        }  # This will fail validation
        mock_request.return_value = mock_response

        with pytest.raises(Exception):  # Should raise validation error
            _request("GET", "judges", raise_on_validation_error=True)


class TestHelperFunctions:
    def test_print_functions(self, capsys):
        from cli import print_error, print_success, print_info, print_warning

        print_error("Test error")
        captured = capsys.readouterr()
        assert "Error:" in captured.out

        print_success("Test success")
        captured = capsys.readouterr()
        assert "Success:" in captured.out

        print_info("Test info")
        captured = capsys.readouterr()
        assert "Info:" in captured.out

        print_warning("Test warning")
        captured = capsys.readouterr()
        assert "Warning:" in captured.out


class TestPromptTestingOperations:
    """Test suite for prompt testing CLI operations."""

    def test_run_experiment_success(self, mock_api_key):
        """Test successful prompt testing execution."""
        # Mock experiment response
        mock_experiment = PromptTest(
            id="exp-123",
            model="gpt-4o-mini",
            prompt="Test prompt: {{input}}",
            tasks=[
                Task(
                    id="task-1",
                    status="completed",
                    cost="$0.001",
                    llm_output="Test output",
                    model_call_duration=1.5,
                    variables={"input": "test value"},
                )
            ],
        )

        # Create a temporary config file
        config_data = {
            "prompts": ["Test prompt: {{input}}"],
            "inputs": [{"vars": {"input": "test value"}}],
            "models": ["gpt-4o-mini"],
            "evaluators": [{"name": "Test Evaluator"}],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            yaml.dump(config_data, f)
            config_path = f.name

        try:
            with patch("cli._request", return_value=mock_experiment):
                with patch("cli.time.sleep"):  # Speed up the test
                    _run_prompt_tests(config_path=config_path)
        finally:
            os.unlink(config_path)

    def test_run_experiment_with_response_schema(self, mock_api_key):
        """Test prompt testing execution with response schema."""
        mock_experiment = PromptTest(
            id="exp-456",
            model="gpt-4o-mini",
            prompt="Extract info: {{text}}",
            tasks=[
                Task(
                    id="task-2",
                    status="completed",
                    cost="$0.002",
                    llm_output='{"name": "John", "email": "john@example.com"}',
                    variables={"text": "John Doe, john@example.com"},
                )
            ],
        )

        config_data = {
            "prompts": ["Extract info: {{text}}"],
            "inputs": [{"vars": {"text": "John Doe, john@example.com"}}],
            "models": ["gpt-4o-mini"],
            "evaluators": [{"name": "Extraction Quality"}],
            "response_schema": {
                "type": "object",
                "properties": {"name": {"type": "string"}, "email": {"type": "string"}},
            },
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            yaml.dump(config_data, f)
            config_path = f.name

        try:
            with patch("cli._request", return_value=mock_experiment):
                with patch("cli.time.sleep"):  # Speed up the test
                    _run_prompt_tests(config_path=config_path)
        finally:
            os.unlink(config_path)

    def test_run_experiment_with_dataset_id(self, mock_api_key):
        """Test prompt testing execution with dataset ID instead of inputs."""
        mock_experiment = PromptTest(
            id="exp-789",
            model="claude-3-5-haiku",
            prompt="Process: {{data}}",
            tasks=[
                Task(
                    id="task-3",
                    status="completed",
                    cost="$0.003",
                    llm_output="Processed data result",
                    variables={"data": "dataset value"},
                )
            ],
        )

        config_data = {
            "prompts": ["Process: {{data}}"],
            "inputs": [
                {"vars": {"data": "fallback"}}
            ],  # Should be ignored when dataset_id is present
            "models": ["claude-3-5-haiku"],
            "evaluators": [{"name": "Processing Quality"}],
            "dataset_id": "dataset-123",
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            yaml.dump(config_data, f)
            config_path = f.name

        try:
            with patch("cli._request", return_value=mock_experiment) as mock_request:
                with patch("cli.time.sleep"):  # Speed up the test
                    _run_prompt_tests(config_path=config_path)
                    # Verify dataset_id was included in the request
                    mock_request.assert_called()
                    # Check that any call included dataset_id in the payload
                    found_dataset_id = False
                    for call in mock_request.call_args_list:
                        if (
                            len(call) > 1
                            and "payload" in call[1]
                            and "dataset_id" in call[1]["payload"]
                        ):
                            found_dataset_id = True
                            assert call[1]["payload"]["dataset_id"] == "dataset-123"
                            break
                    assert found_dataset_id, "dataset_id was not found in any API call"
        finally:
            os.unlink(config_path)

    def test_exp_init_command(self, runner, mock_api_key):
        """Test prompt testing init command via CLI."""
        with tempfile.TemporaryDirectory() as temp_dir:
            os.path.join(temp_dir, "prompt-tests.yaml")

            with patch("cli.os.path.exists", return_value=False):
                with patch("builtins.open", create=True) as mock_open:
                    result = runner.invoke(cli, ["pt", "init"])
                    assert result.exit_code == 0
                    mock_open.assert_called()

    def test_exp_run_command_with_custom_config(self, runner, mock_api_key):
        """Test prompt testing run command with custom config file."""
        mock_experiment = PromptTest(
            id="exp-cli-test",
            model="gpt-4o-mini",
            prompt="CLI test prompt",
            tasks=[
                Task(
                    id="task-cli",
                    status="completed",
                    cost="$0.001",
                    llm_output="CLI test output",
                    variables={"test": "value"},
                )
            ],
        )

        config_data = {
            "prompts": ["CLI test prompt"],
            "inputs": [{"vars": {"test": "value"}}],
            "models": ["gpt-4o-mini"],
            "evaluators": [{"name": "CLI Test"}],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            yaml.dump(config_data, f)
            config_path = f.name

        try:
            with patch("cli._request", return_value=mock_experiment):
                with patch("cli.time.sleep"):  # Speed up the test by mocking sleep
                    result = runner.invoke(cli, ["pt", "run", "-c", config_path])
                    assert result.exit_code == 0
        finally:
            os.unlink(config_path)

    def test_prompt_test_alias_init_command(self, runner, mock_api_key):
        with patch("cli.os.path.exists", return_value=False):
            with patch("builtins.open", create=True) as mock_open:
                result = runner.invoke(cli, ["prompt-test", "init"])
                assert result.exit_code == 0
                mock_open.assert_called()

    def test_prompt_test_alias_run_command_with_custom_config(
        self, runner, mock_api_key
    ):
        mock_experiment = PromptTest(
            id="exp-cli-test",
            model="gpt-4o-mini",
            prompt="CLI test prompt",
            tasks=[
                Task(
                    id="task-cli",
                    status="completed",
                    cost="$0.001",
                    llm_output="CLI test output",
                    variables={"test": "value"},
                )
            ],
        )

        config_data = {
            "prompts": ["CLI test prompt"],
            "inputs": [{"vars": {"test": "value"}}],
            "models": ["gpt-4o-mini"],
            "evaluators": [{"name": "CLI Test"}],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            yaml.dump(config_data, f)
            config_path = f.name

        try:
            with patch("cli._request", return_value=mock_experiment):
                with patch("cli.time.sleep"):
                    result = runner.invoke(
                        cli, ["prompt-test", "run", "-c", config_path]
                    )
                    assert result.exit_code == 0
        finally:
            os.unlink(config_path)


class TestSettingsTemporaryKey:
    def test_settings_temporary_api_key_used(self, runner, sample_judge_list):
        with patch.dict("os.environ", {}, clear=True):
            with tempfile.TemporaryDirectory() as td:
                settings_dir = os.path.join(td, ".scorable")
                os.makedirs(settings_dir, exist_ok=True)
                settings_path = os.path.join(settings_dir, "settings.json")
                with open(settings_path, "w") as f:
                    json.dump({"temporary_api_key": "tmpkey-123"}, f)
                with patch("cli._settings_path", return_value=settings_path):
                    from cli import session

                    session.headers.clear()
                    mock_response = Mock()
                    mock_response.status_code = 200
                    mock_response.raise_for_status.return_value = None
                    mock_response.json.return_value = sample_judge_list.model_dump()
                    with patch("cli.session.request", return_value=mock_response):
                        result = runner.invoke(cli, ["judge", "list"])
                        assert result.exit_code == 0
                        assert (
                            "Test Judge 1" in result.output
                            or "Test Judge 2" in result.output
                        )
                        assert (
                            session.headers.get("Authorization") == "Api-Key tmpkey-123"
                        )
